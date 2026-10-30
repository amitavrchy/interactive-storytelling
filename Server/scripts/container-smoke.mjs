import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const apiName = `lighthouse-api-check-${process.pid}`;
const clientName = `lighthouse-client-check-${process.pid}`;
function docker(args, env = process.env) {
  const result = spawnSync('docker', args, { encoding: 'utf8', env });
  if (result.status !== 0)
    throw new Error(result.stderr || 'Docker command failed.');
  return result.stdout.trim();
}
async function healthy(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      /* Container is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Container did not become healthy: ${url}`);
}
try {
  docker(
    [
      'run',
      '--detach',
      '--name',
      apiName,
      '--network',
      'host',
      '-e',
      'DATABASE_URL',
      '-e',
      'JWT_SECRET',
      '-e',
      'CLIENT_ORIGIN',
      '-e',
      'PORT=4400',
      '-e',
      'STORAGE_MODE=database',
      'lighthouse-api:verify',
    ],
    {
      ...process.env,
      JWT_SECRET: randomBytes(48).toString('hex'),
      CLIENT_ORIGIN: 'https://story.example.test',
    },
  );
  await healthy('http://127.0.0.1:4400/health');
  const chapters = await (await fetch('http://127.0.0.1:4400/chapters')).json();
  assert.equal(chapters.length, 6);
  const guest = await fetch('http://127.0.0.1:4400/progress');
  assert.equal(guest.status, 401);
  assert.equal(guest.headers.get('cache-control'), 'no-store');
  docker([
    'run',
    '--detach',
    '--name',
    clientName,
    '--network',
    'host',
    '-e',
    'PORT=5300',
    'lighthouse-client:verify',
  ]);
  const home = await healthy('http://127.0.0.1:5300');
  assert.match(await home.text(), /The Last Lighthouse/);
  assert.equal(home.headers.get('x-powered-by'), null);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(
    (await fetch('http://127.0.0.1:5300/images/north-point.webp')).status,
    200,
  );
  assert.equal(
    (await fetch('http://127.0.0.1:5300/ending/beacon/opengraph-image')).status,
    200,
  );
  console.log(
    'Production client and API containers served the app, public assets, OG image and PostgreSQL content.',
  );
} finally {
  // These names belong only to the containers created by this process.
  for (const name of [apiName, clientName])
    spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore' });
}
