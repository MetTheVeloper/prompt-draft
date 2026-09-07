# Milestone 21.5 — Phase 4A SEO Contracts & Route Semantics

Status: **IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-07

Branch:

```text
feature/growth-foundation
```

Parent Phase 4 source:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

---

## 1. Objective

Phase 4A establishes the shared SEO and public-route contract before Public Prompt, Public Creator and Blog implementation.

This slice deliberately extends the existing `usePublicSeo` and Nuxt i18n architecture rather than creating parallel metadata/routing systems.

---

## 2. Implemented SEO primitive

`app/composables/usePublicSeo.ts` is now the shared public SEO primitive.

Implemented behavior:

```text
reactive title + description
Prompt Draft title suffix policy
absolute canonical URLs when NUXT_PUBLIC_SITE_URL is configured
locale-aware canonical path resolution
Open Graph metadata
Twitter metadata
OG locale + alternate locale metadata
hreflang alternate links
x-default alternate
route-level noindex
staging/global NUXT_PUBLIC_NOINDEX precedence
optional authoritative JSON-LD injection
HTML-safe JSON-LD serialization
route-policy enable/disable gate
```

Staging noindex remains authoritative over any route-level intent.

---

## 3. Locale routing contract activated

Nuxt i18n now uses:

```text
defaultLocale: en
strategy: prefix_except_default
```

Accepted route shape:

```text
EN -> unprefixed
FA -> /fa
```

Examples:

```text
/guide
/fa/guide

/discover/posters-editorial
/fa/discover/posters-editorial
```

Client-heavy/private route rules explicitly cover both EN and `/fa` variants so locale routing does not accidentally promote application surfaces into SSR acquisition surfaces.

---

## 4. Locale-safe navigation work

Implemented compatibility work includes:

```text
Header route comparisons use useRouteBaseName
Header programmatic navigation uses localePath
Header navigation items resolve locale-aware paths
default layout route comparisons use useRouteBaseName
default layout programmatic navigation uses localePath
central el-flex link primitive localizes internal links
external/protocol-relative links remain unchanged
login fallback and next-path behavior preserve locale
localized login-loop prevention
```

A reproducible route-audit script is included because GitHub branch code search is not sufficient evidence for an exhaustive migration.

Commands:

```powershell
pnpm seo:audit-routes
pnpm seo:audit-routes:strict
```

The strict command must pass before Phase 4A is accepted.

The audit currently checks for:

```text
raw navigateTo('/...')
raw navigateTo({ path: '/...' })
raw router.push/replace('/...')
raw router.push/replace({ path: '/...' })
raw window.location internal navigation
new URL('/...', window.location.origin) locale hazards
direct route.name equality comparisons
```

Any finding must be reviewed rather than suppressed blindly.

---

## 5. Canonical public route helpers

`app/utils/publicRoutes.ts` defines reusable public route identity helpers.

Current canonical contracts:

```text
home      -> /
guide     -> /guide
blog      -> /blog
Prompt    -> /prompt/:id
Creator   -> /creator/:username
Discovery -> /discover/:slug
Blog post -> /blog/:slug
```

The helpers normalize/validate entity identifiers instead of scattering route construction throughout components.

Contract tests:

```powershell
pnpm test:seo-contracts
```

---

## 6. Native metadata consumers

Native SSR metadata is now attached to existing acquisition surfaces through the shared primitive.

Current consumers:

```text
/ + /fa
/guide + /fa/guide
/discover/* + /fa/discover/*
```

Home and Guide use a shared route policy plugin.

Discovery retains its existing page-level `usePublicSeo` integration and SSR-aware sanitized data path.

No duplicate metadata stack was introduced.

---

## 7. Robots/indexability policy

`server/middleware/seo-route-policy.ts` sends:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

for application/private/legacy product surfaces including their `/fa` equivalents:

```text
/create
/collage
/vectorizer
/history
/dashboard
/login
/manage/**
/wizard/**
/prompts
/user
```

This server-level policy is independent of whether the route is SSR or client-rendered.

The staging-wide middleware remains stronger and continues to noindex all staging responses when `NUXT_PUBLIC_NOINDEX=true`.

---

## 8. Discovery status/redirect semantics

Invalid `/discover/:slug` routes now produce a real 404 instead of rendering a not-found UI with HTTP 200 semantics.

Discovery route middleware also:

```text
handles malformed URL encoding as 404 rather than accidental 500
normalizes valid slugs to lowercase canonical form
removes non-canonical trailing slash through permanent redirect behavior
preserves query/hash during canonical redirect
supports EN and /fa route spaces
```

---

## 9. Legacy compatibility state

The Milestone 21 static compatibility path remains present for now:

```text
scripts/generate-public-seo.ts
pnpm generate
```

It is not the authoritative hybrid-runtime SEO path.

Removal/reduction remains 4D/4F work after native runtime behavior is verified.

---

## 10. Founder-local verification gate

Run from the latest `feature/growth-foundation` checkout.

### Gate A — route compatibility audit

```powershell
pnpm seo:audit-routes:strict
```

Expected:

```text
PASS with zero unresolved locale-routing hazards
```

If findings are reported, do not ignore them. Return the output for remediation before acceptance.

### Gate B — pure route contract tests

```powershell
pnpm test:seo-contracts
```

Expected:

```text
all tests PASS
```

### Gate C — production build

```powershell
pnpm build
```

Expected:

```text
Nuxt client build PASS
Nuxt SSR server build PASS
Nitro node-server output PASS
```

### Gate D — preview/runtime smoke

With the independent API available as required by the existing local preview contract:

```powershell
pnpm preview
```

Verify:

```text
/                                    -> English home
/fa                                  -> Persian home
/guide                               -> English guide
/fa/guide                            -> Persian guide
/discover/posters-editorial          -> English discovery
/fa/discover/posters-editorial       -> Persian discovery
/discover/does-not-exist             -> 404
/fa/discover/does-not-exist          -> 404
```

### Gate E — locale navigation regression

Verify in both EN and FA:

```text
header navigation
language switching
/create
/login
login redirect/next behavior
/prompts
/user
/manage when authorized
Wizard entry
profile menu actions
```

FA navigation must remain inside `/fa/...` unless the user explicitly switches to English.

### Gate F — raw metadata inspection

Use a configured `NUXT_PUBLIC_SITE_URL` and inspect raw HTML for:

```text
/
/fa
/guide
/fa/guide
/discover/posters-editorial
/fa/discover/posters-editorial
```

Verify:

```text
localized html lang/dir
route-specific title/description
self-referencing canonical
EN <-> FA hreflang alternates
x-default -> English/default URL
OG/Twitter metadata
no protected data leakage
```

### Gate G — noindex policy

Verify application routes return the server noindex header in both locale spaces.

Examples:

```text
/prompts
/fa/prompts
/user
/fa/user
/manage
/fa/manage
```

Expected header:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

When staging `NUXT_PUBLIC_NOINDEX=true`, public acquisition routes must also remain globally noindex.

---

## 11. Acceptance rule

Do not mark 4A accepted merely because the implementation is committed.

Acceptance requires:

```text
strict route audit PASS
SEO contract tests PASS
production build PASS
EN/FA runtime smoke PASS
raw metadata/canonical/hreflang inspection PASS
noindex behavior PASS
founder acceptance
```

After 4A acceptance, proceed to:

```text
21.5.4B — Public Prompt Architecture
```
