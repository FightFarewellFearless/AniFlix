import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawn } from 'child_process';
import os from 'os';
import zlib from 'zlib';

// Konfigurasi Token Tunnel Cloudflare
const TUNNEL_TOKEN = process.env.CLOUDFLARE_TUNNEL_TOKEN || 'TOKEN';

function getBinaryDetails() {
  const platform = os.platform();
  const arch = os.arch();
  const binDir = path.resolve('./bin');

  let exeName = 'cloudflared';
  let downloadUrl = '';
  let isZip = false;

  if (platform === 'win32') {
    exeName = 'cloudflared.exe';
    const archMap = { x64: 'amd64', ia32: '32', arm64: 'arm64' };
    const cfArch = archMap[arch] || 'amd64';
    downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-${cfArch}.exe`;
  } else if (platform === 'linux') {
    const archMap = { x64: 'amd64', ia32: '32', arm: 'arm', arm64: 'arm64' };
    const cfArch = archMap[arch] || 'amd64';
    downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cfArch}`;
  } else if (platform === 'darwin') {
    const cfArch = arch === 'arm64' ? 'arm64' : 'amd64';
    downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${cfArch}.tgz`;
    isZip = true;
  } else {
    throw new Error(`Platform ${platform} tidak didukung secara otomatis.`);
  }

  return {
    binDir,
    exePath: path.join(binDir, exeName),
    downloadUrl,
    isZip,
    platform,
  };
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Gagal mengunduh binary. Status Code: ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });

      fileStream.on('error', err => {
        fs.unlink(destPath, () => reject(err));
      });
    });

    request.on('error', err => reject(err));
  });
}

async function ensureCloudflared(binaryInfo) {
  if (fs.existsSync(binaryInfo.exePath)) {
    console.log(`[+] Binary cloudflared ditemukan di: ${binaryInfo.exePath}`);
    return;
  }

  console.log(`[-] Binary cloudflared tidak ditemukan.`);
  console.log(`[+] Mengunduh dari ${binaryInfo.downloadUrl}...`);

  if (!fs.existsSync(binaryInfo.binDir)) {
    fs.mkdirSync(binaryInfo.binDir, { recursive: true });
  }

  await downloadFile(binaryInfo.downloadUrl, binaryInfo.exePath);

  if (binaryInfo.platform !== 'win32') {
    fs.chmodSync(binaryInfo.exePath, 0o755);
  }

  console.log(`[+] Download selesai: ${binaryInfo.exePath}`);
}

function runTunnel(exePath, token) {
  if (!token || token === 'ISIKAN_TOKEN_TUNNEL_ANDA_DI_SINI') {
    console.error('[!] Error: Token tunnel belum dikonfigurasi!');
    process.exit(1);
  }

  console.log('[+] Memulai Cloudflare Tunnel...');

  const tunnelProcess = spawn(exePath, ['tunnel', 'run', '--token', token], {
    stdio: 'inherit',
  });

  tunnelProcess.on('error', err => {
    console.error('[!] Gagal menjalankan proses cloudflared:', err.message);
  });

  tunnelProcess.on('close', code => {
    console.log(`[*] Proses tunnel berhenti dengan exit code: ${code}`);
  });
}

async function main() {
  try {
    const binaryInfo = getBinaryDetails();
    await ensureCloudflared(binaryInfo);
    runTunnel(binaryInfo.exePath, TUNNEL_TOKEN);
  } catch (err) {
    console.error('[!] Terjadi kesalahan:', err.message);
    process.exit(1);
  }
}

main();
