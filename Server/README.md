# The Last Lighthouse · story API

NestJS API with Prisma/PostgreSQL, a development file adapter, validated JWT accounts, saved progress, idempotent choice telemetry and an administrator-only CMS. Read the [project README](../README.md) for full setup.

`npm run start:dev` starts the API with `Server/.env`. `npm run build` compiles it; `npm run start:prod` runs the result. `npm run test:e2e` compiles and tests a real isolated API process. `npm run db:migrate` applies committed PostgreSQL migrations.

Public: `GET /health`, `GET /chapters`, `GET /chapters/:slug`, `GET /lore?unlock=shore,keeper`, `POST /choices/the-last-light/vote`, `POST /auth/register`, `POST /auth/login`.

JWT: `GET /auth/me`, `GET /progress`, `PUT /progress`. Anonymous `PUT /progress` returns an explicit local-only response. Authenticated requests never accept a caller-supplied user ID.

ADMIN: `GET /admin/analytics`, GET/POST/PUT/DELETE under `/admin/chapters` and `/admin/lore`. PUT/DELETE routes end in `/:slug`. The six core chapters cannot be deleted or unpublished. All write DTOs reject unknown fields.

The backend Docker image reads secrets at runtime, runs as the node user and exposes port 4000. Deploy database migrations separately before starting production.
