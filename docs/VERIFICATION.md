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

Local API tests use the explicitly configured durable file adapter. Docker/PostgreSQL are not installed on this workstation, so a live local PostgreSQL test is not claimed. The migration is generated from the Prisma schema, and PostgreSQL verification is included in CI with an ephemeral PostgreSQL 16 service. CI status must be checked separately.

Mobile coverage uses an emulated iPhone viewport and touch-capable Chromium, not Safari on a physical iPhone. WebGL automatically falls back to the static scene when unsupported. Reduced-motion completion is explicitly checked without a canvas.

Lighthouse performance targets in the original spec are targets until measured on the release host. No unmeasured performance score or universal 60fps claim is made. Heavy story code and WebGL are loaded only on the story route.

There is no production hosting destination configured in this repository. Source changes are pushed to the existing GitHub remote; no production deployment is implied.
