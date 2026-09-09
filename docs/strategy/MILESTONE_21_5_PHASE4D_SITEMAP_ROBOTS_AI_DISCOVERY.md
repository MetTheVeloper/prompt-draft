# Milestone 21.5 — Phase 4D Sitemap / Robots / Discovery + AI Discovery

Status: **DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED 2026-09-09**

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

Detailed records:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

---

## 1. Final Phase 4D outcome

Phase 4D established one authoritative public-discovery/indexability pipeline for Prompt Draft:

```text
server-authoritative public eligibility
        |
        v
GET /api/public/inventory
        |
        v
shared canonical public URL inventory
        |
        +--> sitemap.xml
        +--> llms.txt
        +--> legacy static compatibility

shared application SEO route policy
        +--> route/runtime noindex
        +--> X-Robots-Tag
        +--> robots exclusions

native Nuxt Discovery SSR
        +--> visible public content
        +--> usePublicSeo
        +--> truthful structured data
```

Phase 4D is fully accepted.

Next roadmap slice:

```text
21.5.4E — Blog V1
```

---

## 2. Locked inherited public/indexability model

Locale model:

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content may be advertised as a localized public URL.

No fake fallback localization is allowed in canonical, sitemap, llms, structured-data, or Blog inventory work.

### Public Prompt

Canonical routes:

```text
/prompt/:id
/fa/prompt/:id
```

Public Prompt eligibility remains:

```text
published-only
positive numeric public id
authoritative localized title + description
sanitized public presentation projection
```

The protected product detail remains:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
```

and the backend protected detail remains:

```text
GET /api/archive/:id
```

Public Prompt pages may intentionally link users to the protected product route as a CTA; that route must not become the canonical acquisition/SEO URL.

### Public Creator

Canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Policy remains server-authoritative:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

No Prompt-count, role, ownership, or SQL shortcut may recreate this policy.

---

## 3. 4D.2 — Shared public inventory + sitemap — ACCEPTED

Public inventory endpoint:

```text
GET /api/public/inventory
```

Public-safe shape:

```text
Prompt
  id
  availableLocales

Creator
  username
  availableLocales
  policy.indexable
  policy.discoverable
