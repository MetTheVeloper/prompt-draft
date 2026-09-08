# Milestone 21.5 — Phase 4B.5C Public Discovery Visual Layer

Status: **DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE**

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

Final acceptance successor:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
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

## 2. Founder-approved alignment polish

The two Discovery heading flex groups use:

```text
rules="ccs"
```

This applies to:

```text
hero title/description group
collection eyebrow/title group
```

---

## 3. Semantic content-sized hero container

The previous raw hero `<section>` is:

```vue
<el-flex type="section" ...>
```

with:

```text
public-discovery-page__hero
```

Founder review established that the hero is **content-sized**, not viewport-height. Its height is determined by its own title/description/actions/padding.

No `100vh`, header-derived hero height variable or hero/content viewport `min-height` remains.

The default-layout page padding is disabled for base route:

```text
discover-slug
```

so `/discover/:slug` and `/fa/discover/:slug` are full-bleed at the layout boundary.

---

## 4. Public-only media source

Cinema sources come only from the already-public category result set returned by:

```text
usePublicDiscovery()
GET /api/discover?...tags
```

Each source is:

```text
item.coverImage.fullUrl
or item.coverImage.thumbnailUrl
```

Sources are de-duplicated.

No protected detail API, Prompt body, variants, storage keys, economy state, permissions or authenticated viewer state is read.

---

## 5. SSR-safe single-layer cinema behavior

The hero preserves a deterministic request-time image:

```text
first public category cover -> SSR <img>
```

With multiple category covers, the existing cinema primitive progressively enhances on the client:

```text
ClientOnly
  -> visual-slider
  -> heroSources
  -> deterministic ordering
```

After client cinema mounts, the SSR fallback image is removed for multi-image heroes. Therefore static fallback + animated canvas do not remain as two simultaneous visible image layers.

For a single-image category, the SSR image remains the sole media layer. With no media, the theme-safe fallback remains.

All hero media/cinema is scoped behind the content with the equivalent of:

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

Discovery locally overrides the shared slider canvas from fixed to absolute positioning, bounding it to the hero and preventing it from overlaying the curated grid on scroll.

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
- deterministic SSR image exists before ClientOnly enhancement.
- multi-image SSR fallback is removed after cinema mount.
- slider consumes only public category cover URLs.
- hero media/canvas is absolutely scoped to the hero.
- hero/content do not reintroduce viewport-derived height behavior.
- default layout padding is zero for `discover-slug`.
- both founder-identified heading flexes use `rules="ccs"`.
- Discovery still uses `usePublicDiscovery`, `usePublicSeo` and `PublicDiscoveryCard`.
- protected Prompt/economy/permission state does not enter the runtime/template surface.

The protected-boundary assertion strips scoped CSS before checking protected-state words, avoiding false positives such as CSS `text-wrap: balance`.

---

## 8. Founder verification — 2026-09-08

Founder browser review confirmed the final visual behavior after the last polish:

```text
no default 32px Discovery layout padding
hero height fits its own content
cover/cinema clipped to hero bounds
single visible media layer after cinema mount
client cinema does not remain fixed over the grid
semantic el-flex section retained
founder-approved ccs alignment retained
EN/FA presentation remains correct
```

This visual slice is therefore complete. Its automated/staging contracts remain part of 4B.5D final regression.

---

## 9. Current state

```text
4B.5A localized descriptions          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
4B.5B shared Prompt presentation      -> FOUNDER-LOCAL VISUAL VERIFIED
4B.5C Discovery visual layer          -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
4B.5D final regression / acceptance   -> IN PROGRESS
Phase 21.5.4B                         -> NOT ACCEPTED
```

Proceed only through the 4B.5D final regression/acceptance record before starting 4C.
