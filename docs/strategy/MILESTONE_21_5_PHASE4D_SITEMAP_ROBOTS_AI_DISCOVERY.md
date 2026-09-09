# Milestone 21.5 — Phase 4D Sitemap / Robots / Discovery + AI Discovery

Status: **IN PROGRESS / 4D.2–4D.5 DONE + ACCEPTED / 4D.6 IMPLEMENTED / FINAL VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Accepted dependencies:

```text
21.5.4A SEO Contracts & Route Semantics                  ACCEPTED
21.5.4B Public Prompt Architecture                       ACCEPTED
21.5.4C Public Creator Architecture + Indexability       ACCEPTED
```

Operational verification rule:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

Detailed later-slice records:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

This file is the Phase 4D source of truth. Phase 4D itself remains unaccepted until the 4D.6 aggregate/static/external-staging verification passes and the founder explicitly accepts the phase.

---

## 1. Objective

Phase 4D consolidates search-engine and AI-oriented public discovery around one authoritative public URL/indexability contract.

The target is:

```text
one canonical public inventory
-> sitemap.xml
-> robots behavior
-> Discovery SEO/structured-data integration
-> llms.txt supplemental AI-discovery projection
```

4D must not create parallel definitions of:

```text
Prompt visibility
Prompt locale availability
Creator accessibility
Creator indexability/discoverability
public/private route boundaries
```

The accepted 4A–4C policies remain authoritative.

---

## 2. Mandatory audit scope + resulting architecture

The current authoritative branch was audited before 4D implementation.

The audit covered:

```text
robots delivery
sitemap generation
legacy public SEO post-generation
Nuxt routeRules
server X-Robots-Tag behavior
NUXT_PUBLIC_NOINDEX handling
usePublicSeo
Public Prompt locale availability
Public Creator indexable/discoverable policy
Discovery API/SSR/structured-data behavior
pnpm generate compatibility
Docker/Nitro runtime delivery
```

Key findings:

```text
public/robots.txt originally duplicated only part of the accepted application noindex policy
public/llms.txt did not exist
scripts/generate-public-seo.ts originally owned sitemap/robots and legacy Discovery enrichment
legacy Discovery HTML still used /prompts?id= and /user?un= detail links
Public Prompt availableLocales already had one authoritative localization contract
Public Creator indexability/discoverability was already server-authoritative under accepted 4C
Creator inventory could not be inferred from Prompt ownership/publication count
Docker/Nitro uses pnpm build rather than pnpm generate
therefore crawler artifacts needed both runtime and legacy static delivery
```

4D.1 audit is complete. Its findings drove accepted 4D.2–4D.5 and the current 4D.6 final verification harness.

---

## 3. Locked public/indexability inputs inherited from 4A–4C

### Locale model

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content may create an indexable localized URL.

No fake fallback localization may be put into sitemap, structured discovery, or AI-discovery output.

### Public Prompt

Canonical routes:

```text
/prompt/:id
/fa/prompt/:id
```

Eligibility continues to come from the accepted public Prompt contract:

```text
published-only public item
authoritative localized title + description for each advertised locale
public numeric id
sanitized public presentation fields only
```

Never expose through 4D:

```text
protected Prompt body
variants
unlock state
private Draft payload
source Draft id
source user UUID
storage keys
balance/Goin
permissions/viewer/account state
```

### Public Creator

Canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Creator policy remains:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

4D consumes this result. It does not reproduce Creator eligibility with SQL heuristics, publication counts, roles, or profile scoring.

### Discovery

Discovery remains a sanitized public acquisition surface.

4D preserves:

```text
real canonical/404 behavior
approved Creator attribution policy
public-only Prompt projection
locale-aware canonical links
```

---

## 4. Shared public inventory + sitemap — ACCEPTED 4D.2

Dynamic public eligibility is supplied by:

```text
GET /api/public/inventory
```

Public response intentionally contains only URL-inventory inputs:

```text
Prompt
  public numeric id
  authoritative availableLocales

Creator
  canonical username
  availableLocales
  policy.indexable
  policy.discoverable
```

It does not serialize protected Prompt data, internal ids, account/lifecycle metadata, balances, permissions, sessions, storage/provider data, or admin data.

Shared URL projection:

```text
scripts/public-url-inventory.ts
```

Resource families:

```text
/
/guide
/discover/:slug
/prompt/:id
/creator/:username
```

Blog is deliberately absent until 4E establishes published Article semantics.

`NUXT_PUBLIC_NOINDEX=true` is an outer inventory gate:

```text
buildPublicUrlInventory -> []
```

Sitemap delivery exists in both paths:

```text
Nitro/Docker runtime -> GET /sitemap.xml
legacy static export -> .output/public/sitemap.xml
```

Both consume the same `buildPublicUrlInventory` + `renderSitemapXml` contract.

4D.2 founder evidence included:

```text
pnpm test:public-url-inventory -> 7/7 PASS
pnpm test:public-inventory-api -> 16/16 PASS
GET /api/public/inventory -> 101 Prompts + 1 Creator at verification time
privacy scan -> clean
production-like pnpm generate -> PASS
sitemap canonical route count -> 220 at verification time
```

