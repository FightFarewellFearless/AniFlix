const express = require('express');
const sharp = require('sharp');
const archiver = require('archiver');
const p_limit = require('p-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');
const { execSync, spawn } = require('child_process');
const { Transform } = require('stream');

let gotScraping;

// === DEBUG MODE TOGGLE ===
const DEBUG_MODE = true;
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG - ${new Date().toISOString()}]`, ...args);
  }
}

const TOKEN_STORAGE = new Map();

const app = express();
app.set('trust proxy', true);
const PORT = 10282; // process.env.PORT || process.env.SERVER_PORT || 20132;
const TOR_PROXY_PORT = 9050;
const TIMEOUT_MS = 20000;
const MAX_RETRIES = 5;
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

class BandwidthThrottle extends Transform {
  constructor(bytesPerSecond) {
    super();
    this.bytesPerSecond = bytesPerSecond;
    this.passedBytes = 0;
    this.startTime = Date.now();
  }

  _transform(chunk, encoding, callback) {
    this.passedBytes += chunk.length;
    const now = Date.now();
    if (now - this.startTime > 5000) {
      this.startTime = now;
      this.passedBytes = chunk.length;
    }
    const expectedTime = (this.passedBytes / this.bytesPerSecond) * 1000;
    const elapsedTime = now - this.startTime;
    const delay = expectedTime - elapsedTime;
    if (delay > 0) {
      setTimeout(() => {
        this.push(chunk);
        callback();
      }, delay);
    } else {
      this.push(chunk);
      callback();
    }
  }
}

// ==========================================
// HELPER: URL RESOLUTION WITH QUERY INHERITANCE
// ==========================================
function resolveUrlWithQuery(targetUrlStr, parentUrlStr) {
  try {
    const parentUrl = new URL(parentUrlStr);
    const resolvedUrl = new URL(targetUrlStr, parentUrl);

    if (!targetUrlStr.includes('?') && parentUrl.search) {
      resolvedUrl.search = parentUrl.search;
    } else if (parentUrl.search) {
      parentUrl.searchParams.forEach((value, key) => {
        if (!resolvedUrl.searchParams.has(key)) {
          resolvedUrl.searchParams.set(key, value);
        }
      });
    }

    return resolvedUrl.toString();
  } catch (e) {
    return targetUrlStr;
  }
}

// ==========================================
// 1. INTERNAL TOR SETUP
// ==========================================
let torProcess = null;
async function setupInternalTor() {
  if (!fs.existsSync('./tor/tor')) {
    console.log('📥 Downloading Internal Tor binary...');
    try {
      execSync(
        `curl -sSL -o tor-bundle.tar.gz https://dist.torproject.org/torbrowser/15.0.7/tor-expert-bundle-linux-x86_64-15.0.7.tar.gz`,
        { stdio: 'inherit' },
      );
      execSync(`tar -xf tor-bundle.tar.gz`, { stdio: 'inherit' });
      execSync('chmod +x ./tor/tor');
      fs.unlinkSync('tor-bundle.tar.gz');
    } catch (err) {
      return false;
    }
  }
  const torrcConfig = `StrictNodes 1\nDataDirectory ./tor-data\nSocksPort 127.0.0.1:${TOR_PROXY_PORT}\nGeoIPFile ./geoip\nGeoIPv6File ./geoip6`;
  fs.writeFileSync('./torrc', torrcConfig);
  torProcess = spawn('./tor/tor', ['-f', './torrc'], {
    env: { ...process.env, LD_LIBRARY_PATH: './tor' },
  });
  return new Promise(resolve => {
    torProcess.stdout.on('data', data => {
      if (data.toString().includes('Bootstrapped 100%')) resolve(true);
    });
    setTimeout(() => resolve(false), 30000);
  });
}

let comicAgent = null;
async function initTorProxy() {
  const torStarted = await setupInternalTor();
  if (!torStarted) return;

  let SocksProxyAgent;
  try {
    SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent;
  } catch (err) {
    try {
      const module = await import('socks-proxy-agent');
      SocksProxyAgent = module.SocksProxyAgent;
    } catch (e) {
      console.error("❌ CRITICAL: You need to run 'npm install socks-proxy-agent'");
      process.exit(1);
    }
  }

  comicAgent = new SocksProxyAgent(`socks5h://127.0.0.1:${TOR_PROXY_PORT}`);
}
initTorProxy();

// ==========================================
// 2. CORE HLS & PROXY LOGIC (AUTO RENEW SYSTEM)
// ==========================================
const MAP_CACHE = new Map();
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

