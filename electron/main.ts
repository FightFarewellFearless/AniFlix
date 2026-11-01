import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  session,
  protocol,
  nativeTheme,
  nativeImage,
  net,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import { autoUpdater } from 'electron-updater';
import { createServer } from 'http';
import * as fs from 'fs';
import * as os from 'os';
import log from 'electron-log';

// Force dark mode for Windows theme
nativeTheme.themeSource = 'dark';

// The Watch screen starts playback as soon as the metadata is available, which
// Chromium otherwise blocks as an "unsolicited" autoplay in a desktop window.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

/**
 * `<webview>` integration.
 *
 * `react-native-webview` is a native module and renders a "not supported"
 * placeholder in a browser, so the renderer shim renders a real Electron
 * `<webview>` element instead. Two things have to be prepared in the main
 * process for that:
 *
 * 1. `source={{ html }}` documents. A `<webview>` cannot load a `data:` URL
 *    (Chromium refuses top level data: navigations), so the HTML is written to
 *    a temporary file and loaded from `file://`. That also keeps local
 *    (`file://`) images working, which the CBZ reader depends on.
 * 2. `window.ReactNativeWebView.postMessage`. Every guest needs a preload
 *    script that exposes the bridge *before* the page runs, and that also
 *    executes `injectedJavaScriptBeforeContentLoaded` in the page's main world
 *    (used by the XHR intercepting session fetchers). The bridge depends on the
 *    per view script, so a small preload file is written per `<webview>`.
 */
const webviewWorkDirectory = path.join(os.tmpdir(), 'aniflix-webview');
let webviewSequence = 0;
const APP_SESSION_PARTITION = 'persist:aniflix';

// Keep renderer fetch(), <webview> guests, and the cookie bridge on the same
// Chromium cookie store. Relying on each component's implicit default session
// makes challenge cookies unavailable to subsequent renderer requests.
const getAppSession = () => session.fromPartition(APP_SESSION_PARTITION);

function buildWebviewPreloadScript(injectedJavaScriptBeforeContentLoaded?: string): string {
  const injected = injectedJavaScriptBeforeContentLoaded
    ? `// Runs in the page's main world, before any page script. Required by the
// XHR/fetch interceptors used by the comics session fetchers.
try {
  webFrame.executeJavaScript(${JSON.stringify(injectedJavaScriptBeforeContentLoaded)});
} catch (error) {
  console.error('[aniflix] injectedJavaScriptBeforeContentLoaded failed', error);
}`
    : '';

  return `const { contextBridge, ipcRenderer, webFrame } = require('electron');

const bridge = {
  postMessage: (data) => {
    ipcRenderer.sendToHost('message', data);
  },
};

try {
  contextBridge.exposeInMainWorld('ReactNativeWebView', bridge);
} catch (error) {
  window.ReactNativeWebView = bridge;
}

${injected}
`;
}

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Must match `appId` in electron-builder.yml. Without it Windows shows a
// generic icon for the taskbar entry and groups the app under "electron.app".
const APP_ID = 'com.aniflix.app';
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

/**
 * Resolve the application icon.
 *
 * The icon lives in `electron/assets` which is copied into the asar archive,
 * so the relative path is the same for dev (electron/dist) and for the
 * packaged app (resources/app.asar/dist).
 */
function resolveAsset(fileName: string): string | undefined {
  const candidates = [
    path.join(__dirname, '..', 'assets', fileName),
    path.join(app.getAppPath(), 'assets', fileName),
    path.join(process.resourcesPath, 'assets', fileName),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore unreadable candidate and try the next one
    }
  }
  return undefined;
}

const appIconPath = resolveAsset('icon.ico');
const appIconPngPath = resolveAsset('icon.png');

if (!appIconPath) {
  log.warn('Application icon not found - window/taskbar icon may be missing');
} else {
  // Fail fast (with a log) when the file exists but cannot be decoded.
  if (nativeImage.createFromPath(appIconPath).isEmpty()) {
    log.warn(`Application icon could not be decoded: ${appIconPath}`);
  }
}

autoUpdater.checkForUpdatesAndNotify();

// HTTP server for HLS segment proxy (replaces react-native-nitro-http-server)
const HLS_PROXY_PORT = 43621;
let hlsServer: ReturnType<typeof createServer> | null = null;