Accepted 2026-09-09.

---

## 5. Robots normalization + staging precedence — ACCEPTED 4D.3

Accepted architecture:

```text
shared/seo-route-policy.ts
  -> one EN/FA application-route policy

shared/public-robots.ts
  -> one robots renderer

server/routes/robots.txt.ts
  -> runtime-aware robots delivery

scripts/generate-public-seo.ts
  -> static-export robots delivery from the same renderer

public/robots.txt
  -> removed
```

Application noindex route families include:

```text
/create
/collage
/vectorizer
/history
/dashboard
/login
/manage
/wizard
/prompts
/user
```

with the same accepted `/fa` space and nested manage/wizard behavior.

Staging precedence:

```text
NUXT_PUBLIC_NOINDEX=true
-> response X-Robots-Tag noindex remains authoritative
-> robots keeps application/private exclusions
-> robots does not advertise Sitemap
-> runtime sitemap contains zero public URLs
```

The staging robots model intentionally does not use global `Disallow: /`, because crawlers must be able to fetch public pages and observe noindex signals.

4D.3 founder evidence included:

```text
pnpm test:robots-policy -> 6/6 PASS
pnpm test:public-url-inventory -> 7/7 PASS
pnpm frontend -> PASS
runtime /robots.txt -> 200 + noindex + all EN/FA disallows + no Sitemap
runtime /sitemap.xml -> 200 + noindex + 0 URLs + no legacy detail routes
```

Accepted 2026-09-09.

External Cloudflare-edge proof is intentionally part of 4D.6.

---

## 6. AI discovery — llms.txt — ACCEPTED 4D.4

`/llms.txt` is treated as an optional/experimental supplemental AI-discovery convention.

It is not:

```text
a crawler permission system
a robots.txt replacement
a sitemap replacement
a training opt-in or opt-out mechanism
a guarantee that an AI system will index or cite the site
an independent indexability source of truth
```

Architecture:

```text
shared public URL inventory
-> sitemap.xml
-> llms.txt
```

Runtime/static implementation:

```text
scripts/public-url-inventory.ts
  renderLlmsTxt(resources, siteUrl)

server/utils/public-seo-inventory.ts
  shared cached runtime inventory acquisition

server/routes/llms.txt.ts
  Nitro runtime llms delivery

scripts/generate-public-seo.ts
  static sitemap + llms + robots from one publicInventory
```

The output uses a Markdown shape compatible with the audited August-2026 llms.txt proposal:

```text
# Prompt Draft
> short summary
## Core
## Discovery
## Creators
## Public Prompts
```

No page-level Markdown mirrors or extra llms discoverability headers were added in V1.

Staging behavior:

```text
NUXT_PUBLIC_NOINDEX=true
-> inventory=[]
-> llms orientation only
-> zero canonical links
```

4D.4 founder evidence:

```text
pnpm test:llms-discovery -> 9/9 PASS
pnpm test:public-url-inventory -> 7/7 PASS
pnpm frontend -> PASS
runtime staging-config /llms.txt -> 200 / no-store / noindex / zero canonical links
production-like static projection -> sitemap 220 / llms 220 / identical URL sets
private + legacy scans -> clean
```

Explicitly accepted 2026-09-09.

---

## 7. Native Discovery SEO + legacy generator retirement — ACCEPTED 4D.5

