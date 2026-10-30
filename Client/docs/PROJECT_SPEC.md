# Interactive Storytelling Website — Project Build Spec

> Stack: Next.js + Redux + RQ + RHF/zod + framer-motion + **gsap, lenis, three / r3f / drei**. NestJS + Prisma + JWT. Optional: `@gsap/react`, `howler` or Web Audio for ambient sound (document mute default), `leva` dev-only.

---

## 1. Vision & Audience

**Vision:** A scroll-driven cinematic web narrative **“The Last Lighthouse”** — short-film-quality interactive story with chapters, branching choice nodes (light), WebGL atmospheric scenes, and a journal/archive unlocked by progress. Benchmarks: Ponpon Mania interactivity, Inkwell uninterrupted scroll narrative, The Spark WebGL short-film energy, Greatest Stories Retold chaptering.

**Audience:** Curious general public; design/award jurors; students of interactive media; brand storytelling demos.

**Promise:** “A short film you steer with your scroll.”

---

## 2. References

| Site | Steal | Link |
|------|-------|------|
| Ponpon Mania | Interactive comic, chapters, physics, WebGL/GSAP — SOTD Oct 2025 | https://www.awwwards.com/sites/ponpon-mania |
| Inkwell case | Scroll-only cinematic narrative | https://www.awwwards.com/inkwell-a-scroll-driven-narrative-for-ais-most-stealth-player.html |
| The Spark | Scroll-driven WebGL short film, reactive audio | https://webgpu.com/showcase/the-spark-a-scroll-driven-webgl-story/ |
| The Greatest Stories Retold | WebGL storytelling, horizontal nav — SOTD | https://www.awwwards.com/sites/the-greatest-stories-retold |
| Event Horizon (CSS Winner) | Narrative experimental | https://www.csswinner.com/details/event-horizon/19162/ |

---

## 3. Design System

### Color
| Token | Hex |
|-------|-----|
| `--night` | `#05070F` |
| `--fog` | `#1B2238` |
| `--lamp` | `#F2C14E` |
| `--sea` | `#1C3D5A` |
| `--foam` | `#E7EEF6` |
| `--danger-choice` | `#E85D4C` |
| `--safe-choice` | `#6BCBBF` |

### Typography
- Narrative display: `Instrument Serif` / `Newsreader`
- UI chrome: `Inter`
- Captions: slightly larger line-height 1.7

### Motion principles
- **Scroll is the timeline.** GSAP ScrollTrigger owns chapter progress 0–1.
- Lenis smooth; sync ScrollTrigger `scrollerProxy` if needed.
- R3F scenes mount per chapter; dispose on leave to save GPU.
- Choice modal pauses Lenis; resume on select.
- Durations: text fade 600ms; scene crossfade 900ms; choice 250ms.
- Default **sound off**; user gesture to enable ambient.

---

## 4. Sitemap

### `/`
Gate: title card, “Begin”, accessibility options (reduce motion, captions always on, sound).

### `/story` (primary experience)
Chapters as long scroll sections or virtual chapter routes `/story/[chapterSlug]` with progress persistence.

Structure (write content in seed MD/JSON):
1. Prologue — sea fog WebGL particles
2. The Keeper — character intro, parallax illustrated panels
3. The Storm — intensified audio-reactive (optional) waves
4. The Choice — branch A/B affecting ending flags in Redux
5. Ending A/B — divergent copy + scene
6. Epilogue — credits + share

### `/chapters` index unlock UI
### `/archive` lore entries unlocked by progress
### `/about` making-of
### Admin: edit chapter copy JSON, view analytics of choices

**Signature:** Scroll-scrubbed WebGL; chapter progress rail; branching ending; mute toggle; caption track.

---

## 5. Features

### MVP
- Full scroll story with 5–6 chapters seeded
- Progress save (localStorage + optional auth cloud)
- One binary branch → two endings
- Archive unlocks
- Reduced-motion alternate: stacked editorial pages without WebGL
- Share card OG per ending

### Stretch
- Multiple branches
- Collectible objects cursor magnets
- Full score + voiceover
- WebGPU path (not required; Three.js WebGL OK)

---

## 6. Frontend Architecture

```
app/story/page.tsx          # or chapter segments
components/story/
  ChapterShell.tsx
  ProgressRail.tsx
  ChoiceGate.tsx
  Caption.tsx
  scenes/                   # R3F per chapter
    FogSea.tsx
    Lighthouse.tsx
    Storm.tsx
features/story/storySlice.ts  # chapterIndex, flags, ending, soundEnabled, captions
lib/story-content.ts          # typed chapter content
```

**Redux storySlice** is source of truth for flags; persist with `redux-persist` **or** manual localStorage middleware (prefer simple custom persist to avoid extra deps — or add `redux-persist` precisely if desired).

**React Query:** fetch chapter content from Nest for CMS mode; fallback to local seed.

**GSAP:** one master timeline per chapter tied to scroll distance ≈ 300–600vh.

---

## 7. Backend Prisma

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum Role { READER ADMIN }

model User {
  id String @id @default(cuid())
  email String @unique
  passwordHash String
  name String
  role Role @default(READER)
  progress StoryProgress?
}

model Chapter {
  id String @id @default(cuid())
  slug String @unique
  title String
  sortOrder Int
  contentJson Json  // blocks: text, image, sceneId, choiceId
  published Boolean @default(true)
}

model LoreEntry {
  id String @id @default(cuid())
  slug String @unique
  title String
  body String
  unlockFlag String  // flag name required
  coverImage String?
}

model StoryProgress {
  id String @id @default(cuid())
  userId String @unique
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  flagsJson Json
  chapterSlug String?
  ending String?
  updatedAt DateTime @updatedAt
}

model ChoiceStat {
  id String @id @default(cuid())
  choiceId String
  optionKey String
  count Int @default(0)
  @@unique([choiceId, optionKey])
}
```

### Endpoints
| Method | Path | Auth |
|--------|------|------|
| GET | `/chapters` `/chapters/:slug` | public |
| GET | `/lore` | public | filter by unlock query optional |
| PUT | `/progress` | JWT optional | |
| POST | `/choices/:id/vote` | public | increments ChoiceStat |
| CRUD | chapters/lore | ADMIN |

---

## 8. Perf / A11y / SEO

- Target 60fps on mid laptops: limit particles, dpr cap 1.5, pause offscreen Canvas
- Prefers-reduced-motion → no ScrollTrigger pin; show readable chapter pages
- Captions for all narrative text (not image-only)
- Keyboard: Space/Enter continue choice; Esc open chapter menu
- SEO: story landing indexable; deep chapters `noindex` optional if spoiler-sensitive — prefer index with spoiler-free titles
- Lighthouse: experience page Perf may be <80; document; About/Home ≥90

---

## 9. Build Order

1. Content model + seed chapters JSON
2. Scroll chapter shells with GSAP text reveals (2D first)
3. storySlice progress + local persist + branch
4. Add R3F scenes chapter by chapter
5. Archive unlock + Nest progress sync
6. Sound toggle + a11y modes
7. Choice analytics
8. Polish credits/share

## 10. Acceptance

- [ ] Completing story yields Ending A or B based on choice
- [ ] Refresh restores progress from localStorage
- [ ] Reduced-motion path completes story without WebGL
- [ ] Sound never autoplays without gesture
- [ ] Choice stats increment
- [ ] Progress rail reflects chapter
