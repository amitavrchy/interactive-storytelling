# The Last Lighthouse · Server

NestJS API with Prisma/PostgreSQL, validated JWT accounts, cloud progress, idempotent choice telemetry and an administrator-only editorial API.

## Run

From `Server/`, install dependencies and copy `.env.example` to `.env`:

```sh
npm ci
npm run build
npm run start:local
```

`start:local` explicitly uses the durable development file adapter in `.data/`. It does not need PostgreSQL and is rejected in production. The normal API port is 4000.

For PostgreSQL, configure `DATABASE_URL`, `STORAGE_MODE=database`, `JWT_SECRET` and `CLIENT_ORIGIN` in `.env`, then:

```sh
docker compose up -d
npm run db:migrate
npm run start:dev
```

Chapters and lore seed with create-only upserts, preserving CMS changes. Canonical narrative source is `content/story.json`; `npm run content:sync` updates this app's compiled seed and `../Client/src/content/story.json`. `npm run content:check` detects drift without changing files.

## API

Public: `GET /health`, `GET /chapters`, `GET /chapters/:slug`, `GET /lore?unlock=shore,keeper`, `POST /choices/the-last-light/vote`, `POST /auth/register`, `POST /auth/login`.

JWT: `GET /auth/me`, `GET /progress`, `PUT /progress`. Anonymous progress writes explicitly return a local-only response. Authenticated requests never accept a caller-supplied user ID. Auth, private progress and studio responses cannot be cached.

ADMIN: `GET /admin/analytics`; GET/POST/PUT/DELETE under `/admin/chapters` and `/admin/lore`. PUT/DELETE end in `/:slug`. Core story chapters cannot be deleted or unpublished. Write DTOs reject unknown fields.

Choice request IDs are unique; retries do not increment a total twice. Authentication and voting are rate-limited with bounded memory. Proxy forwarding is trusted only for the configured number of hops (default zero).

## Production and verification

```sh
npm run build
npm run db:migrate
npm run start:prod
```

Set `NODE_ENV=production`, a real PostgreSQL URL, a non-placeholder signing secret of at least 32 characters and an explicit frontend origin. Invalid settings fail startup. The runtime Docker image runs as the node user, contains production dependencies only and has a health check. Migrations use the builder image as a separate one-off release job.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete Docker Compose configuration, TLS routing and administrator setup.

`npm test` runs unit/configuration checks. `npm run test:e2e` compiles and tests a real isolated API process. `npm run test:postgres` is a production-mode smoke test for a **disposable** PostgreSQL database; CI provisions one for it. The frontend acceptance suite lives in `Client/`.
