# The Last Lighthouse · reader

Next.js app with Redux progress, React Query CMS content, RHF/zod account forms, GSAP/Lenis narrative timelines and React Three Fiber atmosphere. Read the [project README](../README.md) for setup and delivery notes.

`npm run dev` starts the reader at localhost:3000. `npm run build` creates the production build. `npm run test:e2e` builds both applications and runs isolated desktop/mobile acceptance tests.

Copy `.env.example` to `.env.local` to connect the API. Leave `NEXT_PUBLIC_API_URL` unset to run the complete device edition without accounts or studio data. Set `NEXT_PUBLIC_SITE_URL` to the deployed frontend origin before production builds for correct social metadata.
