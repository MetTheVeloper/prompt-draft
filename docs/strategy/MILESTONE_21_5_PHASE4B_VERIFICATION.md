# Milestone 21.5 — Phase 4B Verification Ledger

Status: **DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
```

Hardening source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
```

Final acceptance record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

---

## 1. Acceptance rule — SATISFIED

Phase 21.5.4B acceptance required:

```text
implementation complete
+ automated verification PASS
+ founder local/staging smoke PASS
+ protected authenticated browser smoke PASS
+ founder explicit acceptance
```

All conditions were satisfied on 2026-09-08.

Founder explicit acceptance:

```text
Phase 4B accepted
```

---

## 2. Final implementation state

```text
4B architecture audit                     -> DONE
4B architecture/design proposal           -> DONE / FOUNDER AGREED
4B source-of-truth contract               -> DONE / LOCKED
4B.1 backend public read model            -> DONE / FOUNDER-LOCAL VERIFIED
4B.2 Nuxt Public Prompt SSR route         -> DONE / FOUNDER-LOCAL VERIFIED
4B.3 Public Prompt SEO metadata            -> DONE / FOUNDER-LOCAL VERIFIED
4B.4 public-link migration                -> DONE / FOUNDER-LOCAL VERIFIED
post-4B.4 interaction polish              -> DONE / FOUNDER-LOCAL VERIFIED
4B.5A localized description contract      -> DONE / ACCEPTED AS SLICE
4B.5B shared Prompt presentation          -> DONE / ACCEPTED AS HARDENING SLICE
4B.5C Discovery visual layer              -> DONE / ACCEPTED AS HARDENING SLICE
4B.5D final regression / acceptance       -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
Phase 21.5.4B                             -> DONE / ACCEPTED
```

Canonical public routes:

```text
/prompt/:id
/fa/prompt/:id
```

Protected product/API routes remain:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
GET /api/archive/:id
```

---

## 3. 4B.1 Backend public read model — VERIFIED

Endpoint:

```text
GET /api/public/prompts/:id
```

Final public DTO presentation allowlist:

```text
id
localized title
localized authored description
availableLocales
publishedAt
tags
model.previewGeneratedWith
model.optimizedFor
images.position
images.fullUrl
images.thumbnailUrl
optional public-safe telegramMessageId
```

Forbidden public content:

```text
Prompt body
variants
sourceTitle
sourceUserId
sourceDraftId
private Draft payloads
storage keys
unlock state
balance/Goin
permissions
viewer/account state
creator/private attribution before 4C policy
```

Database invariant:

```text
items.public_id = requested id
AND items.status = 'published'
```

Critical query invariant:

```text
The public database query does not SELECT prompt or variants.
```

Final backend regression command:

```text
docker compose exec api npm run test:public-prompt
```

Final suite remained green after the localized-description and Telegram presentation extensions.

Final staging semantics:

```text
GET /api/public/prompts/511 -> 200
GET /api/public/prompts/0   -> 404
GET /api/archive/511 unauthenticated -> 401
```

Conclusion:

```text
4B.1 BACKEND PUBLIC READ MODEL -> FOUNDER-LOCAL + STAGING VERIFIED
```

---

## 4. 4B.2 Nuxt Public Prompt SSR route — VERIFIED

Core implementation:

```text
app/composables/usePublicPrompt.ts
app/pages/prompt/[id].vue
app/components/prompts/PromptPresentation.vue
app/components/PromptPresentation.vue
```

Accepted behavior:

```text
/prompt/:id                 -> dynamic SSR Public Prompt page
/fa/prompt/:id              -> localized SSR Public Prompt page
server data origin          -> NUXT_API_BASE_INTERNAL
browser data origin         -> NUXT_PUBLIC_API_BASE
invalid/noncanonical id     -> real 404
public API 404              -> real Nuxt 404
unavailable localization    -> real Nuxt 404
upstream failure            -> 502 rather than fake empty 200
route identity change       -> page remount by fullPath
```

Public Prompt uses only the sanitized public API contract.

Protected CTA remains separate:

```text
Public Prompt
  -> Open full prompt
  -> /prompts?id=<id> or localized /fa/prompts?id=<id>
  -> protected auth/email/unlock/economy flow
