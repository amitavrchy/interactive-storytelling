# Verification record

Verified on 30 October 2026 with Node.js 24 on Windows.

## Completed

- Next.js optimized production build, including both ending pages and dynamic OG image routes.
- NestJS production compilation and Prisma Client generation.
- One existing backend unit test.
- Ten compiled API integration cases: seed endpoints, invalid DTOs, privilege injection, email login, expired/invalid JWTs, isolated cloud progress, branch-state normalization, idempotent voting, admin permissions, chapter publishing, lore CRUD and file persistence across a process restart.
- Sixteen browser cases across desktop and mobile Chromium: responsive landing, sound opt-in, preferences, locked chapters, both complete endings, refresh restoration, six archive unlocks, archive search and dialog, OG image responses, clipboard success and refusal, cinematic scroll progress, chapter menu keyboard control, reduced-motion switch, account creation, cloud save/restore, admin publishing/deleting, API fallback and damaged-save recovery.
- Original artwork reviewed in the rendered desktop layout.
- Dependency audit after removing unused deployment tooling and overriding vulnerable `deepmerge-ts`: zero reported vulnerabilities in both application lockfiles.

## Infrastructure and interpretation

Local API tests use the explicitly configured durable file adapter. PostgreSQL was also verified in [GitHub CI](https://github.com/amitavrchy/interactive-storytelling/actions/runs/41038031929) against an ephemeral PostgreSQL 16 service: migration deployment, Prisma seeding, registration, cloud progress and concurrent idempotent vote requests all passed. Docker/PostgreSQL are not installed on the local workstation.

Mobile coverage uses an emulated iPhone viewport and touch-capable Chromium, not Safari on a physical iPhone. WebGL automatically falls back to the static scene when unsupported. Reduced-motion completion is explicitly checked without a canvas.

Mobile Lighthouse measurements against the local production server: Home performance **90**, About performance **94**. Both scored **100** for accessibility, best practices and SEO, with zero cumulative layout shift. These are local lab measurements, not release-host guarantees. Heavy story code and WebGL are loaded only on the story route; no universal 60fps claim is made.

There is no production hosting destination configured in this repository. Source changes are pushed to the existing GitHub remote; no production deployment is implied.