```

The endpoint does not expose protected Prompt bodies/variants, internal source ids, private Drafts, account/lifecycle metadata, email, birthday, balances, permissions, sessions, storage metadata or admin data.

Shared builder:

```text
scripts/public-url-inventory.ts
```

Accepted resource families before Blog V1:

```text
/
/guide
/discover/:slug
/prompt/:id
/creator/:username
```

Sitemap delivery exists in both:

```text
Nitro runtime -> /sitemap.xml
static export -> .output/public/sitemap.xml
```

Both use the same canonical inventory.

---

## 4. 4D.3 — Robots normalization + staging precedence — ACCEPTED

Shared application-route policy:

```text
shared/seo-route-policy.ts
```

Shared origin robots renderer:

```text
shared/public-robots.ts
```

Delivery:

```text
server/routes/robots.txt.ts
scripts/generate-public-seo.ts
```

Legacy static `public/robots.txt` was removed.

Application/private route families remain excluded consistently in EN + FA:

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

Staging contract:

```text
NUXT_PUBLIC_NOINDEX=true always wins
origin robots keeps application/private exclusions
origin robots does not advertise Sitemap
runtime sitemap publishes zero URLs
public pages remain fetchable so noindex signals can be observed
```

### Cloudflare edge nuance

External staging verification found Cloudflare Managed robots content is prepended before the origin policy.

The managed block currently contains content signals and crawler-specific restrictions. This is an edge policy, not the Prompt Draft application indexability source of truth.

Origin `User-agent: *` behavior remains separately validated.

---

## 5. 4D.4 — llms.txt supplemental AI discovery — ACCEPTED

`/llms.txt` is an optional/experimental LLM-friendly orientation to already-public canonical resources.

It is not:

```text
crawler permission
robots replacement
sitemap replacement
training opt-in/out
guarantee of AI indexing/citation
second indexability policy
```

Architecture:

```text
shared public inventory
-> renderSitemapXml(...)
-> renderLlmsTxt(...)
```

Runtime/static delivery:

```text
server/utils/public-seo-inventory.ts
server/routes/llms.txt.ts
scripts/generate-public-seo.ts
```

Staging global noindex behavior:

```text
inventory = []
llms.txt = orientation-only
canonical link count = 0
```

Indexing-enabled static verification proved sitemap and llms use identical URL sets.

---

## 6. 4D.5 — Native Discovery SEO + legacy generator retirement — ACCEPTED

The audit found the old post-generator still duplicated Discovery authority by:

```text
fetching /api/discover independently
injecting a visible snapshot
injecting independent CollectionPage JSON-LD
using /prompts?id= legacy Prompt detail links
using /user?un= legacy Creator detail links
expecting legacy owner rather than current creator attribution
```

Accepted architecture:

```text
one shared Discovery catalog
-> native /discover/:slug SSR
-> native visible cards
-> usePublicSeo
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
nuxt.config legacy static prerenders
public URL inventory
```

`scripts/generate-public-seo.ts` no longer fetches or independently renders Discovery content.

It keeps only crawler-artifact generation and stale legacy-marker cleanup.

Native Discovery structured data uses public-safe data only and canonical localized Prompt/Creator URLs.

---

## 7. 4D.6 — Final aggregate/staging/static acceptance — ACCEPTED

Detailed evidence:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

Final commands:

```powershell
pnpm test:phase4d-final
pnpm smoke:phase4d-final
pnpm verify:phase4d-static
```

All passed on 2026-09-09.

### Aggregate regression

```text
accepted 4A–4C baseline -> PASS
public URL inventory    -> 7/7 PASS
robots/runtime          -> 7/7 PASS
llms/runtime            -> 9/9 PASS
Discovery migration     -> 8/8 PASS
```

### External staging

```text
/api/public/inventory                       200
/api/archive/<representative id> anonymous  401
/robots.txt                                  200
/sitemap.xml                                 200
/llms.txt                                    200
EN Prompt/Creator/Discovery                  200
FA Prompt/Creator/Discovery                  200
```

Representative fixtures at verification time:

```text
Prompt 6
Creator grassias
```

Staging noindex, canonical/hreflang, structured data, privacy boundaries, and protected Archive authorization all remained intact.

`prompt-draft.ir` was not targeted.

### Production-like static verification

```text
expected canonical public inventory = 220
sitemap URLs                        = 220
llms URLs                           = 220
sitemap URL set == llms URL set
331 routes prerendered
12 native EN/FA Discovery pages inspected
legacy/private checks clean
```

---

## 8. Final accepted public-resource inventory before Blog

```text
Core
  /
  /fa
  /guide
  /fa/guide

Discovery
  /discover/:slug
  /fa/discover/:slug

Public Prompt
  /prompt/:id
  /fa/prompt/:id

Public Creator
  /creator/:username
  /fa/creator/:username
```

Blog URLs are intentionally not part of this inventory yet.

4E must add Blog only after it defines authoritative published Article/localization semantics.

---

## 9. Non-negotiable boundaries inherited into Blog V1

```text
DO NOT weaken backend authorization for SEO/public content.
DO NOT expose GET /api/archive/:id publicly.
DO NOT expose protected Prompt bodies/variants.
DO NOT expose private Drafts.
DO NOT expose private Creator/account fields.
DO NOT recreate Creator indexability policy.
DO NOT create fake localized public URLs.
DO NOT allow route-level SEO to override NUXT_PUBLIC_NOINDEX=true.
DO NOT query GitHub per public request.
DO NOT create an independent Blog sitemap/indexability policy.
DO NOT put unpublished/draft Blog content into sitemap or llms.txt.
DO NOT touch prompt-draft.ir before an explicit rollout phase.
```

---

## 10. Final state

```text
4D.1 -> AUDITED
4D.2 -> DONE / ACCEPTED
4D.3 -> DONE / ACCEPTED
4D.4 -> DONE / ACCEPTED
4D.5 -> DONE / ACCEPTED
4D.6 -> DONE / FOUNDER-LOCAL + EXTERNAL STAGING + STATIC VERIFIED / ACCEPTED
Phase 4D -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09
```

Next:

```text
21.5.4E — Blog V1
```