function startHlsServer() {
  if (hlsServer) return;
  hlsServer = createServer((req, res) => {
    // HLS manifest/segment proxy - will be implemented by renderer via IPC
    res.statusCode = 404;
    res.end('Not Found');
  });
  hlsServer.listen(HLS_PROXY_PORT, 'localhost', () => {
    log.info(`HLS proxy server listening on port ${HLS_PROXY_PORT}`);
  });
}

function stopHlsServer() {
  if (hlsServer) {
    hlsServer.close();
    hlsServer = null;
  }
}

let mainWindow: BrowserWindow | null = null;

/**
 * Media request headers.
 *
 * `<video>` and `hls.js` XHRs cannot set `Referer`, `Origin` or `User-Agent`
 * themselves (they are browser controlled headers). Several streaming hosts
 * (for example mp4upload) reject requests without the correct referer, so the
 * renderer registers a per-origin rule through `media:setHeaders` and the main
 * process applies it to every request for that hostname.
 */
type MediaHeaderRule = {
  hostname: string;
  headers: Record<string, string>;
};

const mediaHeaderRules: MediaHeaderRule[] = [];

const normalizeHeaderValue = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

function installMediaHeaderBridge() {
  getAppSession().webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...(details.requestHeaders ?? {}) };
    const privateRefererHeader = Object.keys(requestHeaders).find(
      key => key.toLowerCase() === 'x-aniflix-referer',
    );
    const privateReferer = privateRefererHeader
      ? requestHeaders[privateRefererHeader]
      : undefined;
    if (privateRefererHeader) {
      delete requestHeaders[privateRefererHeader];
    }
    let hostname = '';
    try {
      hostname = new URL(details.url).hostname;
    } catch {
      // Non HTTP(S) request; leave it untouched.
    }

    const rule = hostname
      ? mediaHeaderRules.find(candidate => candidate.hostname === hostname)
      : undefined;

    if (rule) {
      for (const [name, rawValue] of Object.entries(rule.headers)) {
        const value = normalizeHeaderValue(rawValue);
        if (!value) continue;
        const existing = Object.keys(requestHeaders).find(
          key => key.toLowerCase() === name.toLowerCase(),
        );
        if (existing) delete requestHeaders[existing];
        requestHeaders[name] = value;
      }
    }

    void getAppSession()
      .cookies.get({ url: details.url })
      .then(cookies => {
        if (cookies.length > 0) {
          const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
          const existingCookie = Object.keys(requestHeaders).find(
            key => key.toLowerCase() === 'cookie',
          );
          if (!existingCookie) {
            requestHeaders.Cookie = cookieHeader;
          }
        }
        if (privateReferer) {
          const existingReferer = Object.keys(requestHeaders).find(
            key => key.toLowerCase() === 'referer',
          );
          if (existingReferer) {
            delete requestHeaders[existingReferer];
          }
          requestHeaders.Referer = privateReferer;
        }
        callback({ requestHeaders });
      })
      .catch(error => {
        log.warn(`Unable to attach session cookies: ${String(error)}`);
        callback({ requestHeaders });
      });
  });
}

ipcMain.handle(
  'media:setHeaders',
  async (_event, payload: { url?: string; headers?: Record<string, string> }) => {
    if (!payload?.url) return { success: false };
    let hostname = '';
    try {
      hostname = new URL(payload.url).hostname;
    } catch {
      return { success: false };
    }

    const headers: Record<string, string> = {};
    for (const [name, rawValue] of Object.entries(payload.headers ?? {})) {
      const value = normalizeHeaderValue(rawValue);
      if (value) headers[name] = value;
    }

    const rule: MediaHeaderRule = { hostname, headers };
    const existingIndex = mediaHeaderRules.findIndex(candidate => candidate.hostname === hostname);
    if (existingIndex >= 0) mediaHeaderRules[existingIndex] = rule;
    else mediaHeaderRules.push(rule);

    if (mediaHeaderRules.length > 32) {
      mediaHeaderRules.splice(0, mediaHeaderRules.length - 32);
    }

    return { success: true };
  },
);

