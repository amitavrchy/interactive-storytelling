# Build and verification record

Verified on 30 October 2026 with Node.js 24 on Windows.

## Completed

- Next.js standalone production build, including public/static assets, both endings and dynamic OG images. Tests build into `.next-e2e/` separately from the developer's normal build.
- NestJS production compilation and Prisma Client generation.
- Fifteen backend unit/configuration checks, including rejection of file storage, invalid database URLs, placeholder secrets, unsafe origins and incomplete administrator settings in production.
- Ten compiled API integration cases: seed endpoints, invalid DTOs, privilege injection, email login, expired/invalid JWTs, isolated cloud progress, branch-state normalization, idempotent voting, admin permissions, chapter publishing, lore CRUD and file persistence across a process restart.
- Twenty-two browser cases across desktop and mobile Chromium: complete endings, saved progress, archive/search, sound opt-in, keyboard/dialog controls, account/cloud sync, admin publishing, API failure and damaged-save recovery. New checks inspect actual computed font sizes across every page/preferences, exercise 360px layouts without horizontal overflow, and verify standalone assets and security headers.
- No application CSS font declaration below 14px; labels, captions and small text use `--text-min: max(14px, 0.875rem)`. Body copy uses 1rem.
- Application source, content, scripts and documentation are contained in `Client/` and `Server/`. Git metadata and GitHub's required workflow directory remain at repository root.
- Original artwork reviewed in the rendered desktop layout.
- Dependency audit after removing unused deployment tooling and overriding vulnerable `deepmerge-ts`: zero reported vulnerabilities in both application lockfiles.

## Infrastructure and interpretation

Local API tests use the explicitly configured durable file adapter. PostgreSQL was also verified in [GitHub CI](https://github.com/amitavrchy/interactive-storytelling/actions/runs/41038031929) against an ephemeral PostgreSQL 16 service: migration deployment, Prisma seeding, registration, cloud progress and concurrent idempotent vote requests all passed. Docker/PostgreSQL are not installed on the local workstation.

Mobile coverage uses an emulated iPhone viewport and touch-capable Chromium, not Safari on a physical iPhone. WebGL automatically falls back to the static scene when unsupported. Reduced-motion completion is explicitly checked without a canvas.

The earlier mobile Lighthouse baseline, before the minimum-font/layout update, was Home performance **90**, About **94**, with **100** accessibility, best practices and SEO and zero cumulative layout shift. These historical local measurements are not a claim about the latest release host. Heavy story code and WebGL are loaded only on the story route; no universal 60fps claim is made.

Production container checks are defined in CI: validate Compose, build the non-root API/frontend runtime images, and run them against PostgreSQL while checking health, seeded content, private cache headers, public artwork and generated social images. Docker is not installed on the local workstation; the CI run is the evidence for container verification.

There is no production hosting destination configured in this repository. Source changes are pushed to the existing GitHub remote; no production deployment is implied.