```

SSR media contract:

```text
first public preview -> real server-rendered <img>
client cinema        -> progressive enhancement only
```

A component-resolution regression during 4B.5B briefly caused the shared shell to render as an empty comment. It was diagnosed from raw SSR HTML and fixed by exposing the shared Prompt presentation under the root component name. Final local and staging SSR both contain:

```text
prompt-presentation__ssr-image
```

Final staging smoke:

```text
EN /prompt/511 -> 200
FA /fa/prompt/511 -> 200
```

Staging safety remained:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

Conclusion:

```text
4B.2 NUXT PUBLIC PROMPT SSR ROUTE -> FOUNDER-LOCAL + STAGING VERIFIED
```

---

## 5. 4B.3 Public Prompt SEO metadata — VERIFIED

Core implementation:

```text
app/utils/publicPromptSeo.ts
app/pages/prompt/[id].vue
scripts/public-prompt-seo.test.ts
```

Accepted behavior:

```text
usePublicSeo reused
EN route self-canonical
FA route self-canonical
availableLocales derived only from complete authoritative localization
x-default -> English/default
OG/Twitter title -> localized Public Prompt title
meta/OG/Twitter description -> founder-authored localized description
OG/Twitter image -> first public preview image
CreativeWork JSON-LD -> public-only sanitized fields
creator/author deliberately absent until 4C
```

CreativeWork allowlist:

```text
@context
@type = CreativeWork
name
url
description
datePublished
inLanguage
image
keywords
isPartOf
```

Explicit JSON-LD exclusions:

```text
Prompt body
variants
source Draft/private identity
storage keys
unlock state
balance/Goin
permissions
viewer/account state
creator/author until 4C
```

Final aggregate regression result:

```text
Public Prompt SEO -> 4/4 PASS
SEO contracts     -> 5/5 PASS
Strict locale-routing audit -> PASS / 447 source files / zero hazards
```

Final staging smoke verified:

```text
self canonical EN/FA
reciprocal hreflang en-US/fa-IR
x-default
OG description
Twitter description
CreativeWork JSON-LD
staging noindex
zero serialized protected private-key leakage
```

### Windows PowerShell encoding note

Direct `curl.exe` stdout displayed UTF-8 punctuation/Persian as mojibake in Windows PowerShell during some manual inspections. Browser rendering and UTF-8-aware checks were correct; this was a console decoding artifact, not an application regression.

Conclusion:

```text
4B.3 PUBLIC PROMPT SEO METADATA -> FOUNDER-LOCAL + STAGING VERIFIED
```

---

## 6. 4B.4 Public-link migration — VERIFIED

Prompt-detail acquisition links use the canonical public Prompt path; generic catalog/product links remain valid.

Accepted behavior:

```text
Discovery Prompt card -> localized /prompt/:id
Home Prompt body      -> localized /prompt/:id
Public Prompt CTA     -> localized protected /prompts?id=<id>
generic /prompts      -> unchanged catalog/product route
```

Regression command:

```text
pnpm test:public-prompt-links
```

Final aggregate result:

```text
Public Prompt link migration -> 3/3 PASS
```

Founder browser smoke confirmed public acquisition links and the protected transition in both EN and FA.

Conclusion:

```text
4B.4 PUBLIC-LINK MIGRATION -> FOUNDER-LOCAL VERIFIED
```

---

## 7. Post-4B.4 interaction polish — VERIFIED

Founder-accepted behavior:

```text
Prompt Archive card body -> localized protected detail
/user owner Draft card body -> existing three-dot menu at click point
Home category header -> localized Discovery route
Home Prompt body -> localized Public Prompt route
Home action controls remain independent
Home previous/next arrow semantics follow LTR/RTL
```

Final regression:

```text
pnpm test:interaction-polish -> 4/4 PASS
```

---

## 8. 4B.5A Localized Public Prompt Description Contract — VERIFIED / ACCEPTED

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_BACKFILL_APPROVAL.md
docs/strategy/MILESTONE_21_5_PHASE4B_5A_DESCRIPTION_CUTOVER.md
```

Accepted description contract:

```ts
description: {
  en?: string
  fa?: string
}
```

Description is the sole source for:

```text
visible Public Prompt description
meta description
og:description
twitter:description
CreativeWork.description
```

