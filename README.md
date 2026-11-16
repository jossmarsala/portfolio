# josmarsala

Personal portfolio for Jos Marsala — React 19 + TypeScript + Vite, deployed as a
static SPA on Vercel.

## Stack

- **Framework:** React 19 + Vite 8
- **Routing:** `react-router-dom` (data router, lazy case-study routes)
- **Motion:** GSAP + ScrollTrigger, Motion, OGL (WebGL carousel / footer headline)
- **Content:** Markdown in `content/projects` → JSON in `public/locales` at build
  time (`scripts/parse-projects.js`)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # content parse → typecheck → vite build → SEO files
npm run preview
npm run lint
```

Copy `.env.example` to `.env.local` when you need to override the production
origin or point media at a CDN.

## Architecture

```
src/
  app/
    router.tsx          route table + legacy URL redirects
    RootLayout.tsx      persistent shell: cursor, navbar, about panel, <Outlet/>
  pages/
    HomePage.tsx        hero, works, footer, intro loader + scroll choreography
    ProjectPage.tsx     lazy case-study route (ProjectView)
    NotFoundPage.tsx    noindex 404
  components/
    media/PortfolioMedia.tsx   viewport-aware video + image fallback
    ui/RouteFallback.tsx       Suspense skeleton
  config/
    projects.ts         project data, direct-link rules, OG image helper
    site.ts             site metadata + absolute URL helper
  lib/
    seo.ts              per-route title / meta / canonical / JSON-LD
    media.ts            media base URL resolver (local ↔ CDN)
    runtime.ts          first-boot tracking so the loader never replays
```

Import with the `@/` alias, e.g. `import { useSeo } from "@/lib/seo"`.

### Routes

| Path                    | Behaviour                                      |
| ----------------------- | ---------------------------------------------- |
| `/`                     | Home                                           |
| `/projects/:slug`       | Case study (lazy chunk)                        |
| `/project/:slug`        | Legacy redirect → `/projects/:slug`            |
| `/:slug`                | Legacy redirect (`/misu` → `/projects/misu`)   |
| `/projects`, `/project` | Redirect home                                  |
| `*`                     | 404 (noindex)                                  |

Projects listed in `DIRECT_LINK_SLUGS` (`src/config/projects.ts`) open their live
site instead of the in-app case study. Clicking one opens a new tab; visiting its
URL directly replaces the current tab.

Closing a case study returns to `/#work` without replaying the intro loader
(`src/lib/runtime.ts`).

### SEO

`useSeo` keeps the document in sync per route:

- `title`, `description`, `robots`
- Open Graph (`og:*`) and Twitter card tags
- canonical link
- `CreativeWork` JSON-LD for case studies

`scripts/generate-seo-files.js` writes `dist/robots.txt` and `dist/sitemap.xml`
after the build, deriving project URLs from `src/config/projects.ts` and skipping
direct-link projects. `VITE_SITE_URL` overrides the default production origin
(`https://josmarsala.vercel.app`).

> Note: because this is a client-rendered SPA, social crawlers that do not execute
> JavaScript still see the defaults in `index.html`. If rich per-project link
> previews become important, add a prerender step — the routing/SEO layer is
> already structured for it.

### Media

Project media is optimized once and served from **Vercel Blob**. The generated
map in `src/config/cdn-assets-map.json` is the single source of truth:

```tsx
import { PortfolioMedia } from "@/components/media/PortfolioMedia";
import { cdnAsset } from "@/config/cdn-assets";

<PortfolioMedia
  imageSrc={cdnAsset("MISU__mockup-poster.webp")}
  videoSrc={cdnAsset("MISU__app-showcase.webm")}
  alt="Misu catalog screen"
/>
```

- Video loads and plays only when near the viewport (`IntersectionObserver`).
- Falls back to the image on error, autoplay rejection or unsupported codec.
- Never mounts video when `prefers-reduced-motion: reduce` is set.
- Only the image is eager; video is `preload="none"` until in view.
- Absolute Blob URLs pass through `mediaUrl()` untouched; set
  `VITE_MEDIA_BASE_URL` only for media that is still served from `public/`.

The component is intentionally not yet wired into existing galleries — swap
`<img>` / `<video>` instances over when the new imagery is ready.

To add or replace media: drop the source files in `cdn-assets/`, run
`npm run optimize:cdn`, then `npm run upload:cdn`, and reference the result with
`cdnAsset(...)`. Both working folders are gitignored; only the generated map and
scripts are committed.

#### Bento tiles (index page)

The index bentos are the one exception to the "full-quality master" rule: a tile
is at most ~450 CSS px wide, so shipping the 1080p case-study masters made the
grid wait on megabytes of video. `npm run optimize:bento` builds a dedicated
set from the same masters:

- `BENTO__<PROJECT>.mp4` — 720–1440 px wide (per-tile width in the script),
  CRF 30, 24 fps, no audio, `+faststart` so playback starts on the first bytes.
- `BENTO__<PROJECT>.webp` — a poster frame, picked up automatically by
  `SourceVideo` because it sits next to the video under the same basename.
- `BENTO__GYPSY.webp` — the still tile, resized from the 4501 px master.

```bash
npm run optimize:bento
npm run upload:cdn -- --merge   # keeps the rest of the map intact
```

`src/config/bento-media.ts` lists the resulting tiles; `preload="auto"` starts
buffering as soon as the works section mounts (at idle, seconds before it can be
scrolled to) and the poster paints immediately, so the grid is never a row of
black boxes. `vite.config.ts` also injects `<link rel="preload" as="image">` tags
for the posters straight from the CDN map, so the stills are already decoded by
the time the grid appears.

### Lazy loading

- Case studies (`ProjectPage`) are a separate chunk, prefetched on idle.
- `ImageCircleCarousel` (OGL), `WorksSection`, `Footer` and `AboutSidebar` are
  lazy-loaded with `RouteFallback` skeletons.
- The `PortfolioMedia` component and route laziness keep heavy media and WebGL
  work out of the first paint.

## Deployment

Vercel serves the build from `dist`. `vercel.json` rewrites unknown paths to
`index.html` (with asset and media directories excluded) so direct links and
reloads work, and sets long-lived caching for hashed assets.

Set `VITE_SITE_URL` only when the canonical origin differs from
`https://josmarsala.vercel.app`, and optionally `VITE_MEDIA_BASE_URL` in the
Vercel project environment.

## Scripts

| Script                     | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `npm run dev`              | Vite dev server                             |
| `npm run build`            | Full production build + SEO files           |
| `npm run parse:projects`   | Rebuild locale JSON from markdown           |
| `npm run parse:projects:watch` | Watch markdown and rebuild locales      |
| `npm run seo:generate`     | Regenerate sitemap/robots from `dist`       |
| `npm run optimize:images`  | Batch image optimization                    |
| `npm run optimize:videos`  | Batch video optimization                    |
| `npm run optimize:bento`   | Tile-sized videos + posters for the index bentos |
| `npm run lint`             | Oxlint                                      |