async function getOrRotateToken(
  claim,
  redeemUrl,
  expiresTokenAt,
  renewalToken,
  claimExpiresAt,
  didCookie,
) {
  if (!claim && !renewalToken) return null;

  const now = Math.floor(Date.now() / 1000);
  const storageKey = claim || renewalToken;
  let entry = TOKEN_STORAGE.get(storageKey);

  if (!entry) {
    entry = {
      token: null,
      expiresTokenAt: expiresTokenAt ? Number(expiresTokenAt) : 0,
      claim: claim || null,
      claimExpiresAt: claimExpiresAt ? Number(claimExpiresAt) : 0,
      renewalToken: renewalToken || null,
      redeemUrl: redeemUrl || null,
    };
    TOKEN_STORAGE.set(storageKey, entry);
  }

  gotScraping ??= (await import('got-scraping')).gotScraping;

  let baseOrigin = 'https://z2.idlixku.com';
  if (entry.redeemUrl && entry.redeemUrl.startsWith('http')) {
    baseOrigin = new URL(entry.redeemUrl).origin;
  }

  // TAHAP 1: Refresh Claim jika Claim mendekati kadaluarsa (<= 60s)
  if (entry.renewalToken && (!entry.claimExpiresAt || entry.claimExpiresAt < now + 60)) {
    debugLog('🔄 Claim expired or close to expiration. Refreshing claim via renewalToken...');
    try {
      const refreshEndpoint = `${baseOrigin}/api/watch/session/refresh-claim`;
      const response = await gotScraping.post(refreshEndpoint, {
        json: { renewalToken: entry.renewalToken },
        headers: {
          Referer: `${baseOrigin}/`,
          Origin: baseOrigin,
          'Content-Type': 'application/json',
          Cookie: didCookie ? `did=${didCookie}` : '',
        },
        responseType: 'json',
      });

      const resBody = response.body;
      debugLog('📩 Refresh Claim Body:', JSON.stringify(resBody));

      if (resBody && resBody.claim) {
        entry.claim = resBody.claim;
        if (resBody.claimExpiresAt) entry.claimExpiresAt = Number(resBody.claimExpiresAt);
        if (resBody.renewalToken) entry.renewalToken = resBody.renewalToken;
        if (resBody.redeemUrl) entry.redeemUrl = resBody.redeemUrl;
        debugLog(`✅ Claim Refreshed! Valid until Unix: ${entry.claimExpiresAt}`);
      }
    } catch (e) {
      console.error('❌ Refresh Claim Failed:', e.message);
    }
  }

  // TAHAP 2: Redeem Token streaming (t=) jika token stream kadaluarsa (<= 30s)
  if (entry.claim && (!entry.token || entry.expiresTokenAt < now + 30)) {
    debugLog('🔄 Stream token expired or close to expiration. Redeeming via claim...');
    try {
      let targetRedeem = entry.redeemUrl || '/api/watch/session/redeem';
      if (!targetRedeem.startsWith('http')) {
        if (!targetRedeem.startsWith('/api/') && targetRedeem.startsWith('/watch/')) {
          targetRedeem = '/api' + targetRedeem;
        }
        targetRedeem = `${baseOrigin}${targetRedeem.startsWith('/') ? '' : '/'}${targetRedeem}`;
      }

      const response = await gotScraping.post(targetRedeem, {
        json: { claim: entry.claim, mode: 'browser' },
        headers: {
          Referer: `${baseOrigin}/`,
          Origin: baseOrigin,
          'Content-Type': 'application/json',
          Cookie: didCookie ? `did=${didCookie}` : '',
        },
        responseType: 'json',
      });

      const resBody = response.body;
      debugLog('📩 Redeem Body:', JSON.stringify(resBody));

      if (resBody && resBody.url) {
        const parsedUrl = new URL(resBody.url);
        const newToken = parsedUrl.searchParams.get('t');
        if (newToken) {
          entry.token = newToken;
          if (resBody.expiresAt) entry.expiresTokenAt = Number(resBody.expiresAt);
          TOKEN_STORAGE.set(storageKey, entry);
          if (entry.claim) TOKEN_STORAGE.set(entry.claim, entry);
          debugLog(`✅ Stream Token Renewed! Expires at Unix: ${entry.expiresTokenAt}`);
        }
      }
    } catch (e) {
      console.error('❌ Redeem Token Failed:', e.message);
    }
  }

  return entry.token;
}

function fetchWithRetry(url, options = {}, attempt = 1) {
  return new Promise((resolve, reject) => {
    debugLog(`🌐 Fetching [Attempt ${attempt}]: ${url.substring(0, 150)}...`);
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(
      url,
      {
        method: options.method || 'GET',
        agent: options.agent || (url.startsWith('https') ? httpsAgent : httpAgent),
        headers: { 'User-Agent': USER_AGENT, ...(options.headers || {}) },
        timeout: TIMEOUT_MS,
      },
      res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          debugLog(`↪️ Redirecting to: ${res.headers.location}`);
          return fetchWithRetry(new URL(res.headers.location, url).toString(), options, attempt + 1)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode >= 400) {
          debugLog(`⚠️ WARNING: Status Code ${res.statusCode} from ${url}`);
        }

        if (options.returnHeadersOnly) {
          res.resume();
          return resolve(res.headers);
        }

        if (options.returnStream) return resolve(res);

        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () =>
          resolve(options.returnBinary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString()),
        );
      },
    );

    req.on('error', err => {
      debugLog(`❌ Fetch error on ${url}:`, err.message);
      if (attempt <= MAX_RETRIES) {
        setTimeout(
          () =>
            fetchWithRetry(url, options, attempt + 1)
              .then(resolve)
              .catch(reject),
          500 * attempt,
        );
      } else reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

function syncToken(targetUrl, token) {
  if (!token) return targetUrl;
  try {
    const urlObj = new URL(targetUrl);
    urlObj.searchParams.set('t', token);
    return urlObj.toString();
  } catch {
    return targetUrl;
  }
}

function filterManifestByResolution(manifest, targetRes) {
  if (!targetRes || targetRes === 'Auto') return manifest;
  const lines = manifest.split('\n');
  const result = [];
  let skipNextLine = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (skipNextLine) {
      skipNextLine = false;
      continue;
    }
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      if (line.includes(`NAME="${targetRes}"`) || line.includes(`RESOLUTION=${targetRes}`))
        result.push(line);
      else skipNextLine = true;
    } else result.push(line);
  }
  return result.join('\n');
}

