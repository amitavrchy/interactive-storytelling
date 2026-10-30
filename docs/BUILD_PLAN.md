# The Last Lighthouse · delivery plan

Work follows PROJECT_SPEC.md. Each milestone is a separate, reviewable commit pushed to origin/main.

1. Narrative foundation: six chapters, two endings, six archive entries and shared content.
2. Visual foundation: cinematic artwork, typography tokens, responsive shell and landing page.
3. Reader state: validated local persistence, preferences, chapter library and archive.
4. Story experience: scroll timelines, chapter rail, branching, WebGL and accessible reading mode.
5. API: Prisma models, seeded content, validated auth, progress and choice statistics.
6. Connected features: account sync, admin editor, analytics, sharing and metadata.
7. Verification: browser acceptance flows, backend integration coverage, builds and handoff docs.

All seven milestones are implemented and pushed. Verification and infrastructure notes are recorded in `docs/VERIFICATION.md`.

Canonical narrative content lives in `Shared/story.json`. Run `node scripts/sync-content.mjs` after editing it to update both application seeds. CMS edits override this seed when the API is configured.

The reader works without an API: content and progress stay on the device. Cloud accounts, shared statistics and CMS require a configured backend. Backend supports PostgreSQL via Prisma; an explicit file-backed development mode is available for running without PostgreSQL.
