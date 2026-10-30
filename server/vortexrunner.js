import { fork } from 'child_process';
import path from 'path';

const scripts = ['./vortexbridge.js', './tunnelrun.js'];

const processes = [];

scripts.forEach(scriptPath => {
  const absolutePath = path.resolve(scriptPath);
  console.log(`[+] Memulai child process: ${scriptPath}`);

  const child = fork(absolutePath, [], {
    stdio: 'inherit',
  });

  processes.push({ name: scriptPath, process: child });

  child.on('error', err => {
    console.error(`[!] Gagal menjalankan ${scriptPath}:`, err.message);
  });

  child.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(`[*] ${scriptPath} berhenti dengan exit code: ${code}`);
    } else if (signal !== null) {
      console.log(`[*] ${scriptPath} dihentikan oleh signal: ${signal}`);
    }
  });
});

function cleanup() {
  console.log('\n[!] Menghentikan semua child process...');
  processes.forEach(({ name, process }) => {
    if (!process.killed) {
      process.kill('SIGTERM');
      console.log(`[-] Menutup ${name}`);
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