function rewriteManifestToLocalProxy(
  data,
  parentManifestUrl,
  masterResolution,
  token,
  claim,
  redeemUrl,
  localBaseUrl,
  expiresTokenAt,
  renewalToken,
  claimExpiresAt,
  didCookie,
) {
  const lines = data.split('\n');
  let result = '';
  const isMaster = data.includes('#EXT-X-STREAM-INF');

  const getProxyParams = fullUrl => {
    let params = `url=${encodeURIComponent(fullUrl)}`;
    if (claim) params += `&claim=${encodeURIComponent(claim)}`;
    if (redeemUrl) params += `&redeemUrl=${encodeURIComponent(redeemUrl)}`;
    if (expiresTokenAt) params += `&expiresTokenAt=${encodeURIComponent(expiresTokenAt)}`;
    if (renewalToken) params += `&renewalToken=${encodeURIComponent(renewalToken)}`;
    if (claimExpiresAt) params += `&claimExpiresAt=${encodeURIComponent(claimExpiresAt)}`;
    if (didCookie) params += `&didCookie=${encodeURIComponent(didCookie)}`;
    return params;
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      result += '\n';
      continue;
    }

    if (line.startsWith('#')) {
      if (line.includes('URI="')) {
        result +=
          line.replace(/URI="([^"]+)"/g, (_, url) => {
            const fullUrl = resolveUrlWithQuery(url, parentManifestUrl);
            const isMediaTag = line.startsWith('#EXT-X-MEDIA');
            const params = getProxyParams(fullUrl);

            if (isMaster && isMediaTag) {
              return `URI="${localBaseUrl}/api/proxy-playlist/stream.m3u8?res=${encodeURIComponent(masterResolution)}&${params}"`;
            } else {
              const safeHex = Buffer.from(fullUrl).toString('hex');
              return `URI="${localBaseUrl}/api/proxy-segment/${safeHex}.ts?${params}"`;
            }
          }) + '\n';
      } else {
        result += line + '\n';
      }
    } else {
      const fullUrl = resolveUrlWithQuery(line, parentManifestUrl);
      const params = getProxyParams(fullUrl);

      if (isMaster) {
        result += `${localBaseUrl}/api/proxy-playlist/stream.m3u8?res=${encodeURIComponent(masterResolution)}&${params}\n`;
      } else {
        const safeHex = Buffer.from(fullUrl).toString('hex');
        result += `${localBaseUrl}/api/proxy-segment/${safeHex}.ts?${params}\n`;
      }
    }
  }
  return result;
}

function parseMasterVariants(content, masterUrl) {
  if (!content.includes('#EXT-X-STREAM-INF')) return [];
  const lines = content.split('\n');
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#EXT-X-STREAM-INF')) {
      const bw = (lines[i].match(/BANDWIDTH=(\d+)/) || [0, 0])[1];
      const res = (lines[i].match(/RESOLUTION=(\d+x\d+)/) || [0, 'Unknown'])[1];
      const name = (lines[i].match(/NAME="([^"]+)"/) || [0, res !== 'Unknown' ? res : 'Auto'])[1];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('#'))) j++;
      if (j < lines.length) {
        const u = lines[j].trim();
        const fullUrl = resolveUrlWithQuery(u, masterUrl);
        variants.push({ bw: parseInt(bw), resolution: res, name: name, url: fullUrl });
      }
    }
  }
  variants.sort((a, b) => b.bw - a.bw);
  return variants;
}

async function getChildPlaylist(masterUrl, targetRes) {
  const manifest = await fetchWithRetry(masterUrl);
  const token = new URL(masterUrl).searchParams.get('t');
  const variants = parseMasterVariants(manifest, masterUrl);

  let childUrl = masterUrl;
  if (variants.length > 0) {
    let chosen = variants.find(v => v.name === targetRes) || variants[0];
    if (targetRes === 'Auto') chosen = variants[0];
    childUrl = syncToken(chosen.url, token);
  } else {
    childUrl = syncToken(masterUrl, token);
  }

  const content = await fetchWithRetry(childUrl);
  return { url: childUrl, content, token };
}

function parseSegments(content, playlistUrl, token) {
  const lines = content.split('\n');
  const segments = [];
  lines.forEach(line => {
    const l = line.trim();
    if (l && !l.startsWith('#')) {
      let segUrl = resolveUrlWithQuery(l, playlistUrl);
      if (token) segUrl = syncToken(segUrl, token);
      segments.push({ url: segUrl });
    }
  });
  return segments;
}

async function getSegmentSize(url) {
  try {
    const h = await fetchWithRetry(url, { method: 'HEAD', returnHeadersOnly: true });
    let len = parseInt(h['content-length']);
    if (!isNaN(len) && len > 0) return len;
    const rh = await fetchWithRetry(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      returnHeadersOnly: true,
    });
    if (rh['content-range']) {
      const match = rh['content-range'].match(/\/(\d+)$/);
      if (match) return parseInt(match[1]);
    }
    return 0;
  } catch {
    return 0;
  }
}

async function buildByteMap(hlsUrl, resParam, progressCallback, signal, getFromLocalFile = false) {
  const cacheKey = crypto
    .createHash('md5')
    .update(hlsUrl + resParam)
    .digest('hex');
  if (getFromLocalFile) {
    try {
      const cached = await fs.promises.readFile(`./cache/${cacheKey}.json`, 'utf8');
      return JSON.parse(cached);
    } catch {}
  }

  const {
    url: playlistUrl,
    content: playlistContent,
    token,
  } = await getChildPlaylist(hlsUrl, resParam);
  const segments = parseSegments(playlistContent, playlistUrl, token);

  const sizes = new Array(segments.length).fill(0);
  let completed = 0;
  const BATCH_SIZE = 5;
  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    if (signal && signal.aborted) throw new Error('Scan aborted');
    if (i % 100 === 0) await new Promise(r => setTimeout(r, 150));
    const batch = segments.slice(i, i + BATCH_SIZE).map(async (seg, offset) => {
      const idx = i + offset;
      if (!segments[idx]) return;
      try {
        sizes[idx] = await getSegmentSize(segments[idx].url);
      } catch (e) {
        sizes[idx] = 0;
      }
      completed++;
    });
    await Promise.all(batch);
    if (progressCallback) progressCallback(completed, segments.length);
  }

  let runningTotal = 0;
  const offsetMap = sizes.map(size => {
    const range = { start: runningTotal, end: runningTotal + size - 1, size };
    runningTotal += size;
    return range;
  });

  const data = { timestamp: Date.now(), totalSize: runningTotal, offsetMap, segments };
  MAP_CACHE.set(cacheKey, data);
  if (!fs.existsSync('./cache')) fs.mkdirSync('./cache');
  fs.promises.writeFile(`./cache/${cacheKey}.json`, JSON.stringify(data));
  return data;
}

