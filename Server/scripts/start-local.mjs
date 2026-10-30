import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const server = spawn(process.execPath, ['dist/main.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, STORAGE_MODE: 'file' },
  stdio: 'inherit',
});
process.on('SIGINT', () => server.kill());
process.on('SIGTERM', () => server.kill());
server.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