Detailed record:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
```

Audit found the legacy post-generator was still:

```text
fetching /api/discover a second time
injecting a second visible Discovery snapshot
injecting independent CollectionPage JSON-LD
using /prompts?id= Prompt detail links
using /user?un= Creator detail links
expecting legacy owner instead of current creator attribution
```

Accepted architecture:

```text
one shared Discovery catalog
-> native Nuxt /discover/:slug SSR
-> native visible cards
-> native usePublicSeo metadata
-> native CollectionPage / ItemList JSON-LD
```

Authoritative Discovery catalog:

```text
app/shared/public-discovery.ts
```

Root compatibility shim:

```text
shared/public-discovery.ts
```

Consumers include:

```text
useDiscoveryPreferences
nuxt.config legacy prerender routes
public URL inventory
```

Native Discovery JSON-LD uses only sanitized public data:

```text
localized title
canonical localized /prompt/:id
publishedAt
language
tags
public image
optional approved Creator username + canonical /creator/:username
```

`scripts/generate-public-seo.ts` no longer fetches or renders Discovery content independently. It retains only cleanup for stale legacy markers plus the crawler artifacts that truly require post-generation projection.

4D.5 focused verification:

```text
pnpm test:discovery-seo -> 8/8 PASS
pnpm test:public-url-inventory -> 7/7 PASS
```

Final frontend verification:

```text
Nuxt client build PASS
Nuxt server build PASS
Nitro node-server build PASS
Docker image built
frontend container started
```

Final raw staging SSR source was inspected for both:

```text
/discover/portrait-photography
/fa/discover/portrait-photography
```

and proved:

```text
correct locale title/description/lang/dir
self canonical + reciprocal hreflang + x-default
staging noindex meta
native CollectionPage -> ItemList -> CreativeWork
canonical /prompt/:id and /fa/prompt/:id
no /prompts?id=
no /user?un=
no protected/private field matches
```

The live sample did not contain Creator attribution, so runtime `author` was naturally absent. The focused contract test proves the optional approved-Creator path uses canonical localized `/creator/:username` URLs.

The founder explicitly authorized acceptance on 2026-09-09.

Production-like fresh static generation is intentionally executed once in 4D.6 rather than repeated during 4D.5 debugging.

---

## 8. Final aggregate + staging acceptance — 4D.6 CURRENT

Detailed record:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

4D.6 introduces no new indexability/public policy.

It adds three verification commands:

```powershell
pnpm test:phase4d-final
pnpm smoke:phase4d-final
pnpm verify:phase4d-static
```

### 8.1 Aggregate regression

```text
scripts/phase4d-final-regression.mjs
```

Runs without rebuild:

```text
accepted 4A–4C aggregate baseline
public URL inventory/sitemap contracts
robots/runtime contracts
llms/runtime contracts
native Discovery/legacy retirement contracts
```

### 8.2 External staging smoke

```text
scripts/phase4d-final-staging-smoke.mjs
```

Defaults to:

```text
https://grassic.ir
https://api.grassic.ir
```

and explicitly refuses `prompt-draft.ir` targets.

It dynamically selects an authoritative EN+FA Prompt and an indexable/discoverable EN+FA Creator from `/api/public/inventory` and checks:

```text
public inventory privacy
protected /api/archive/:id still 401/403 unauthenticated
external robots.txt staging precedence
external sitemap.xml zero-URL staging behavior
external llms.txt zero-link staging behavior
EN + FA Prompt SSR
EN + FA Creator SSR
EN + FA Discovery SSR
canonical/hreflang/structured data
legacy/private exclusion
```

### 8.3 Production-like static compatibility

```text
scripts/phase4d-static-generate-verification.mjs
```

The wrapper runs one isolated production-like `pnpm generate` against the current local public inventory without mutating the founder's parent shell environment.

It dynamically calculates expected canonical URL count from:

```text
static routes
6 Discovery categories
all authoritative Prompt locales
all indexable Creator locales
```

Then verifies:

```text
sitemap count == expected
llms count == expected
sitemap URL set == llms URL set
robots advertises example.test/sitemap.xml
all 12 EN/FA Discovery routes prerender natively
no staging noindex in production-like static HTML
no legacy snapshot markers
no /prompts?id=
no /user?un=
no private/protected serialized fields
```

4D.6 is implemented but not accepted until all three commands pass and the founder explicitly accepts the final Phase 4D evidence.

---

## 9. Verification discipline

Project-wide rule:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

4D.6 current changes are verification scripts/package commands/docs only.

The 4D.5 frontend runtime image was already rebuilt successfully.

Therefore the next gate does not require another runtime rebuild:

```text
DO NOT run pnpm frontend merely for 4D.6
DO NOT run pnpm api
DO NOT run pnpm stack
```

Final order:

```text
1. pnpm test:phase4d-final
2. pnpm smoke:phase4d-final
3. pnpm verify:phase4d-static
```

The static verifier is intentionally last because it is the expensive gate.

---

## 10. Non-negotiable safety boundaries

```text
DO NOT weaken backend authorization for SEO or AI discovery.
DO NOT expose GET /api/archive/:id publicly.
DO NOT expose protected Prompt bodies/variants.
DO NOT expose private Drafts.
DO NOT expose private Creator/account fields.
DO NOT infer Creator from users.role or Prompt ownership.
DO NOT create a second Creator indexability definition.
DO NOT create fake locale sitemap/llms entries.
DO NOT let llms.txt override robots/indexability policy.
DO NOT let route-level SEO override NUXT_PUBLIC_NOINDEX=true.
DO NOT query GitHub or another external service per public request merely to build llms/sitemap data.
DO NOT touch prompt-draft.ir during 4D staging implementation/verification.
```

---

## 11. Execution status / acceptance rule

Current state:

```text
4D -> IN PROGRESS / FINAL VERIFICATION PENDING
4D.1 -> AUDITED
4D.2 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4D.3 -> DONE / FOUNDER-LOCAL + STAGING-CONFIG RUNTIME VERIFIED / ACCEPTED 2026-09-09
4D.4 -> DONE / FOUNDER-LOCAL + STAGING-CONFIG VERIFIED / ACCEPTED 2026-09-09
4D.5 -> DONE / FOUNDER-LOCAL + STAGING SSR VERIFIED / ACCEPTED 2026-09-09
4D.6 -> IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
```

Required final evidence:

```text
[ ] pnpm test:phase4d-final -> PASS
[ ] pnpm smoke:phase4d-final -> PASS
[ ] pnpm verify:phase4d-static -> PASS
[ ] prompt-draft.ir not targeted
[ ] founder explicitly accepts Phase 4D
```

Only after those pass may 4D become:

```text
DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
```

Then the roadmap proceeds to:

```text
21.5.4E — Blog V1
```