Hard invariant:

```text
Description is never generated from protected Prompt body or variants.
```

Rollout verification:

```text
migration 025 descriptions storage -> APPLIED
founder-reviewed description manifest -> APPROVED
published staging/test Archive ids 9002/9003 -> safely pruned
backfill -> 100 published Archive rows
post-backfill inventory -> 100/100 EN + 100/100 FA descriptions non-empty
migration 026 published localization constraint -> APPLIED
Admin description input tests -> PASS
backfill guardrail tests -> PASS
published localization enforcement tests -> PASS
```

Locale availability now requires:

```text
valid localized title + valid localized description
```

No fake locale fallback is permitted.

Conclusion:

```text
4B.5A -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED AS SLICE
```

---

## 9. 4B.5B Shared Prompt Presentation Shell — VERIFIED / ACCEPTED

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5B_SHARED_PRESENTATION.md
```

Accepted architecture:

```text
shared presentation only
public and protected data sources remain separate
SSR first-preview fallback
client cinema progressive enhancement
route-specific actions/content via composition
```

Shared presentation may know:

```text
localized title
authored description
public-safe tags/id/date/model
public preview media
optional public-safe Telegram post metadata
```

Shared presentation may not know:

```text
Prompt body
variants
unlock state
balance/Goin
permissions
viewer/auth state
```

Founder-approved visual/interaction polish:

```text
overlay uses themeSurface rather than hardcoded black
description/meta text uses normal theme color
tags use surface/normal theme colors
model badge uses surface/normal
Telegram badge uses blue/white and opens canonical t.me post in new tab
Public Prompt outer layout padding zero
back buttons use arrow_back LTR / arrow_forward RTL
back buttons color normal
back action uses router.back() rather than hardcoded destination
```

Final regression:

```text
Shared Prompt presentation -> 4/4 PASS
```

Founder light/dark and EN/FA browser smoke passed on public and protected surfaces.

Conclusion:

```text
4B.5B -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
```

---

## 10. 4B.5C Public Discovery Visual Layer — VERIFIED / ACCEPTED

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5C_DISCOVERY_VISUAL_LAYER.md
```

Founder-approved final contract:

```text
hero -> el-flex type="section"
hero -> content-sized, not viewport-sized
outer default-layout padding -> zero
hero media -> already-public category preview media only
SSR first image -> deterministic <img>
multiple images -> ClientOnly visual-slider enhancement
SSR image removed after cinema mount when multi-image slider is active
slider -> absolute and clipped to hero
hero + collection heading flex -> rules="ccs"
```

Preserved:

```text
canonical /discover/:slug and /fa/discover/:slug
existing Discovery SEO
curated cards
localized Public Prompt links
404/canonical route behavior
public/protected data boundary
```

Final regression:

```text
Public Discovery visual layer -> 3/3 PASS
```

The regression guard originally had a false positive on the word `balance` from CSS `text-wrap: balance`; it was narrowed to runtime/template leakage rather than style text.

Founder EN/FA, light/dark and cinema browser smoke passed.

Conclusion:

```text
4B.5C -> DONE / FOUNDER-LOCAL VISUAL VERIFIED / ACCEPTED AS HARDENING SLICE
```

---

## 11. 4B.5D Final regression / staging acceptance — PASS

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

### Aggregate frontend/SEO/routing/presentation/discovery gate

```text
pnpm test:phase4b-final
```

Final founder run:

```text
SEO contracts                         -> 5/5 PASS
Public Prompt browser/SSR DTO         -> 6/6 PASS
Public Prompt SEO                     -> 4/4 PASS
Localized Public Prompt description   -> 3/3 PASS
Shared Prompt presentation            -> 4/4 PASS
Public Discovery visual layer         -> 3/3 PASS
Public Prompt link migration          -> 3/3 PASS
Interaction polish                    -> 4/4 PASS
Strict locale-routing audit           -> PASS / 447 source files / zero hazards
```

A Windows-only runner issue (`spawnSync pnpm.cmd EINVAL`) prevented the first aggregate attempt from starting child tests. The execution layer was made shell-compatible without changing the gate list; the complete bundle then passed.

### Backend final regression

