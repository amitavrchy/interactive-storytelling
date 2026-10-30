# The Last Lighthouse · Client

Next.js reader with six cinematic chapters, two endings, unlockable memories, local progress, optional ambient sound, accounts and an editorial studio. All interface text has a **14px minimum**; body copy is 16px. Fonts grow when browser text size increases.

## Run

Requires Node.js 22.12+ and npm (Node 24 is used in CI). From `Client/`:

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` to connect an API. Leave `NEXT_PUBLIC_API_URL` unset for the device edition: the story, both branches, archive and local progress still work. Accounts and shared analytics need the API.

To run the complete repository locally, first install the server dependencies (`npm --prefix ../Server ci`), then:

```sh
npm run dev:all:local
```

This starts the frontend at localhost:3000 and a durable, file-backed development API at localhost:4000. It creates example env files only if they do not exist. `npm run dev:all` uses the configured PostgreSQL backend instead.

For alternate ports in PowerShell:

```powershell
$env:CLIENT_PORT='3100'
$env:API_PORT='4100'
npm run dev:all:local
```

## Production

Set `NEXT_PUBLIC_SITE_URL` to the public frontend origin and `NEXT_PUBLIC_API_URL` to the public API origin **before building**. Public variables are compiled into the reader.

```sh
npm run build
npm run start:standalone
```

The build prepares a complete `.next/standalone/` directory including static assets and public images. Deploy that directory as a Node app (`node server.js`) or build the included Dockerfile. The Docker image runs without root privileges and includes a health check. See [production deployment](../Server/docs/DEPLOYMENT.md) for the complete PostgreSQL/API/frontend stack.

## Verify

```sh
npm run browser:install
npm run test:e2e
```

The suite builds both applications, serves the standalone production frontend, and starts an isolated test API on ports 5100/5101. Stop a local preview on those ports first. Tests use `.next-e2e/` and disposable API data; developer journeys and the normal `.next/` build are preserved.

Coverage includes the complete story and both endings, persistence, keyboard controls, archive, accounts/cloud sync, admin publishing, API failure, actual rendered font sizes on every page, and 360px mobile layouts. Failures retain traces in `test-results/`.

## Source layout

All application files live under `Client/` and `Server/`. Repository Git configuration and the GitHub Actions workflow stay at their required root locations.

- `src/app/`: pages, metadata and styles.
- `src/components/`: reader, archive, account and studio UI.
- `src/features/story/`: Redux progress and branching state.
- `src/content/story.json`: committed local content seed.
- `public/images/`: five generated cinematic environments.
- `scripts/`: local development, browser tests and standalone packaging.
- `docs/`: project specification, artwork provenance, implementation and verification notes.

The canonical seed is `Server/content/story.json`. Run `npm run content:sync` from either application after editing it. Each application builds independently from its committed seed. CMS edits override the seed without being overwritten on server startup.

[Project guide](docs/PROJECT_GUIDE.md) · [Specification](docs/PROJECT_SPEC.md) · [Artwork and prompts](docs/ARTWORK.md) · [Verification](docs/VERIFICATION.md)
