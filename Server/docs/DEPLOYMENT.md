# Production deployment

Deployable source is contained in `Client/` and `Server/`. Production needs Node 22.12+ (images use Node 24), PostgreSQL, a public frontend origin, a public API origin and a signing secret. No real hosting account, domain or secret is committed.

## Containers

From `Server/`, copy `.env.production.example` to `.env.production` and replace all placeholders. `POSTGRES_PASSWORD` and the password in `DATABASE_URL` must match; URL-encode any reserved characters in the database URL. Generate a strong random `JWT_SECRET`. Configure the two public HTTPS origins before building the client; changing public variables requires a new frontend build.

```sh
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml up --build -d
```

Compose starts PostgreSQL and waits for its health check, runs the committed migration once, starts the API, and then starts the frontend after the API is healthy. Both runtime containers run without root privileges, have init processes, restart policies and health checks. The backend runtime excludes development dependencies; Prisma migration tooling stays in the builder image.

The frontend and API listen on host loopback ports 3000/4000 by default. Route the configured public HTTPS origins to those ports through your TLS reverse proxy. The database has no public host port. Set `TRUST_PROXY_HOPS` only to the actual number of trusted reverse-proxy hops; leave it zero when there is none.

Inspect status/logs from `Server/`:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail 100 api client migrate
```

Back up the `production-db` volume before schema changes and maintain database backups according to your hosting provider's process. Runtime file storage is intentionally disabled in production.

## Administrator

Optionally set an unused `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (12–72 UTF-8 bytes) for the first API startup. Sign in at `/account` to access `/admin`. Remove the provisioning password after the account exists. Existing credentials are not silently changed during deployments.

## Without containers

Install dependencies separately in each application directory. Run `npm run build` in `Client/`; deploy its complete `.next/standalone/` directory, including copied assets, and start `node server.js` with `PORT`/`HOSTNAME`. The frontend build never needs backend source or development-only packages at runtime.

Run `npm run build` in `Server/`, apply `npm run db:migrate` as a release step with the full toolchain, and run `node dist/main.js` with production dependencies and environment settings. The backend serves `/health` for readiness checks. Use a service manager and TLS reverse proxy for a persistent deployment.

## Release checks

GitHub CI validates synchronized content, backend compilation/unit/integration tests, both story endings, every page's actual minimum font size, narrow mobile layouts, standalone assets/security headers, PostgreSQL migrations and production-mode progress/voting. It also builds both production images and smoke-tests them against PostgreSQL, including the frontend's public assets and generated social image.

Docker and a deployment host are needed to run the container workflow. Passing source checks or pushing commits does not publish a live production website.
