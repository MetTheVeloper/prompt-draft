# Milestone 21.5 — Phase 4B.5C Public Discovery Visual Layer

Status: **IMPLEMENTED / FOUNDER RE-VERIFICATION NEXT / NOT ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

Shared-presentation predecessor:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
```

---

## 1. Objective

4B.5C keeps the existing `/discover/:slug` information architecture, SEO semantics and curated Prompt grid while upgrading the hero to the same media-rich public acquisition language used by Home/Public Prompt.

Canonical routes remain:

```text
/discover/:slug
/fa/discover/:slug
```

No protected Prompt data is introduced.

---

## 2. Founder-requested alignment polish

The two Discovery heading flex groups identified during founder visual review use:

```text
rules="ccs"
```

This applies to:

```text
hero title/description group
collection eyebrow/title group
```

The surrounding collection/related layout semantics are otherwise unchanged.

---

## 3. Semantic content-sized hero container

The previous raw hero `<section>` is now:

```vue
<el-flex type="section" ...>
```

with the existing semantic class:

```text
public-discovery-page__hero
```

Founder re-review clarified that this hero is **not** a full-viewport acquisition stage. Its height is determined by its own content and padding:

```text
hero title/description
hero actions
responsive section padding
```

No `100vh`/header-derived hero height variable or hero/content `min-height` is used.

The default-layout desktop/tablet/mobile page padding is also disabled for the canonical Discovery route through:

```text
base route: discover-slug
```

so `/discover/:slug` and `/fa/discover/:slug` are full-bleed at the page-layout boundary while the hero itself remains content-sized.

---

## 4. Public-only media source

Discovery cinema sources are derived only from the already-public category result set returned by:

```text
usePublicDiscovery()
GET /api/discover?...tags
```

Each source is taken from:

```text
item.coverImage.fullUrl
or item.coverImage.thumbnailUrl
```

Sources are de-duplicated before presentation.

No protected detail API, Prompt body, variants, storage keys, economy state, permissions or authenticated viewer state is read.

---

## 5. SSR-safe single-layer cinema behavior

The hero preserves a deterministic request-time image:

```text
first public category cover -> SSR <img>
```

When multiple public category covers exist, the existing cinema primitive progressively enhances the background on the client:

```text
ClientOnly
  -> visual-slider
  -> heroSources
  -> deterministic ordering
```

The first SSR image is emitted before the client-only slider for request-time HTML and hydration safety.

After the client cinema mounts, that SSR fallback image is removed for multi-image heroes. This prevents the static fallback and animated canvas from remaining visibly stacked as two simultaneous image layers.

For a single-image category, the SSR image remains the sole media layer. If no category media exists, the existing theme-safe fallback remains available.

The cover/fallback/cinema are all scoped behind the content inside the semantic hero with the equivalent of:

```text
position: absolute
inset: 0
width: 100%
height: 100%
```

The project utility expression used on media nodes is:

```text
poa t0 r0 b0 l0
```

The shared slider component normally uses a fixed viewport canvas; Discovery overrides that canvas locally to absolute positioning so it is bounded by the content-sized hero and cannot remain fixed over the curated grid while scrolling.

---

## 6. Preserved Discovery contract

4B.5C does not change:

```text
canonical /discover/:slug routing
Persian /fa/discover/:slug routing
usePublicSeo category title/description/canonical behavior
curated PublicDiscoveryCard grid
archive CTA/filter construction
related-category navigation
invalid-category state behavior
```

The hero enhancement uses public preview media only.

---

## 7. Regression contract

Automated gate:

```text
pnpm test:public-discovery-visual
```

Source:

```text
scripts/public-discovery-visual-contract.test.ts
```

It verifies:

- hero is `el-flex type="section"`.
- deterministic SSR hero image exists before ClientOnly slider enhancement.
- multi-image SSR fallback is removed after cinema mount instead of remaining as a second visible image layer.
- slider consumes only public category cover URLs.
- hero media/canvas is absolutely scoped to the hero.
- hero/content do not reintroduce viewport-derived `min-height` behavior.
- default layout padding is zero for `discover-slug`.
- both founder-identified heading flexes use `rules="ccs"`.
- Discovery still uses `usePublicDiscovery`, `usePublicSeo` and `PublicDiscoveryCard`.
- protected Prompt/economy/permission state does not enter the runtime/template surface.

The protected-boundary source assertion intentionally strips scoped CSS before checking protected-state words, avoiding false positives such as CSS `text-wrap: balance`.

The existing:

```text
pnpm test:prompt-presentation
```

also guards browser-history back semantics for both public and protected Prompt heroes.

---

## 8. Founder verification required

Automated:

```text
pnpm test:prompt-presentation
pnpm test:public-discovery-visual
pnpm test:public-prompt-links
pnpm test:interaction-polish
pnpm seo:audit-routes:strict
```

Production-like frontend gate:

```text
docker compose -f compose.yaml -f compose.cloudflare.yaml up -d --build --force-recreate frontend
pnpm stack:cloudflare:status
```

Staging visual smoke should cover at least one populated category in both locales, for example:

```text
https://grassic.ir/discover/portraits-photography
https://grassic.ir/fa/discover/portraits-photography
```

Required outcomes:

```text
Discovery has no default 32px desktop layout padding
hero height fits its own content instead of filling the viewport
cover/cinema stays clipped to exactly the hero bounds
only one visible media layer remains after client cinema mount
SSR first category preview remains present in request-time HTML
client cinema visibly transitions between public category previews
cinema does not remain fixed over the grid while scrolling
EN layout remains LTR
FA layout remains RTL
hero text remains readable in light and dark themes
hero/collection heading alignment matches founder-approved ccs layout
curated Prompt cards and routes remain unchanged
staging NUXT_PUBLIC_NOINDEX remains authoritative
```

---

## 9. Current state

```text
4B.5A localized descriptions          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation      -> IMPLEMENTED / FINAL BACK-FIX RE-VERIFICATION NEXT
4B.5C Discovery visual layer          -> IMPLEMENTED / FOUNDER RE-VERIFICATION NEXT
4B.5D final regression / acceptance   -> NOT STARTED
Phase 21.5.4B                         -> NOT ACCEPTED
```

Do not start 4B.5D until the current 4B.5B back-behavior fix and this final 4B.5C visual polish have passed founder-local verification.
