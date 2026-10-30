# The Last Lighthouse

A cinematic interactive story about memory, belonging and finding a way home. Built from [PROJECT_SPEC.md](PROJECT_SPEC.md).

Six chapters, two endings, five original cinematic environments, an unlockable archive, optional ocean ambience, a calm reading mode, accounts, cloud progress and a protected editorial studio.

## Start locally

Requires Node.js 22.12+ (Node 24 recommended) and npm. From the repository root:

```sh
npm run setup
npm run dev:local
```

Open **http://localhost:3000**. The API runs at **http://localhost:4000**. `dev:local` explicitly uses a durable development file store in `Server/.data/`; it does not require PostgreSQL. Environment examples are copied only when local files do not already exist. Existing local configuration is preserved.

For an installation without a backend, run `npm --prefix Client run dev` and leave `NEXT_PUBLIC_API_URL` unset. The complete story, branching, archive and local progress work on their own. Accounts and shared studio data require the API.

The frontend reads `Client/.env.local`; the backend reads `Server/.env`. An API URL must include the protocol, for example `http://localhost:4000`. `NEXT_PUBLIC_*` values are baked into production frontend builds.

## PostgreSQL

Set `DATABASE_URL`, `STORAGE_MODE=database` and a random `JWT_SECRET` of at least 32 characters in `Server/.env`. With Docker installed, the included database can be started using:

```sh
docker compose -f Server/docker-compose.yml up -d
npm --prefix Server run db:migrate
npm run dev
```

Chapters and lore seed automatically on API startup using create-only upserts, preserving CMS edits. File mode is rejected in production. The database schema and an initial SQL migration are committed. Never point test scripts at a production database.

## Editorial studio

Set an unused `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (12–72 UTF-8 bytes) in `Server/.env`, then start the API. A new administrator is provisioned only if that email is unused. There is no default administrator password and no public role escalation endpoint.

Sign in at `/account` and open `/admin`. Editors can update chapter JSON, create/edit/delete archive entries, and view live branch totals. Validation runs in both the browser and API. The six core chapters remain published and cannot be deleted. The API also supports CRUD for supplementary chapter records; adding a new chapter to the reader's journey requires a content-model change.

After provisioning an admin, remove `ADMIN_PASSWORD` from the environment. To change an existing administrator password, use your database administration process; startup does not silently replace existing credentials.

Accounts use 12-hour JWT sessions stored for the browser tab session. Cloud sync is explicit: **Save to cloud** replaces account progress, and **Restore from cloud** replaces device progress after confirmation. There is no automatic overwrite of a journey on another device.

## Narrative and accessibility

- Scroll or use **Continue** to advance the cinematic timeline. One chapter's WebGL scene is mounted at a time; device pixel ratio is capped at 1.5.
- Enable **Reduced motion** in Preferences for a stacked editorial story without WebGL or pinned scrolling. System reduced-motion preference is honoured on first visit.
- Press **Escape** in the story to open the chapter menu. Dialogs trap focus and support Escape. Tab navigates controls; Enter/Space selects a choice.
- Sound starts off on every visit and only starts after a gesture. Ambience suspends while the tab is hidden. Atmosphere captions are on by default; all narrative copy remains text.
- Chapter, ending and archive state persist in validated local storage. If the API is unavailable, the original local edition remains readable. Failed choice submissions stay in a retry outbox with idempotent request IDs.
- Share pages at `/ending/beacon` and `/ending/rescue` have separate Open Graph cards. Clipboard denial falls back to a selectable link.

The canonical narrative is `Shared/story.json`. After editing it, run `npm run content:sync` to update both application seeds. CMS changes override the seed. [Artwork prompts and provenance](docs/ARTWORK.md) are included.

## Verify

Install the browser used by the acceptance suite once:

```sh
npm run browser:install
npm test
```

Alternatively run `npx playwright install chromium` from `Client/`. Tests include one backend unit test, ten real compiled-API integration cases and sixteen browser scenarios across desktop and mobile Chromium. Browser tests build both applications and use isolated file data and ports 3100/4100; backend integration uses port 4200. They do not use developer accounts or stored journeys. Failure traces and screenshots are written to `Client/test-results/`.

The CI workflow also provisions PostgreSQL, applies the committed migration and runs `scripts/postgres-smoke.mjs` against it to verify real Prisma seeding, accounts, progress and concurrent idempotent votes.

```sh
npm run build
```

Production frontend: `npm --prefix Client start`. Production backend: `npm --prefix Server run start:prod`. Configure the public origin and API URL, set `NODE_ENV=production`, deploy migrations as a separate release step, and use PostgreSQL. Build the backend image with `docker build -t last-lighthouse-api Server`; inject secrets at runtime.

See [verification notes](docs/VERIFICATION.md) for measured results and local infrastructure limits.
