# Milestone 21.5 — Phase 4A SEO Contracts & Route Semantics

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

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

Founder-local runtime verification is complete and 4A is accepted.

---

## 2. Accepted SEO primitive

`app/composables/usePublicSeo.ts` is the shared public SEO primitive.

Accepted behavior:

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

## 3. Accepted locale routing contract

Nuxt i18n uses:

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

## 4. Locale-safe navigation

Accepted compatibility work includes:

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

Reproducible source audit commands:

```powershell
pnpm seo:audit-routes
pnpm seo:audit-routes:strict
```

The strict audit checks for locale-routing hazards including:

```text
raw navigateTo('/...')
raw navigateTo({ path: '/...' })
raw router.push/replace('/...')
raw router.push/replace({ path: '/...' })
raw window.location internal navigation
new URL('/...', window.location.origin) locale hazards
direct route.name equality comparisons
```

Founder-local strict audit result:

```text
PASS: 441 source files scanned; no locale-routing hazards found.
```

---

## 5. Canonical public route helpers

`app/utils/publicRoutes.ts` defines reusable public route identity helpers.

Accepted canonical contracts:

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

Contract command:

```powershell
pnpm test:seo-contracts
```

Founder-local result:

```text
5 tests / 5 PASS
static route contract
Prompt positive numeric ID
Creator normalized username
Discovery normalized slug
Blog normalized slug
```

---

## 6. Native metadata consumers

Native SSR metadata is attached to existing acquisition surfaces through the shared primitive.

Current consumers:

```text
/ + /fa
/guide + /fa/guide
/discover/* + /fa/discover/*
```

Home and Guide SEO policy is consumed from component setup in `default.vue`; it is not executed from a global Nuxt plugin.

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

Legacy application-route prerenders are now limited to the explicit legacy static-generate path so current Docker/Nitro request-time middleware remains authoritative for these headers.

The staging-wide middleware remains stronger and noindexes all staging responses when `NUXT_PUBLIC_NOINDEX=true`.

---

## 8. Discovery status/redirect semantics

Invalid `/discover/:slug` routes produce a real HTTP 404 instead of a not-found UI with HTTP 200 semantics.

Discovery route handling also:

```text
handles malformed URL encoding as 404 rather than accidental 500
normalizes valid slugs to lowercase canonical form
removes non-canonical trailing slash through permanent redirect behavior
preserves query/hash during canonical redirect
supports EN and /fa route spaces
```

Founder-local canonical redirect smoke verified uppercase and trailing-slash variants in both locale spaces return permanent `301` redirects to the canonical lowercase/no-trailing-slash route.

---

## 9. Legacy compatibility state

The Milestone 21 static compatibility path remains present:

```text
scripts/generate-public-seo.ts
pnpm generate
NUXT_LEGACY_STATIC_GENERATE=true
```

It is not the authoritative hybrid-runtime SEO path.

Removal/reduction remains 4D/4F work after native runtime migration is complete.

---

## 10. Founder-local acceptance evidence

### Gate A — route compatibility audit

```powershell
pnpm seo:audit-routes:strict
```

Result:

```text
PASS
441 source files scanned
zero unresolved locale-routing hazards
```

### Gate B — pure route contract tests

```powershell
pnpm test:seo-contracts
```

Result:

```text
PASS
5 / 5 tests
```

### Gate C — production build

```powershell
pnpm build
```

Result:

```text
PASS
Nuxt client build
Nuxt SSR server build
Nitro node-server output
```

Non-blocking existing build warnings did not prevent acceptance.

### Gate D — real staging/runtime route smoke

Verified through the Docker/Nitro + Cloudflare staging path on `https://grassic.ir`:

```text
/                                    -> 200 English home
/fa                                  -> 200 Persian home
/guide                               -> 200 English guide
/fa/guide                            -> 200 Persian guide
/discover/posters-editorial          -> 200 English discovery
/fa/discover/posters-editorial       -> 200 Persian discovery
/discover/does-not-exist             -> 404
/fa/discover/does-not-exist          -> 404
```

Canonical uppercase/trailing-slash Discovery variants returned `301` to their canonical route in both EN and FA.

### Gate E — locale navigation regression