// ==========================================
// 4. API ENDPOINTS
// ==========================================

app.get('/api/analyze', async (req, res) => {
  try {
    debugLog('➡️ Incoming /api/analyze request');
    let masterUrl = req.query.url;
    const { claim, redeemUrl, expiresTokenAt, renewalToken, claimExpiresAt, didCookie } = req.query;
    const targetRes = req.query.res || 'Auto';

    if (claim || renewalToken) {
      debugLog('⚙️ Session rotation check for analyze...');
      const activeToken = await getOrRotateToken(
        claim,
        redeemUrl,
        expiresTokenAt,
        renewalToken,
        claimExpiresAt,
        didCookie,
      );
      if (activeToken) {
        masterUrl = syncToken(masterUrl, activeToken);
      }
    }

    const manifest = await fetchWithRetry(masterUrl);
    const variants = parseMasterVariants(manifest, masterUrl);

    const {
      url: playlistUrl,
      content: playlistContent,
      token,
    } = await getChildPlaylist(masterUrl, targetRes);
    const segments = parseSegments(playlistContent, playlistUrl, token);

    const step = Math.max(1, Math.floor(segments.length / 20));
    let totalBytes = 0,
      samples = 0;
    for (let i = 0; i < segments.length; i += step) {
      const size = await getSegmentSize(segments[i].url);
      if (size > 0) {
        totalBytes += size;
        samples++;
      }
      if (samples >= 20) break;
    }
    const avg = samples > 0 ? totalBytes / samples : 0;
    const est = (avg * segments.length) / 1024 ** 3;

    debugLog(`✅ Analyze finished: ${segments.length} segments, ${est.toFixed(2)} GB`);
    res.json({ segments: segments.length, estSize: est.toFixed(2) + ' GB', variants: variants });
  } catch (e) {
    debugLog('❌ Analyze failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/deep-scan', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const sendEvent = data => {
    if (res.writableEnded || res.destroyed) return;
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      res.end();
    }
  };
  try {
    debugLog('➡️ Incoming /api/deep-scan request');
    let hlsUrl = req.query.url;
    const {
      claim,
      redeemUrl,
      expiresTokenAt,
      renewalToken,
      claimExpiresAt,
      didCookie,
      res: targetRes,
    } = req.query;

    if (claim || renewalToken) {
      const activeToken = await getOrRotateToken(
        claim,
        redeemUrl,
        expiresTokenAt,
        renewalToken,
        claimExpiresAt,
        didCookie,
      );
      if (activeToken) hlsUrl = syncToken(hlsUrl, activeToken);
    }
    await buildByteMap(hlsUrl, targetRes || 'Auto', (cur, total) => {
      sendEvent({ status: 'progress', pct: Math.floor((cur / total) * 100), cur, total });
    });
    sendEvent({ status: 'done' });
    if (!res.writableEnded) res.end();
  } catch (e) {
    sendEvent({ status: 'error', msg: e.message });
    if (!res.writableEnded) res.end();
  }
});

app.get(['/api/proxy-playlist', '/api/proxy-playlist/stream.m3u8'], async (req, res) => {
  try {
    debugLog('➡️ Incoming /api/proxy-playlist');
    let originalManifestUrl = req.query.url;
    const targetRes = req.query.res || 'Auto';
    const { claim, redeemUrl, expiresTokenAt, renewalToken, claimExpiresAt, didCookie } = req.query;

    if (claim || renewalToken) {
      const activeToken = await getOrRotateToken(
        claim,
        redeemUrl,
        expiresTokenAt,
        renewalToken,
        claimExpiresAt,
        didCookie,
      );
      if (activeToken) {
        originalManifestUrl = syncToken(originalManifestUrl, activeToken);
      }
    }

    const urlObj = new URL(originalManifestUrl);
    const token = urlObj.searchParams.get('t');

    let manifestText = await fetchWithRetry(originalManifestUrl);

    if (targetRes !== 'Auto' && manifestText.includes('#EXT-X-STREAM-INF')) {
      manifestText = filterManifestByResolution(manifestText, targetRes);
    }

    const localBaseUrl = `${req.get('host').includes('vortexbridge') ? 'https' : 'http'}://${req.get('host')}`;

    const rebuildHLS = rewriteManifestToLocalProxy(
      manifestText,
      originalManifestUrl,
      targetRes,
      token,
      claim,
      redeemUrl,
      localBaseUrl,
      expiresTokenAt,
      renewalToken,
      claimExpiresAt,
      didCookie,
    );

    res.set('Content-Type', 'application/vnd.apple.mpegurl').send(rebuildHLS);
  } catch (e) {
    debugLog('❌ Proxy Playlist Error:', e.message);
    res.sendStatus(500);
  }
});

app.get('/api/proxy-segment/:payload', async (req, res) => {
  try {
    const { claim, redeemUrl, expiresTokenAt, renewalToken, claimExpiresAt, didCookie } = req.query;
    const payload = req.params.payload;
    const hexStr = payload.replace(/\.ts$/, '');

    let targetUrl = Buffer.from(hexStr, 'hex').toString('utf8');

    if (claim || renewalToken) {
      const activeToken = await getOrRotateToken(
        claim,
        redeemUrl,
        expiresTokenAt,
        renewalToken,
        claimExpiresAt,
        didCookie,
      );
      if (activeToken) {
        targetUrl = syncToken(targetUrl, activeToken);
      }
    }

    const fetchOptions = {
      returnStream: true,
      headers: { 'User-Agent': USER_AGENT },
    };
    if (req.headers.range) fetchOptions.headers.Range = req.headers.range;

    const stream = await fetchWithRetry(targetUrl, fetchOptions);

    res.status(stream.statusCode);
    res.setHeader('Content-Type', stream.headers['content-type'] || 'application/octet-stream');
    if (stream.headers['content-range'])
      res.setHeader('Content-Range', stream.headers['content-range']);
    if (stream.headers['content-length'])
      res.setHeader('Content-Length', stream.headers['content-length']);

    stream.pipe(res);
  } catch (e) {
    debugLog('❌ Proxy Segment Error:', e.message);
    res.sendStatus(404);
  }
});

app.get('/api/download', async (req, res) => {
  let {
    url: hlsUrl,
    mode,
    name,
    res: targetRes,
    claim,
    redeemUrl,
    expiresTokenAt,
    renewalToken,
    claimExpiresAt,
    didCookie,
  } = req.query;
  debugLog(`➡️ Incoming /api/download (Mode: ${mode})`);
  const resParam = targetRes || 'Auto';
  const fileName = (name || 'video').replace(/[^a-z0-9_-]/gi, '_') + '.mp4';

  if (claim || renewalToken) {
    const activeToken = await getOrRotateToken(
      claim,
      redeemUrl,
      expiresTokenAt,
      renewalToken,
      claimExpiresAt,
      didCookie,
    );
    if (activeToken) hlsUrl = syncToken(hlsUrl, activeToken);
  }

  let extraParams = '';
  if (claim) extraParams += `&claim=${encodeURIComponent(claim)}`;
  if (redeemUrl) extraParams += `&redeemUrl=${encodeURIComponent(redeemUrl)}`;
  if (expiresTokenAt) extraParams += `&expiresTokenAt=${encodeURIComponent(expiresTokenAt)}`;
  if (renewalToken) extraParams += `&renewalToken=${encodeURIComponent(renewalToken)}`;
  if (claimExpiresAt) extraParams += `&claimExpiresAt=${encodeURIComponent(claimExpiresAt)}`;
  if (didCookie) extraParams += `&didCookie=${encodeURIComponent(didCookie)}`;

  if (mode === 'stream') {
    const proxy = `/api/proxy-playlist/stream.m3u8?url=${encodeURIComponent(hlsUrl)}&res=${encodeURIComponent(resParam)}${extraParams}`;
    return res.send(
      `<html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="background:#000;margin:0"><script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><video id="v" controls autoplay style="width:100vw;height:100vh"></video><script>var h=new Hls();h.loadSource("${proxy}");h.attachMedia(document.getElementById('v'));</script></body></html>`,
    );
  }

  if (mode === 'ffmpeg') {
    const proxyUrl = `http://127.0.0.1:${PORT}/api/proxy-playlist/stream.m3u8?url=${encodeURIComponent(hlsUrl)}&res=${encodeURIComponent(resParam)}${extraParams}`;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const ffmpegArgs = [
      '-protocol_whitelist',
      'file,http,https,tcp,tls,crypto',
      '-i',
      proxyUrl,
      '-map',
      '0:v?',
      '-map',
      '0:a?',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-f',
      'mp4',
      '-movflags',
      'frag_keyframe+empty_moov',
      'pipe:1',
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    const DOWNLOAD_SPEED = 1 * 1024 * 1024;
    const limiter = new BandwidthThrottle(DOWNLOAD_SPEED);

    ffmpegProcess.stdout.pipe(limiter).pipe(res);

    req.on('close', () => {
      ffmpegProcess.kill('SIGKILL');
      limiter.destroy();
    });

    ffmpegProcess.on('close', code => {
      if (!res.writableEnded) res.end();
    });
    return;
  }

  // LEGACY Download (Perfect Mode)
  try {
    const cacheKey = crypto
      .createHash('md5')
      .update(hlsUrl + resParam)
      .digest('hex');
    let cache = MAP_CACHE.get(cacheKey);
    let segments = [];

    if (mode === 'perfect' && !cache) {
      try {
        cache = await buildByteMap(hlsUrl, resParam, undefined, undefined, true);
      } catch (err) {
        return res.status(500).send('Failed to rebuild map.');
      }
    }

    if (mode === 'perfect' && cache) {
      segments = cache.segments;
    } else {
      const { url: pUrl, content: pContent, token } = await getChildPlaylist(hlsUrl, resParam);
      segments = parseSegments(pContent, pUrl, token);
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    let startIndex = 0,
      startByteOffset = 0;
    const range = req.headers.range;

    if (mode === 'perfect' && cache) {
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const map = cache.offsetMap.find(m => start >= m.start && start <= m.end);
        if (map) {
          startIndex = cache.offsetMap.indexOf(map);
          startByteOffset = start - map.start;
          res.status(206);
          res.setHeader(
            'Content-Range',
            `bytes ${start}-${cache.totalSize - 1}/${cache.totalSize}`,
          );
          res.setHeader('Content-Length', cache.totalSize - start);
        } else {
          return res.status(416).setHeader('Content-Range', `bytes */${cache.totalSize}`).end();
        }
      } else res.setHeader('Content-Length', cache.totalSize);
    }

    let isClosed = false;
    const controller = new AbortController();
    req.on('close', () => {
      isClosed = true;
      controller.abort();
    });
    res.on('error', () => (isClosed = true));

    const streamSegment = async i => {
      if (i >= segments.length || isClosed || res.writableEnded) return res.end();
      let segUrl = segments[i].url;

      if (claim || renewalToken) {
        const activeToken = await getOrRotateToken(
          claim,
          redeemUrl,
          expiresTokenAt,
          renewalToken,
          claimExpiresAt,
          didCookie,
        );
        if (activeToken) {
          segUrl = syncToken(segUrl, activeToken);
        }
      }

      const headers = {};
      if (i === startIndex && startByteOffset > 0) headers.Range = `bytes=${startByteOffset}-`;
      let attempt = 0,
        success = false;
      while (!success && attempt < 3 && !isClosed) {
        attempt++;
        try {
          const stream = await fetchWithRetry(segUrl, {
            headers,
            returnStream: true,
            signal: controller.signal,
          });
          await new Promise((resolveStream, rejectStream) => {
            stream.pipe(res, { end: false });
            stream.on('end', () => {
              success = true;
              resolveStream();
            });
            stream.on('error', err => rejectStream(err));
          });
        } catch (err) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      if (success) {
        startByteOffset = 0;
        streamSegment(i + 1);
      } else streamSegment(i + 1);
    };
    streamSegment(startIndex);
  } catch (e) {
    if (!res.headersSent) res.status(500).send('Error');
  }
});

function detectSubtitleFormat(content) {
  const h = content.slice(0, 1000).trim();
  if (/^WEBVTT/i.test(h)) return 'vtt';
  if (/^\[Script Info\]/i.test(h)) return 'ass';
  if (/^!zeus/i.test(h)) return 'ssa';
  if (/^\{\d+\}\{\d+\}/.test(h)) return 'sub';
  if (/<SAMI>/i.test(h)) return 'smi';
  if (/<tt\s/i.test(h)) return 'ttml';
  return 'srt';
}

app.get('/api/downloadSubtitle', async (req, res) => {
  try {
    const { url, name } = req.query;
    if (!url) return res.sendStatus(400);
    const subtitle = await fetchWithRetry(url);
    if (!subtitle) return res.sendStatus(404);
    const ext = detectSubtitleFormat(subtitle);
    const filename = `${(name || 'subtitle').replace(/\.[^/.]+$/, '')}.${ext}`;
    const mimeMap = {
      srt: 'application/x-subrip',
      vtt: 'text/vtt',
      ass: 'text/x-ssa',
      ssa: 'text/x-ssa',
      sub: 'text/vnd.dvb.subtitle',
      smi: 'application/smil',
      ttml: 'application/ttml+xml',
      txt: 'text/plain',
    };
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimeMap[ext] || 'text/plain');
    res.send(subtitle);
  } catch {
    res.sendStatus(500);
  }
});

// ==========================================
// 5. COMICS ENDPOINT WITH TOR SOCKS PROXY (.CBZ)
// ==========================================
const comicsID = new Map();

app.post('/api/requestComicsDownloadId', express.json(), (req, res) => {
  const data = req.body;
  if (!data) return res.status(400).json({ error: 'comicImages is required' });
  if (typeof data.name !== 'string' || !Array.isArray(data.comicImages))
    return res.status(400).json({ error: 'Invalid data format' });
  const id = Math.random().toString(36).substr(2, 9);
  comicsID.set(id, { timestamp: Date.now(), ...data });
  res.json({ id });
});

app.get('/api/getComicsDownload/:id', async (req, res) => {
  const { id } = req.params;
  const data = comicsID.get(id);

  if (!data) return res.status(404).json({ error: 'ID not found' });
  const safeName = (data.name || 'comics').replace(/[^a-z0-9 _-]/gi, '_');

  res.writeHead(200, {
    'Content-Type': 'application/vnd.comicbook+zip',
    'Content-Disposition': `attachment; filename="${safeName}.cbz"`,
  });

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  for (let i = 0; i < data.comicImages.length; i++) {
    const imgUrl = data.comicImages[i];
    if (res.writableEnded || res.destroyed) break;

    try {
      const imgStream = await fetchWithRetry(imgUrl, {
        returnStream: true,
        agent: (data.sourceLink ?? imgUrl).includes('softkomik') ? comicAgent : undefined,
        headers: {
          ...{
            'sec-ch-ua': '"Not(A:Brand";v="99", "Chromium";v="149", "Google Chrome";v="149"',
            'sec-ch-ua-arch': '',
            'sec-ch-ua-bitness': '',
            'sec-ch-ua-full-version': '149.0.6970.115',
            'sec-ch-ua-full-version-list':
              '"Not(A:Brand";v="99.0.0.0", "Chromium";v="149.0.6970.115", "Google Chrome";v="149.0.6970.115"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-model': 'Pixel 9',
            'sec-ch-ua-platform': 'Android',
            'sec-ch-ua-platform-version': '15',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
          },
          ...((data.sourceLink ?? imgUrl).includes('softkomik') ||
          (data.sourceLink ?? imgUrl).includes('komiku')
            ? { Referer: data.sourceLink ?? 'https://softkomik.co' }
            : {}),
        },
      });

      const contentType = imgStream.headers['content-type'] || '';
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';

      const pageNum = String(i + 1).padStart(3, '0');
      archive.append(imgStream, { name: `${pageNum}.${ext}` });

      await new Promise((resolve, reject) => {
        imgStream.on('end', resolve);
        imgStream.on('error', reject);
      });
    } catch (e) {
      console.error(`Failed to stream image ${imgUrl}:`, e.message);
    }
  }
  archive.finalize();
});

// ==========================================
// 6. FRONTEND HTML
// ==========================================
app.get('/', (req, res) => {
  const escapeHtml = value =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const queryData = req.query.data
    ? JSON.parse(Buffer.from(req.query.data, 'hex').toString())
    : null;
  const data = queryData || {};
  const title = escapeHtml(data.title || '');
  const vidLink = escapeHtml(data.streamingLink || '');
  const subLink = escapeHtml(data.subtitleLink || '');

  const claim = escapeHtml(data.claim || '');
  const redeemUrl = escapeHtml(data.redeemUrl || '');
  const renewalToken = escapeHtml(data.renewalToken || '');
  const expiresTokenAt = escapeHtml(data.expiresTokenAt || data.expiresAt || '');
  const claimExpiresAt = escapeHtml(data.claimExpiresAt || '');
  const didCookie = escapeHtml(data.didCookie || '');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>Vortex Bridge</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #080b10; --surface: #0d1117; --card: #111820; --border: #1e2d3d; --border-bright: #2a4060; --text: #cdd9e5; --text-dim: #4a6480; --text-muted: #2a3a4a; --cyan: #00d4ff; --cyan-dim: rgba(0, 212, 255, 0.12); --cyan-glow: rgba(0, 212, 255, 0.25); --green: #00e5a0; --green-dim: rgba(0, 229, 160, 0.1); --amber: #f59e0b; --red: #ff4757; --mono: 'Space Mono', monospace; --display: 'Syne', sans-serif; }
        body { font-family: var(--mono); background: var(--bg); color: var(--text); min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; padding: 20px 16px 60px; background-image: linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px); background-size: 40px 40px; }
        .wrapper { width: 100%; max-width: 480px; animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to   { opacity: 1; transform: translateY(0); } }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .logo { font-family: var(--display); font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
        .logo span { color: var(--cyan); }
        .version-badge { font-size: 10px; padding: 3px 8px; border: 1px solid var(--border-bright); border-radius: 4px; color: var(--text-dim); letter-spacing: 0.08em; }
        .title-box { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; position: relative; overflow: hidden; }
        .title-box::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--cyan); border-radius: 3px 0 0 3px; }
        .title-label { font-size: 9px; letter-spacing: 0.15em; color: var(--text-dim); text-transform: uppercase; margin-bottom: 5px; }
        #n { font-family: var(--display); font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.4; word-break: break-word; }
        .btn-analyze { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border-bright); border-radius: 8px; color: var(--text-dim); font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-bottom: 20px; }
        .btn-analyze:hover { border-color: var(--cyan); color: var(--cyan); }
        .btn-analyze.loading { color: var(--cyan); border-color: var(--cyan); animation: pulse 1.5s ease infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        #pan { display: none; animation: fadeUp 0.3s ease both; }
        .select-wrap { position: relative; margin-bottom: 14px; }
        .select-label { font-size: 9px; letter-spacing: 0.15em; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px; }
        select { width: 100%; padding: 11px 36px 11px 14px; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 8px; font-family: var(--mono); font-size: 13px; outline: none; -webkit-appearance: none; cursor: pointer; transition: border-color 0.2s; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234a6480' d='M6 8L0 0h12z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
        select:focus { border-color: var(--cyan); }
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .stat-box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; }
        .stat-label { font-size: 9px; letter-spacing: 0.15em; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px; }
        .stat-value { font-size: 15px; font-weight: 700; color: var(--cyan); }
        .divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 14px; color: var(--text-muted); font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .btn { width: 100%; padding: 13px 16px; border: none; border-radius: 8px; font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px; transition: all 0.15s; margin-bottom: 10px; text-transform: uppercase; -webkit-tap-highlight-color: transparent; }
        .btn:active { transform: scale(0.98); }
        .btn:last-child { margin-bottom: 0; }
        .btn-ffmpeg { background: var(--cyan); color: #000; }
        .btn-ffmpeg:hover { background: #33ddff; box-shadow: 0 0 20px var(--cyan-glow); }
        .btn-legacy { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0, 229, 160, 0.25); }
        .btn-legacy:hover { background: rgba(0, 229, 160, 0.18); border-color: var(--green); }
        .btn-legacy:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-stream { background: transparent; color: var(--text-dim); border: 1px solid var(--border); }
        .btn-stream:hover { border-color: var(--border-bright); color: var(--text); }
        .btn-sub { background: transparent; color: var(--text-dim); border: 1px solid var(--border); font-size: 11px; padding: 10px 16px; }
        .btn-sub:hover { border-color: var(--amber); color: var(--amber); }
        .progress-wrap { display: none; margin: 12px 0 4px; }
        .progress-header { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-dim); margin-bottom: 7px; }
        .progress-bar { height: 3px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--cyan), var(--green)); border-radius: 3px; transition: width 0.3s ease; position: relative; }
        .progress-fill::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 40px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3)); }
        #log { font-size: 10px; color: var(--text-dim); margin-top: 6px; letter-spacing: 0.05em; min-height: 14px; }
        .footer-notice { margin-top: 24px; padding: 10px 14px; border: 1px dashed var(--border); border-radius: 8px; font-size: 10px; color: var(--text-muted); letter-spacing: 0.08em; text-align: center; }
        .footer-notice strong { color: var(--text-dim); }
        #u, #subLink, #claim, #redeemUrl, #renewalToken, #expiresTokenAt, #claimExpiresAt, #didCookie { display: none; }
    </style>
