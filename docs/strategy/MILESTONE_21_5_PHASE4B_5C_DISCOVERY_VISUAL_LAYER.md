# Milestone 21.5 — Phase 4B.5C Public Discovery Visual Layer

Status: **IMPLEMENTED / FOUNDER VERIFICATION NEXT / NOT ACCEPTED**

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

The two Discovery heading flex groups identified during founder visual review now use:

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

## 3. Semantic hero container

The previous raw hero `<section>` is now:

```vue
<el-flex type="section" ...>
```

with the existing semantic class:

```text
public-discovery-page__hero
```

The hero remains a real section element while using the project flex primitive.

Its visual height is tied to the application viewport below the header:

```text
calc(100vh - dimension().header.height)
```

so the background cinema fills the visible acquisition surface rather than only a partial hero strip.

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

## 5. SSR-safe cinema behavior

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

The first SSR image is emitted before the client-only slider.

The shared slider component normally uses a fixed viewport canvas. Discovery scopes that canvas back into the hero through component-local CSS:

```text
position: absolute
inset: 0
width: 100%
height: 100%
```

so the animated background cannot remain fixed over the curated grid when the user scrolls.

If no category media exists, the existing theme-safe hero fallback remains available.

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

New automated gate:

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
- slider consumes only public category cover URLs.
- slider canvas is scoped absolutely to the hero.
- hero viewport height accounts for the application header.
- both founder-identified heading flexes use `rules="ccs"`.
- Discovery still uses `usePublicDiscovery`, `usePublicSeo` and `PublicDiscoveryCard`.
- protected Prompt/economy/permission state does not enter the page.

The existing:

```text
pnpm test:prompt-presentation
```

also now guards browser-history back semantics for both public and protected Prompt heroes.

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
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

Staging visual smoke should cover at least one populated category in both locales, for example:

```text
https://grassic.ir/discover/portraits-photography
https://grassic.ir/fa/discover/portraits-photography
```

Required outcomes:

```text
hero fills the acquisition viewport below the header
SSR first category preview remains present
client cinema visibly transitions between public category previews
cinema remains clipped/scoped to the hero while scrolling
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
4B.5C Discovery visual layer          -> IMPLEMENTED / FOUNDER VERIFICATION NEXT
4B.5D final regression / acceptance   -> NOT STARTED
Phase 21.5.4B                         -> NOT ACCEPTED
```

Do not start 4B.5D until the current 4B.5B back-behavior fix and this 4B.5C visual layer have passed founder-local verification.