Founder browser smoke PASS across EN and FA including:

```text
header navigation
language switching
route preservation during language switching
query preservation, including /user?un=grass
/create
/login
login redirect/next behavior
/prompts
/user
/manage when authorized
Wizard entry
profile/menu navigation
refresh on localized client-only routes
```

FA navigation remained inside `/fa/...` unless language was explicitly switched to English.

### Gate F — raw SSR metadata inspection

Raw HTML inspection PASS for:

```text
/
/fa
/guide
/fa/guide
/discover/posters-editorial
/fa/discover/posters-editorial
```

Verified:

```text
EN html lang=en-US + dir=ltr
FA html lang=fa-IR + dir=rtl
route-specific localized title/description
self-referencing canonical
reciprocal en-US/fa-IR hreflang
x-default -> English/default URL
correct og:locale + alternate locale
OG title/description/url
Twitter metadata
staging robots meta
no protected Prompt/account/private Draft leakage observed
```

### Gate G — noindex policy

Application/private route header smoke PASS in both locale spaces, including:

```text
/create
/prompts
/user
/manage
/login
/dashboard
/manage/dashboard
/wizard/portrait
and /fa equivalents
```

Expected and observed:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

Staging-wide noindex precedence also PASS on public acquisition routes:

```text
/
/fa
/guide
/fa/guide
/discover/posters-editorial
/fa/discover/posters-editorial
```

with:

```text
NUXT_PUBLIC_NOINDEX=true
X-Robots-Tag: noindex, nofollow, noarchive
```

---

## 11. Verification-found regressions and remediation

The acceptance smoke found real regressions; both were fixed before acceptance.

### 11.1 Vue I18n initialization error / Persian font regression

Observed after locale switching and refresh:

```text
Nuxt client error page
SyntaxError: 26
```

Vue I18n error code 26 maps to `useI18n()` being called outside the top-level of a component setup function.

Root cause:

```text
app/plugins/public-static-seo.ts
  -> global Nuxt plugin called useI18n()
  -> also called usePublicSeo(), which itself calls useI18n()
```

Remediation:

```text
removed the invalid global SEO plugin
moved Home/Guide shared SEO policy to component setup in default.vue
kept usePublicSeo as a component-level composable
```

A second locale-related regression was found in the Persian font selector:

```text
old selector: html[lang='fa']
actual accepted SSR lang: fa-IR
```

Remediation:

```text
html[lang|='fa']
```

which correctly covers both `fa` and `fa-IR`.

Founder re-smoke confirmed refresh, locale switching and Persian font behavior were fixed.

### 11.2 Legacy prerender bypassed request-time noindex middleware

Observed during header smoke:

```text
/manage       -> 200 but missing X-Robots-Tag
/fa/manage    -> 200 with expected X-Robots-Tag
```

Root cause:

```text
/manage and other application routes remained in Nitro prerender.routes
EN prerendered output bypassed request-time seo-route-policy middleware
FA variant was not prerendered and therefore behaved correctly
```

Remediation:

```text
application/client-only prerenders are now gated behind NUXT_LEGACY_STATIC_GENERATE=true
current hybrid Docker/Nitro runtime serves them request-time
seo-route-policy remains authoritative for application-route X-Robots-Tag
```

Expanded post-fix smoke PASS for EN/FA Create, Prompts, User, Manage, Login, Dashboard, nested Manage and Wizard routes.

Relevant remediation commits at acceptance time include:

```text
8d05c3fd95c174ac6dc7b4f5eea1be2fcab50375
  -> i18n initialization + Persian font remediation completed

aeaa6353f89e0ca48a9668a3382100579593e617
  -> legacy app prerender isolation for request-time SEO policy
```

---

## 12. Acceptance decision

All Phase 4A acceptance requirements are satisfied:

```text
strict route audit PASS
SEO contract tests PASS
production build PASS
EN/FA real-runtime smoke PASS
canonical redirect smoke PASS
browser locale/navigation regression smoke PASS
raw metadata/canonical/hreflang inspection PASS
application-route noindex PASS
staging global noindex precedence PASS
founder acceptance PASS
```

Phase 4A is therefore:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

Proceed to:

```text
21.5.4B — Public Prompt Architecture
```
