# The Last Lighthouse

**Story:** [https://last-lighthouse.netlify.app](https://last-lighthouse.netlify.app)

**API:** [https://last-lighthouse-api.onrender.com](https://last-lighthouse-api.onrender.com)

A short film you steer with your scroll.

## Overview

The Last Lighthouse is an original interactive narrative set on a fictional Atlantic coast in 1987. A homecoming unfolds across a single storm-filled night: six chapters, one choice, and two endings. The reader moves the timeline by scrolling. Sea, light, and weather stay in step with the prose.

The site is a Next.js reader. Accounts, cloud progress, choice totals, and the editorial studio are served by a NestJS API. The story, both endings, the archive, and on-device progress still work when the API is unset. Signing in is what carries a place in the story from one device to another.

## Features

- Six chapters — Prologue, The Keeper, The Storm, The Choice, First Light, and Epilogue — with GSAP scroll timelines and Lenis smoothing.
- WebGL atmospheres (React Three Fiber) for the active chapter only, with a static scene when WebGL is unavailable.
- Two published endings, **The Beacon** and **The Rescue**, each with its own copy and Open Graph image.
- An archive of memories unlocked by progress.
- Progress saved on the device, with optional JWT accounts and explicit cloud save and restore.
- An administrator studio for chapter copy, both ending variants, archive entries, and real branch totals. The six core chapters stay published.
- Reduced motion that drops WebGL and pinned scrolling for a stacked reading layout. Device motion settings stay separate from the reader’s saved preference.
- Sound off until the reader turns it on. A 14px type floor on every control, caption, and page, including smaller browser defaults.
- Keyboard access in the story: Escape opens the chapter menu, Tab moves between controls, and Enter or Space chooses an ending.

## Tech stack

| Part | Stack |
| --- | --- |
| Reader | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Motion and scenes | GSAP, Lenis, Framer Motion, Three.js, React Three Fiber, Drei |
| Client state | Redux Toolkit, TanStack Query, React Hook Form, Zod |
| API | NestJS 12, Prisma 6, PostgreSQL, JWT |
| Delivery | Netlify for the reader, Render (Docker) for the API |

## Project structure

Application source lives in two folders. Repository metadata and the host manifests stay at the root so the existing deploys keep their current settings.

```
.
├── Client/                  Next.js reader
│   ├── src/app/             Routes, metadata, and styles
│   ├── src/components/      Reader, archive, account, and studio UI
│   ├── src/features/story/  Progress and branching state
│   ├── src/content/         Committed story seed
│   ├── public/images/       Cinematic environments
│   └── Dockerfile           Production reader image
├── Server/                  NestJS API
│   ├── src/                 HTTP API, auth, and persistence
│   ├── content/story.json   Canonical narrative seed
│   ├── prisma/              Schema and migrations
│   ├── Dockerfile           Production API image
│   └── Dockerfile.render    Render image (API and Postgres)
├── .github/workflows/       Continuous verification
├── netlify.toml             Netlify build, base directory Client/
├── render.yaml              Render service, Docker context Server/
└── .node-version            Node.js 22
```

`netlify.toml` builds from `Client/`. `render.yaml` points at `Server/Dockerfile.render` with Docker context `Server/`. Render’s root directory stays empty.

## Getting started

Node.js 22.12 or newer and npm. The pin in `.node-version` is 22. CI and the reader production image use Node.js 24.

### Reader (`Client/`)

```sh
cd Client
npm ci
npm run dev
```

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to [https://last-lighthouse.netlify.app](https://last-lighthouse.netlify.app) and `NEXT_PUBLIC_API_URL` to [https://last-lighthouse-api.onrender.com](https://last-lighthouse-api.onrender.com) before `npm run build`. Those public variables are compiled into the reader. Leave `NEXT_PUBLIC_API_URL` unset for the device edition.

`npm run build` writes a standalone server under `.next/standalone/`, including static assets and public images. Start it with `npm run start:standalone`.

### API (`Server/`)

```sh
cd Server
npm ci
npm run build
npm run start:local
```

Copy `.env.example` to `.env`. `start:local` forces the file adapter (`STORAGE_MODE=file`) and does not need PostgreSQL.

For PostgreSQL, set `DATABASE_URL`, `STORAGE_MODE=database`, `JWT_SECRET` (at least 32 characters), and `CLIENT_ORIGIN`, then:

```sh
docker compose up -d
npm run db:migrate
npm run start:dev
```

In production set `NODE_ENV=production`, a real `DATABASE_URL`, a non-placeholder `JWT_SECRET`, and `CLIENT_ORIGIN` to [https://last-lighthouse.netlify.app](https://last-lighthouse.netlify.app). Invalid production settings stop startup. The running API answers `GET /health` on [https://last-lighthouse-api.onrender.com](https://last-lighthouse-api.onrender.com).

Optional first-boot administrator: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12–72 UTF-8 bytes). Sign in through the account page to open the studio. Remove the provisioning password after the account exists.

### Both applications

Install dependencies in `Server/` and `Client/`. From `Client/`:

```sh
npm run dev:all:local
```

That starts the reader and a file-backed API. `npm run dev:all` uses the configured PostgreSQL backend instead. Override the listen ports with `CLIENT_PORT` and `API_PORT`.

The canonical story seed is `Server/content/story.json`. After editing it, run `npm run content:sync` from either application. `npm run content:check` in `Server/` reports drift.

### Checks

From `Server/`: `npm test`, `npm run test:e2e`, and `npm run lint`. From `Client/`: `npm run lint`, and `npm run test:e2e` after `npm run browser:install`. The browser suite covers both endings, resume, archive, accounts, the studio, choice delivery, and rendered type size.

## Author

Amitav Roy Chowdhury — [github.com/amitavrchy](https://github.com/amitavrchy)