```text
docker compose exec api npm run test:public-prompt                -> PASS
docker compose exec api npm run test:archive-description-input    -> PASS
docker compose exec api npm run test:archive-published-localization -> PASS
```

### Production-like staging-connected runtime

```text
frontend    -> healthy
api         -> healthy
db          -> healthy
translator  -> healthy
cloudflared -> up
```

### Automated staging smoke

```text
pnpm smoke:phase4b-final
```

Canonical fixtures:

```text
Prompt id      -> 511
Discovery slug -> portrait-photography
```

The initial manual argument `portraits-photography` was noncanonical and correctly returned 404. The runner default contained the same typo and was corrected to the canonical slug without creating an alias.

Final result:

```text
public Prompt API: 200
invalid public Prompt API: 404
protected Archive detail API: 401
EN Public Prompt SSR: 200
FA Public Prompt SSR: 200
EN Discovery SSR: 200
FA Discovery SSR: 200
PASS: staging public API, EN/FA SSR, SEO, noindex and protected-boundary smoke passed
```

### Manual founder browser smoke

Founder confirmed all manual smoke checks passed, including:

```text
Public Prompt EN/FA runtime
Public -> protected transition
protected auth/email/unlock/copy/economy continuity
browser-history back behavior
Telegram badge/link behavior
Discovery single-layer content-sized cinema
Light/Dark readability
prompt-draft.ir untouched
```

---

## 12. Environment safety — VERIFIED

Staging verification targets:

```text
https://grassic.ir
https://api.grassic.ir
```

Production safety:

```text
prompt-draft.ir -> untouched
NUXT_PUBLIC_NOINDEX=true -> preserved on staging
X-Robots-Tag noindex -> verified
```

A transient Cloudflare Tunnel connectivity incident during 4B.5A was diagnosed as network/path instability rather than product code; local API remained healthy and the tunnel recovered. No product-code workaround was introduced.

---

## 13. Historical harness lessons retained

Useful verification lessons from Phase 4B:

```text
Do not treat Docker process Up as proof a Cloudflare tunnel is connected.
Do not treat DevTools Disable cache as equivalent to unregistering a service worker.
Windows PowerShell can mojibake direct curl UTF-8 stdout; use UTF-8-aware validation when text exactness matters.
Source-code leakage guards must search serialized/runtime keys, not narrative/CSS words.
A healthy generic frontend healthcheck does not prove a dynamic SSR route renders its child component.
Canonical smoke fixtures must come from the route source of truth, not guessed pluralization.
```

---

## 14. Key evidence / acceptance commits

Early architecture and verification records:

```text
2a9a58eacc371ee96dc1b073c582d00093f69293
  docs: lock Phase 4B public prompt architecture

8902ab959e6b95513a3e7d3d4e60a55dbc76180f
  docs: add Phase 4B verification ledger
```

4B.5A implementation/acceptance examples:

```text
b896709d3fba52346c7a418d0f585c628431b83c
  feat: add archive description storage and backfill guardrails

4daf9cd8d6273947ab54557d40143a8731a80a51
  feat: persist localized descriptions in archive admin API

21dd00c5cc79ece7f82182f4db027560a449d52b
  feat: add localized descriptions to archive editor

15cc83d6a7d1a26f1ecc73540a76244fc251ffb7
  docs: accept 4B.5A localized description cutover
```

Hardening/final verification examples:

```text
9736619ae8c9558640b8fab4e3b8701029f9f0b7
  docs: advance 4B.5 hardening to shared presentation

aafa585e125392fae100f84d7ca3d36fedb743c2
  fix: use canonical Discovery slug in final staging smoke

cf44f0bd3221429fde09ab9e4649f8874d248857
  docs: accept Phase 4B final regression
```

---

## 15. Final conclusion

```text
4B.1 VERIFIED
4B.2 VERIFIED
4B.3 VERIFIED
4B.4 VERIFIED
post-4B.4 interaction polish VERIFIED
4B.5A ACCEPTED
4B.5B ACCEPTED
4B.5C ACCEPTED
4B.5D ACCEPTED

PHASE 21.5.4B -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Next Phase 4 slice:

```text
21.5.4C — Public Creator + Indexability Policy
```

All future Phase 4 work must preserve the accepted 4A/4B localization, SEO, public/protected and staging-safety contracts.
