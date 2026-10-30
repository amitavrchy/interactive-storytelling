import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { rmSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import request from 'supertest';

const port = 4200;
const base = `http://127.0.0.1:${port}`;
const dataFile = resolve(`.data/integration-${process.pid}.json`);
let server: ChildProcess;
let token = '';
let adminToken = '';
let logs = '';
const password = 'integration-only-password-0123';
const progress = {
  chapterIndex: 4,
  furthestChapter: 4,
  flags: ['shore', 'keeper', 'storm', 'choice', 'dawn'],
  ending: 'rescue',
  completed: false,
  reducedMotion: true,
  captions: true,
};
async function start() {
  server = spawn(process.execPath, ['dist/main.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      STORAGE_MODE: 'file',
      DATA_FILE: dataFile,
      NODE_ENV: 'test',
      JWT_SECRET: 'integration-only-signing-key-at-least-32-characters',
      ADMIN_EMAIL: 'admin@example.test',
      ADMIN_PASSWORD: password,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', (d) => {
    logs += String(d);
  });
  server.stderr?.on('data', (d) => {
    logs += String(d);
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {
      /* wait for bootstrap */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`API did not start: ${logs}`);
}
async function stop() {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
}
beforeAll(start, 15000);
afterAll(async () => {
  await stop();
  rmSync(dataFile, { force: true });
}, 10000);

describe('Real compiled API integration', () => {
  it('serves six seeded chapters and filters archive flags', async () => {
    const chapters = await request(base).get('/chapters').expect(200);
    expect(chapters.body).toHaveLength(6);
    expect(chapters.body[0].paragraphs).toHaveLength(3);
    await request(base).get('/chapters/missing').expect(404);
    const lore = await request(base).get('/lore?unlock=shore').expect(200);
    expect(lore.body).toHaveLength(1);
  });
  it('validates auth and rejects privilege injection', async () => {
    await request(base)
      .post('/auth/register')
      .send({ email: 'invalid', name: 'A', password: 'short' })
      .expect(400);
    await request(base)
      .post('/auth/register')
      .send({
        email: 'reader@example.test',
        name: 'Reader',
        password,
        role: 'ADMIN',
      })
      .expect(400);
    const response = await request(base)
      .post('/auth/register')
      .send({ email: 'reader@example.test', name: 'Reader', password })
      .expect(201);
    token = response.body.accessToken;
    expect(response.body.user.role).toBe('READER');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    await request(base)
      .post('/auth/register')
      .send({ email: 'reader@example.test', name: 'Reader', password })
      .expect(409);
  });
  it('authenticates case-insensitively and rejects invalid credentials', async () => {
    await request(base)
      .post('/auth/login')
      .send({ email: 'READER@example.test', password })
      .expect(201);
    await request(base)
      .post('/auth/login')
      .send({ email: 'reader@example.test', password: 'incorrect' })
      .expect(401);
    await request(base)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(base)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
    const admin = await request(base)
      .post('/auth/login')
      .send({ email: 'admin@example.test', password })
      .expect(201);
    adminToken = admin.body.accessToken;
  });
  it('isolates cloud progress and rejects invalid state', async () => {
    await request(base).get('/progress').expect(401);
    await request(base)
      .put('/progress')
      .send(progress)
      .expect(200)
      .expect((res) => expect(res.body.saved).toBe(false));
    await request(base)
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...progress, chapterIndex: 99 })
      .expect(400);
    await request(base)
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(progress)
      .expect(200);
    const restored = await request(base)
      .get('/progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(restored.body).toMatchObject(progress);
    const other = await request(base)
      .post('/auth/register')
      .send({ email: 'other@example.test', name: 'Other', password })
      .expect(201);
    await request(base)
      .get('/progress')
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .expect(200)
      .expect((res) => expect(res.text).toBe(''));
  });
  it('prevents ending-less progress from bypassing the choice', async () => {
    const response = await request(base)
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...progress,
        chapterIndex: 5,
        furthestChapter: 5,
        ending: null,
        completed: true,
        flags: ['complete', 'dawn', 'shore'],
      })
      .expect(200);
    expect(response.body).toMatchObject({
      chapterIndex: 3,
      furthestChapter: 3,
      completed: false,
      flags: ['shore'],
    });
    await request(base)
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(progress)
      .expect(200);
  });
  it('counts choices once per request and rejects conflicting retries', async () => {
    const requestId = randomUUID();
    await request(base)
      .post('/choices/the-last-light/vote')
      .send({ requestId, optionKey: 'rescue' })
      .expect(201);
    await request(base)
      .post('/choices/the-last-light/vote')
      .send({ requestId, optionKey: 'rescue' })
      .expect(201);
    await request(base)
      .post('/choices/the-last-light/vote')
      .send({ requestId, optionKey: 'beacon' })
      .expect(409);
    await request(base)
      .post('/choices/unknown/vote')
      .send({ requestId: randomUUID(), optionKey: 'rescue' })
      .expect(404);
    await request(base)
      .post('/choices/the-last-light/vote')
      .send({ requestId: randomUUID(), optionKey: 'invalid' })
      .expect(400);
    const stats = await request(base)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(stats.body.total).toBe(1);
  });
  it('protects CMS and analytics from readers and anonymous callers', async () => {
    await request(base).get('/admin/analytics').expect(401);
    await request(base)
      .get('/admin/chapters')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    await request(base)
      .delete('/admin/lore/the-letter')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
  it('publishes chapter JSON, validates content and protects core chapters', async () => {
    const all = await request(base)
      .get('/admin/chapters')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const { id, ...first } = all.body[0];
    void id;
    const edited = {
      ...first,
      title: 'A test title',
      contentJson: { ...first.contentJson, caption: 'A test caption.' },
    };
    await request(base)
      .put(`/admin/chapters/${first.slug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(edited)
      .expect(200);
    await request(base)
      .get(`/chapters/${first.slug}`)
      .expect(200)
      .expect((res) => expect(res.body.title).toBe('A test title'));
    await request(base)
      .put(`/admin/chapters/${first.slug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...edited,
        contentJson: { ...edited.contentJson, paragraphs: 'invalid' },
      })
      .expect(400);
    await request(base)
      .delete(`/admin/chapters/${first.slug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    await request(base)
      .put(`/admin/chapters/${first.slug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(first)
      .expect(200);
  });
  it('creates, updates and deletes lore entries', async () => {
    const entry = {
      slug: 'test-memory',
      title: 'Test memory',
      body: 'A little light.',
      category: 'Object',
      date: '1987',
      unlockFlag: 'complete',
    };
    await request(base)
      .post('/admin/lore')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(entry)
      .expect(201);
    await request(base)
      .put('/admin/lore/test-memory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...entry, title: 'Updated memory' })
      .expect(200);
    await request(base)
      .get('/lore?unlock=complete')
      .expect(200)
      .expect((res) =>
        expect(
          res.body.some((e: { title: string }) => e.title === 'Updated memory'),
        ).toBe(true),
      );
    await request(base)
      .delete('/admin/lore/test-memory')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
  it('persists account, progress and analytics across a process restart', async () => {
    expect(JSON.parse(readFileSync(dataFile, 'utf8')).users).toHaveLength(3);
    await stop();
    await start();
    await request(base)
      .get('/progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => expect(res.body.ending).toBe('rescue'));
    await request(base)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => expect(res.body.total).toBe(1));
  });
});