</head>
<body>
    <div class="wrapper">

        <div class="header">
            <div class="logo">VORTEX<span>.</span>BRIDGE</div>
            <div class="version-badge">v11.3</div>
        </div>

        <div id="u">${vidLink}</div>
        <div id="subLink">${subLink}</div>
        
        <div id="claim">${claim}</div>
        <div id="redeemUrl">${redeemUrl}</div>
        <div id="renewalToken">${renewalToken}</div>
        <div id="expiresTokenAt">${expiresTokenAt}</div>
        <div id="claimExpiresAt">${claimExpiresAt}</div>
        <div id="didCookie">${didCookie || ''}</div>

        <div class="title-box">
            <div class="title-label">Source Title</div>
            <div id="n">${title || '—'}</div>
        </div>

        <button id="bAn" class="btn-analyze" onclick="an()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Analyze Source
        </button>

        <div id="pan">

            <div id="qCont" style="display:none">
                <div class="select-label">Resolution</div>
                <div class="select-wrap">
                    <select id="qSel" onchange="changeQ()"></select>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-box">
                    <div class="stat-label">Est. Size</div>
                    <div class="stat-value" id="sz">--</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Segments</div>
                    <div class="stat-value" id="seg">--</div>
                </div>
            </div>

            <div class="divider">Download</div>

            <button class="btn btn-ffmpeg" onclick="go('ffmpeg')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                FFmpeg → MP4
            </button>

            <button class="btn btn-legacy" id="bD" onclick="scan()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Legacy Raw Buffer
            </button>

            <div class="progress-wrap" id="pb">
                <div class="progress-header">
                    <span>Deep Scan</span>
                    <span id="pct">0%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" id="pf"></div></div>
                <div id="log"></div>
            </div>

            <button id="bSub" class="btn btn-sub" style="display:none" onclick="dlSub()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4m4 0h2M7 11h2m4 0h6"/></svg>
                Download Subtitle
            </button>

            <div class="divider">Stream</div>

            <button class="btn btn-stream" onclick="go('stream')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play in Browser
            </button>

        </div>

        <div class="footer-notice">
            <strong>⚠ RAM TUNNEL ONLY</strong> — no data written to server
        </div>

    </div>
    <script>
        let masterUrl = "";
        let selectedRes = "Auto";

        const claimData = document.getElementById('claim').textContent.trim();
        const redeemData = document.getElementById('redeemUrl').textContent.trim();
        const renewalData = document.getElementById('renewalToken').textContent.trim();
        const expiresTokenData = document.getElementById('expiresTokenAt').textContent.trim();
        const claimExpiresData = document.getElementById('claimExpiresAt').textContent.trim();
        const didCookie = document.getElementById('didCookie').textContent.trim();

        let extraParams = '';
        if (claimData) extraParams += \`&claim=\${encodeURIComponent(claimData)}\`;
        if (redeemData) extraParams += \`&redeemUrl=\${encodeURIComponent(redeemData)}\`;
        if (renewalData) extraParams += \`&renewalToken=\${encodeURIComponent(renewalData)}\`;
        if (expiresTokenData) extraParams += \`&expiresTokenAt=\${encodeURIComponent(expiresTokenData)}\`;
        if (claimExpiresData) extraParams += \`&claimExpiresAt=\${encodeURIComponent(claimExpiresData)}\`;
        if (didCookie) extraParams += \`&didCookie=\${encodeURIComponent(didCookie)}\`;

        const log = m => {
            document.getElementById('log').innerText = m;
        };

        window.onload = () => {
            const s = document.getElementById('subLink').textContent.trim();
            if (s) document.getElementById('bSub').style.display = 'flex';
            an();
        };

        async function an() {
            const v = document.getElementById('u').textContent.trim();
            if (!v) return;
            masterUrl = v;
            const btn = document.getElementById('bAn');
            btn.classList.add('loading');
            btn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> Analyzing...\`;
            try {
                const r = await fetch('/api/analyze?url=' + encodeURIComponent(masterUrl) + extraParams);
                const d = await r.json();

                document.getElementById('pan').style.display = 'block';
                document.getElementById('sz').innerText = d.estSize;
                document.getElementById('seg').innerText = d.segments;
                btn.style.display = 'none';

                const sel = document.getElementById('qSel');
                const cont = document.getElementById('qCont');
                sel.innerHTML = "";
                if (d.variants && d.variants.length > 0) {
                    cont.style.display = 'block';
                    const optAuto = document.createElement('option');
                    optAuto.value = "Auto"; optAuto.text = "Auto (Best)";
                    sel.appendChild(optAuto);
                    d.variants.forEach((v, idx) => {
                        const opt = document.createElement('option');
                        opt.value = v.name;
                        opt.text = (v.name || v.resolution || 'Stream ' + idx) + ' — ' + Math.round(v.bw / 1000) + 'k';
                        sel.appendChild(opt);
                    });
                    selectedRes = "Auto";
                } else { cont.style.display = 'none'; }
            } catch (e) {
                alert(e);
                btn.classList.remove('loading');
                btn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Analyze Source\`;
            }
        }

        function changeQ() {
            selectedRes = document.getElementById('qSel').value;
            document.getElementById('sz').innerText = '...';
            document.getElementById('seg').innerText = '...';
            
            fetch('/api/analyze?url=' + encodeURIComponent(masterUrl) + '&res=' + encodeURIComponent(selectedRes) + extraParams)
                .then(r => r.json())
                .then(d => {
                    document.getElementById('sz').innerText = d.estSize;
                    document.getElementById('seg').innerText = d.segments;
                }).catch(() => { document.getElementById('sz').innerText = 'ERR'; });
        }

        function scan() {
            document.getElementById('pb').style.display = 'block';
            const btn = document.getElementById('bD');
            btn.disabled = true;
            
            const es = new EventSource('/api/deep-scan?url=' + encodeURIComponent(masterUrl) + '&res=' + encodeURIComponent(selectedRes) + extraParams);
            
            es.onmessage = e => {
                const d = JSON.parse(e.data);
                if (d.status === 'progress') {
                    document.getElementById('pf').style.width = d.pct + '%';
                    document.getElementById('pct').innerText = d.pct + '%';
                    log('Scanning segments ' + d.cur + ' / ' + d.total);
                }
                if (d.status === 'done') { es.close(); go('perfect'); btn.disabled = false; }
                if (d.status === 'error') {
                    es.close();
                    alert('Scan Error: ' + d.msg);
                    log('Error: ' + d.msg);
                    btn.disabled = false;
                    document.getElementById('pb').style.display = 'none';
                    document.getElementById('pf').style.width = '0%';
                }
            };
            es.onerror = () => {
                if (es.readyState !== EventSource.CLOSED) {
                    es.close(); alert('Connection Lost'); btn.disabled = false;
                }
            };
        }

        function go(m) {
            const name = encodeURIComponent(document.getElementById('n').textContent.trim());
            window.location.href = \`/api/download?mode=\${m}&url=\${encodeURIComponent(masterUrl)}&res=\${encodeURIComponent(selectedRes)}&name=\${name}\${extraParams}\`;
        }

        function dlSub() {
            const u = document.getElementById('subLink').textContent.trim();
            const name = encodeURIComponent(document.getElementById('n').textContent.trim());
            if (u) window.location.href = \`/api/downloadSubtitle?url=\${encodeURIComponent(u)}&name=\${name}\`;
        }
    </script>
    <style>
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</body>
</html>`);
});

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.listen(PORT, () => {
  console.log(`🚀 Vortex Bridge v11.3 + Internal Tor Operational on Port ${PORT}`);
});
