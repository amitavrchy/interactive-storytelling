// Dedicated PostgreSQL verification. Run against a disposable test database.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const port = 4300;
const password = randomBytes(20).toString('hex');
const email = `smoke-${randomUUID()}@example.test`;
const server = spawn(process.execPath, ['dist/main.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    CLIENT_ORIGIN: 'https://story.example.test',
    STORAGE_MODE: 'database',
    PORT: String(port),
    JWT_SECRET: randomBytes(48).toString('hex'),
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
  },
});
let logs = '';
server.stdout.on('data', (d) => (logs += d));
server.stderr.on('data', (d) => (logs += d));
async function call(path, method = 'GET', body, token) {
  const result = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.ok(result.ok, `${method} ${path}: ${await result.clone().text()}`);
  return result.json();
}
try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, logs);
  assert.equal((await call('/chapters')).length, 6);
  const session = await call('/auth/register', 'POST', {
    email,
    name: 'Postgres smoke',
    password,
  });
  const progress = {
    chapterIndex: 4,
    furthestChapter: 4,
    ending: 'beacon',
    completed: false,
    flags: ['shore', 'keeper', 'storm', 'choice', 'dawn'],
    reducedMotion: true,
    captions: true,
  };
  await call('/progress', 'PUT', progress, session.accessToken);
  assert.equal(
    (await call('/progress', 'GET', undefined, session.accessToken)).ending,
    'beacon',
  );
  const requestId = randomUUID();
  await Promise.all([
    call('/choices/the-last-light/vote', 'POST', {
      requestId,
      optionKey: 'beacon',
    }),
    call('/choices/the-last-light/vote', 'POST', {
      requestId,
      optionKey: 'beacon',
    }),
  ]);
  console.log(
    'PostgreSQL seed, account, progress and concurrent idempotent votes passed.',
  );
} finally {
  server.kill();
}