ipcMain.handle('media:clearHeaders', async () => {
  mediaHeaderRules.length = 0;
  return { success: true };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#141414',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      partition: APP_SESSION_PARTITION,
      webSecurity: false,
      allowRunningInsecureContent: true,
      // Playback continues while the window is in the background.
      backgroundThrottling: false,
      // The renderer shim for react-native-webview renders real <webview>
      // elements (see electron/src/shims/webView.tsx).
      webviewTag: true,
    },
    icon: appIconPath,
  });

  // Start HLS proxy server
  startHlsServer();

  // Load the app - in dev, load from Metro bundler; in prod, load from built files
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'renderer/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      log.error(`Renderer failed to load (${errorCode}): ${errorDescription} - ${validatedURL}`);
    },
  );
  mainWindow.webContents.on('did-finish-load', () => {
    log.info(`Renderer loaded: ${mainWindow?.webContents.getURL()}`);
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log.info(`Renderer console [${level}] ${sourceId}:${line} ${message}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log.error(`Renderer process exited: ${details.reason} (exit code ${details.exitCode})`);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    stopHlsServer();
    mainWindow = null;
  });

  // Handle deep link protocol: aniflix://
  protocol.registerFileProtocol('aniflix', (request, callback) => {
    const fileUrl = request.url.replace('aniflix://', '');
    const decodedUrl = decodeURIComponent(fileUrl);
    log.info(`Deep link received: ${decodedUrl}`);
    // Forward to renderer via IPC
    mainWindow?.webContents.send('deep-link-received', decodedUrl);
    callback({ path: path.join(__dirname, 'deeplink.html') });
  });
}

app.whenReady().then(async () => {
  installMediaHeaderBridge();

  // Leftover webview files from a previous (possibly crashed) session.
  await fs.promises
    .rm(webviewWorkDirectory, { recursive: true, force: true })
    .catch(() => undefined);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto-update events
autoUpdater.on('update-available', () => {
  log.info('Update available');
  mainWindow?.webContents.send('update-available');
});

(autoUpdater as any).on(
  'update-downloaded',
  (
    event: any,
    releaseNotes: any,
    releaseName: any,
    releaseDate: any,
    updateUrl: any,
    quitAndUpdate: any,
  ) => {
    log.info('Update downloaded');
    mainWindow?.webContents.send('update-downloaded', {
      releaseName,
      releaseDate,
      releaseNotes,
      updateUrl,
      quitAndUpdate,
    });
  },
);

// IPC: File save dialog (replaces PermissionsAndroid + react-native-blob-util download)
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result;
});

// IPC: File open dialog (replaces expo-document-picker)
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

// IPC: Open external URL
ipcMain.handle('shell:openExternal', async (event, urlString: string) => {
  return shell.openExternal(urlString);
});

// IPC: Show notification (replaces ToastAndroid)
ipcMain.handle('notification:show', async (event, options: { title: string; body?: string }) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title,
      body: options.body || '',
      icon: appIconPngPath ?? appIconPath,
    });
    notification.show();
    return { shown: true };
  }
  return { shown: false };
});

// IPC: Get app path for file storage
ipcMain.handle('app:getPath', async (event, name: string) => {
  return app.getPath(name as any);
});

// IPC: HLS proxy - forward manifest/segment requests
ipcMain.handle(
  'hls:proxy',
  async (
    event,
    { url, headers, range }: { url: string; headers?: Record<string, string>; range?: string },
  ) => {
    const fetch = (await import('node-fetch')).default || (globalThis as any).fetch;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers,
        ...(range ? { Range: range } : {}),
      },
    });
    const arrayBuffer = await response.arrayBuffer();
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: Buffer.from(arrayBuffer).toString('base64'),
    };
  },
);

ipcMain.handle(
  'film:request',
  async (
    _event,
    {
      url: requestUrl,
      method,
      headers,
      body,
    }: { url: string; method: string; headers?: Record<string, string>; body?: string },
  ) => {
    if (!/^https?:\/\//i.test(requestUrl)) {
      throw new Error(`Invalid film request URL: ${String(requestUrl)}`);
    }
    const cookies = await getAppSession().cookies.get({ url: requestUrl });
    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    const response = await net.fetch(requestUrl, {
      method,
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        Pragma: 'no-cache',
        Origin: 'https://z2.idlixku.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...headers,
      },
      body,
    });

    return { status: response.status, body: await response.text() };
  },
);

// IPC: Cookie management (replaces @preeternal/react-native-cookie-manager)
ipcMain.handle('cookies:get', async (event, url: string) => {
  const cookies = await getAppSession().cookies.get({ url });
  return cookies.reduce((acc: Record<string, string>, cookie) => {
    acc[cookie.name] = cookie.value;
    return acc;
  }, {});
});

ipcMain.handle(
  'cookies:set',
  async (event, { url, name, value }: { url: string; name: string; value: string }) => {
    await getAppSession().cookies.set({ url, name, value });
    return { success: true };
  },
);

ipcMain.handle('cookies:remove', async (event, { url, name }: { url: string; name: string }) => {
  await (getAppSession().cookies as any).remove({ url, name });
  return { success: true };
});

// IPC: Power save blocker (replaces expo-keep-awake)
ipcMain.handle('power:startBlocker', async () => {
  const { powerSaveBlocker } = require('electron');
  const id = powerSaveBlocker.start('prevent-display-sleep');
  return { id };
});

ipcMain.handle('power:stopBlocker', async (event, id: number) => {
  const { powerSaveBlocker } = require('electron');
  powerSaveBlocker.stop(id);
  return { success: true };
});

// Handle deep link from Windows (when app is already running)
app.on('open-url', (event, urlString) => {
  event.preventDefault();
  log.info(`Open URL: ${urlString}`);
  mainWindow?.webContents.send('deep-link-received', urlString);
});

// Handle protocol activation (when app is launched from deep link)
app.setAsDefaultProtocolClient('aniflix');

// IPC: create a `<webview>` guest for the react-native-webview shim.
ipcMain.handle(
  'webview:create',
  async (
    _event,
    payload: {
      uri?: string;
      html?: string;
      baseUrl?: string;
      userAgent?: string;
      headers?: Record<string, string>;
      injectedJavaScriptBeforeContentLoaded?: string;
    },
  ) => {
    const id = `wv-${Date.now()}-${webviewSequence++}`;

    await fs.promises.mkdir(webviewWorkDirectory, { recursive: true });
    const preloadPath = path.join(webviewWorkDirectory, `${id}.js`);
    await fs.promises.writeFile(
      preloadPath,
      buildWebviewPreloadScript(payload.injectedJavaScriptBeforeContentLoaded),
      'utf8',
    );

    let targetUrl = payload.uri ?? 'about:blank';

    if (payload.html != null) {
      let html = payload.html;
      // Honour `source.baseUrl` the same way react-native-webview does.
      if (payload.baseUrl) {
        const baseTag = `<base href="${payload.baseUrl}">`;
        html = /<head[^>]*>/i.test(html)
          ? html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`)
          : `${baseTag}${html}`;
      }
      const documentPath = path.join(webviewWorkDirectory, `${id}.html`);
      await fs.promises.writeFile(documentPath, html, 'utf8');
      targetUrl = url.pathToFileURL(documentPath).href;
    }

    // A `<webview>` has no `headers` attribute. The only header the app relies
    // on is `Cookie`, which is applied to the shared session so that both the
    // guest page and the app's own fetch() calls use it.
    const cookieHeader = payload.headers?.Cookie ?? payload.headers?.cookie;
    if (cookieHeader && payload.uri) {
      try {
        const parsed = new URL(payload.uri);
        const origin = `${parsed.protocol}//${parsed.host}/`;
        for (const part of cookieHeader.split(';')) {
          const separator = part.indexOf('=');
          if (separator <= 0) {
            continue;
          }
          const name = part.slice(0, separator).trim();
          const value = part.slice(separator + 1).trim();
          if (!name) {
            continue;
          }
          await getAppSession().cookies.set({ url: origin, name, value });
        }
      } catch (error) {
        log.warn(`Unable to apply <webview> cookies: ${String(error)}`);
      }
    }

    return {
      id,
      url: targetUrl,
      preload: url.pathToFileURL(preloadPath).href,
      partition: APP_SESSION_PARTITION,
    };
  },
);

ipcMain.handle('webview:dispose', async (_event, id: string) => {
  const preloadPath = path.join(webviewWorkDirectory, `${id}.js`);
  const documentPath = path.join(webviewWorkDirectory, `${id}.html`);
  await fs.promises.unlink(preloadPath).catch(() => undefined);
  await fs.promises.unlink(documentPath).catch(() => undefined);
  return { success: true };
});
