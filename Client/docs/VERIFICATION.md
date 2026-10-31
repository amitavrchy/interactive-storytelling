# Build and verification record

Verified on 31 October 2026 with Node.js 24 on Windows. The current suite contains 75 assertions/scenarios: 15 backend unit/configuration checks, 12 compiled-API integration cases and 48 desktop/mobile browser cases.

## Completed

- Next.js standalone production build, including public/static assets, both endings and dynamic OG images. Tests build into `.next-e2e/` separately from the developer's normal build.
- NestJS production compilation and Prisma Client generation.
- Fifteen backend unit/configuration checks, including rejection of file storage, invalid database URLs, placeholder secrets, unsafe origins and incomplete administrator settings in production.
- Twelve compiled API integration cases: seed endpoints, invalid DTOs, privilege injection, email login, expired/invalid JWTs, isolated progress, completion-state normalization, idempotent voting, admin permissions, chapter/ending publication, lore CRUD and process-restart persistence.
- Forty-eight browser scenarios across desktop and mobile Chromium. In addition to the complete story/account/archive/studio flows, regression coverage includes deep-link resume, dialog scroll isolation, live motion preferences, rejected WebGL contexts, network session recovery, expired authentication, unpublished-draft protection, CMS ending copy, damaged/blocked/read-only choice storage and font sizing with a 12px browser default.
- No application CSS font declaration below 14px; labels, captions and small text use `--text-min: max(14px, 0.875rem)`. Body copy uses 1rem.
- Application source, content, scripts and documentation are contained in `Client/` and `Server/`. Repository metadata and the existing Netlify/Render deployment manifests stay at their required root locations.
- Original artwork reviewed in the rendered desktop layout.
- Dependency audit after removing unused deployment tooling and overriding vulnerable `deepmerge-ts`: zero reported vulnerabilities in both application lockfiles.

## Infrastructure and interpretation

Local API tests use the explicitly configured durable file adapter. PostgreSQL was also verified in [GitHub CI](https://github.com/amitavrchy/interactive-storytelling/actions/runs/41038031929) against an ephemeral PostgreSQL 16 service: migration deployment, Prisma seeding, registration, cloud progress and concurrent idempotent vote requests all passed. Docker/PostgreSQL are not installed on the local workstation.

Mobile coverage uses an emulated iPhone viewport and touch-capable Chromium, not Safari on a physical iPhone. WebGL automatically falls back to the static scene when unsupported. Reduced-motion completion is explicitly checked without a canvas.

The earlier mobile Lighthouse baseline, before the minimum-font/layout update, was Home performance **90**, About **94**, with **100** accessibility, best practices and SEO and zero cumulative layout shift. These historical local measurements are not a claim about the latest release host. Heavy story code and WebGL are loaded only on the story route; no universal 60fps claim is made.

Production container checks are defined in CI: validate Compose, build the non-root API/frontend runtime images, and run them against PostgreSQL while checking health, seeded content, private cache headers, public artwork and generated social images. Docker is not installed on the local workstation; the CI run is the evidence for container verification.

The existing Netlify and Render configuration is preserved. Source/build/container verification does not by itself assert the current health of either live hosting service.
