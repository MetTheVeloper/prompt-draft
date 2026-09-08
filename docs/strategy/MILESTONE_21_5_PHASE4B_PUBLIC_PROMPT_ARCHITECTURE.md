# Milestone 21.5 — Phase 4B Public Prompt Architecture

Status: **DONE / DESIGN LOCKED / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent phase:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Accepted SEO/routing foundation:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

Verification / hardening records:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Founder explicit acceptance was received on 2026-09-08 after final automated, backend, production-like, staging and browser smoke verification passed.

---

## 1. Objective — ACCEPTED

Phase 21.5.4B provides a dedicated server-rendered public Prompt acquisition surface without weakening the existing protected Prompt product detail.

Canonical public Prompt routes:

```text
/prompt/:id
/fa/prompt/:id
```

Route identity is the existing numeric Archive `public_id`. Slug-based Prompt routes are deliberately out of scope.

The public route is an acquisition/presentation surface, not a replacement for the protected product route:

```text
Public SEO Prompt        -> /prompt/:id
Protected Product Prompt -> /prompts?id=<id>
```

---

## 2. Accepted security boundary

Protected Archive behavior remains authoritative:

```text
GET /api/archive            -> public sanitized list/catalog
GET /api/archive/:id        -> authenticated + email/profile gate
/prompts?id=<id>            -> protected product detail/unlock flow
```

Dedicated public detail endpoint:

```text
GET /api/public/prompts/:id
```

Rules:

```text
public/read-only
published Archive only
explicit allowlist projection
independent from protected Archive detail
must not fetch protected detail then strip fields afterward
```

Public Prompt must never expose:

```text
Prompt body
variants
unlock-gated content
private Drafts or Draft snapshots
source/internal Draft identity
email
balance/Goin state
sessions
permissions
viewer/account state
storage keys or storage credentials
```

The public database query itself must not SELECT protected Prompt body or variants.

---

## 3. Publication authority and identity

Archive remains the publication authority:

```text
prompt_archive_items.public_id -> canonical public numeric id
prompt_archive_items.status    -> draft | published | archived
```

Public availability requires:

```text
requested public_id exists
status = published
requested locale has complete authoritative presentation localization
```

A public source Draft alone is not sufficient to make a Prompt SEO-public.

---

## 4. Final Public Prompt API contract

Endpoint:

```http
GET /api/public/prompts/:id
```

Final conceptual DTO:

```ts
type PublicPromptModel = 'dall-e' | 'gpt-image-1'
type PublicPromptLocale = 'en' | 'fa'

type PublicPrompt = {
  id: number
  title: {
    en?: string
    fa?: string
  }
  description: {
    en?: string
    fa?: string
  }
  availableLocales: PublicPromptLocale[]
  publishedAt: string
  tags: string[]
  model: {
    previewGeneratedWith: PublicPromptModel
    optimizedFor: PublicPromptModel[]
  }
  images: Array<{
    position: number
    fullUrl: string
    thumbnailUrl: string
  }>
  telegramMessageId: number | null
}

type PublicPromptResponse = {
  ok: true
  prompt: PublicPrompt
}
```

Fields are allowlisted. Any later addition requires an explicit public-data decision.

`telegramMessageId` is an intentionally public presentation identifier only; it is not an Archive internal id and is used solely to construct the canonical public Telegram post URL when present.

Still deliberately absent:

```text
prompt
variants
sourceTitle
raw protected telegramUrl
internal Archive UUID
sourceUserId
sourceDraftId
Draft snapshot
storageKey
thumbnailStorageKey
unlock state
price/balance/economy information
permissions
viewer/account information
creator attribution
```

Creator attribution remains deferred to Phase 4C.

---

## 5. Backend read-model contract

Core database condition:

```sql
WHERE items.public_id = $1
  AND items.status = 'published'
```

The query may select only fields needed to construct the public allowlist.

It must not select:

```text
items.prompt
items.variants
items.source_title
source/private Draft payloads
storage keys
unlock/economy/account state
```

Storage identifiers remain private implementation details.

---

## 6. Localized description contract

4B.5A added founder-authored localized public descriptions.

Accepted contract:

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

Hard rule:

```text
Never derive or synthesize Public Prompt description from protected Prompt body or variants.
```

Rollout:

```text
025_prompt_archive_descriptions.sql
founder-reviewed backfill -> 100 published Archive rows
026_prompt_archive_published_localization_constraint.sql
```

The staging/test Archive rows 9002 and 9003 were safely pruned before the canonical 100-row backfill.

---

## 7. Availability and HTTP semantics

A public Prompt returns `200` only when all of the following are true:

```text
id is a valid positive safe integer
Archive item exists for that public_id
Archive status is published
requested route locale has complete authoritative localized title + description
```

Public semantics:

```text
published + valid locale -> 200
Archive draft            -> 404
Archive archived         -> 404
missing/deleted          -> 404
invalid public id        -> 404
missing requested locale -> route 404
```

The response must not reveal that a non-public Prompt exists internally or identify its private state.

No public redirect from an unavailable Prompt to `/prompts?id=<id>` is allowed.

---

## 8. Localization contract

Accepted locale contract:

```text
English -> default / no prefix
Persian -> /fa
Nuxt i18n strategy -> prefix_except_default
```

Locale availability is derived from authoritative presentation fields:

```text
availableLocales = valid localized title ∩ valid localized description
```

Examples:

```text
EN + FA available:
  /prompt/123     -> 200 EN
  /fa/prompt/123  -> 200 FA

EN only:
  /prompt/123     -> 200 EN
  /fa/prompt/123  -> 404

FA only:
  /prompt/123     -> 404
  /fa/prompt/123  -> 200 FA
```

The application must never present fallback language under an indexable locale URL as if it were authoritative localized content.

---

## 9. Canonical / hreflang policy

For authoritative EN + FA localization:

```text
/prompt/123
  canonical -> /prompt/123

/fa/prompt/123
  canonical -> /fa/prompt/123
```

Reciprocal alternates:

```text
en-US -> /prompt/123
fa-IR -> /fa/prompt/123
x-default -> /prompt/123
```

`x-default` points to English/default only when authoritative English exists.

`usePublicSeo` remains the shared SEO primitive.

---

## 10. Metadata and structured-data policy

SEO metadata derives only from sanitized public presentation fields.

Allowed inputs:

```text
localized public title
localized founder-authored description
publication date
public tags
public model metadata
public preview image
canonical public URL
```

Protected Prompt text must never be used to manufacture description, keywords, structured data or OG metadata.

Accepted structured-data type:

```text
CreativeWork
```

Accepted properties:

```text
@context
@type
name
url
description
datePublished
image
keywords
inLanguage
isPartOf
```

Creator/author structured data remains deferred to Phase 4C.

---

## 11. Open Graph image policy

OG/Twitter preview image priority:

```text
first valid public image by position
  -> otherwise site-level/default public OG fallback
```

No OG image may be generated from protected content or private Draft media.

EN/FA pages may share the same public preview image while keeping locale-specific textual metadata.

---

## 12. Shared Prompt presentation contract

4B.5B introduced a shared presentation shell for public and protected Prompt surfaces.

Shared presentation owns only visual/presentation data:

```text
localized title
authored description
public-safe tags/id/date/model metadata
preview/cinema media
optional public-safe Telegram post metadata
responsive LTR/RTL presentation
route-specific slots/actions
```

It must remain unaware of:

```text
Prompt body
variants
unlock state
balance/Goin
permissions
viewer/auth state
```

Public and protected routes continue to use separate data sources.

SSR media contract:

```text
first public preview -> deterministic server-rendered <img>
client visual slider -> progressive enhancement
```

Founder-approved visual behavior includes theme-aware overlays/text/tags, semantic model and Telegram badges, zero Public Prompt outer padding, and browser-history back navigation with LTR/RTL arrow direction.

---

## 13. Discovery visual integration

4B.5C keeps Discovery routing/SEO structure while adding public preview cinema.

Accepted final behavior:

```text
hero -> el-flex type="section"
hero height -> content-sized
outer default-layout padding -> zero
hero media -> already-public category cover previews only
first preview -> SSR <img>
multiple previews -> ClientOnly visual-slider
SSR image removed after cinema mount for multi-image hero
slider canvas -> absolute and clipped to hero
heading/collection alignment -> rules="ccs"
```

No protected Prompt body, variants, economy, permissions, storage or viewer data enters Discovery.

---

## 14. Creator attribution boundary

Phase 4B deliberately does not add Creator identity to the Public Prompt DTO or structured data.

Existing Discovery owner presentation remains unchanged.

Creator attribution/linking becomes eligible only after Phase 21.5.4C defines:

```text
public Creator identity
accessibility
indexability
discoverability
suspended/deleted behavior
username/canonical behavior
Prompt <-> Creator linking policy
```

---

## 15. Internal linking strategy

Accepted acquisition flow:

```text
Discovery / Home / future Blog / future Creator
  -> /prompt/:id
  -> explicit Open full prompt CTA
  -> /prompts?id=:id
```

`app/utils/publicRoutes.ts::publicPromptPath(id)` remains the canonical public route helper.

The protected route remains valid and separate.

Back buttons on the Public Prompt and protected Prompt presentation use browser history rather than hardcoded destinations.

---

## 16. Runtime / cache policy

Public Prompt is an SSR acquisition surface.

Server-side API reads use:

```text
NUXT_API_BASE_INTERNAL
Docker staging -> http://api:4000
```

Browser-visible reads use:

```text
NUXT_PUBLIC_API_BASE
staging -> https://api.grassic.ir
```

Publication correctness takes priority over aggressive caching.

No long-lived cache may allow archived/unpublished content to remain publicly served for an unsafe duration.

---

## 17. Hard security invariants

```text
1. Public Prompt query returns only Archive status=published.
2. Public Prompt query never SELECTs Prompt body.
3. Public Prompt query never SELECTs variants.
4. Public Prompt query never reads source Draft snapshot/content.
5. Public Prompt query does not depend on auth/account/economy state.
6. Public Prompt DTO contains no unlock state.
7. Public Prompt DTO contains no balance or permissions.
8. Public Prompt DTO contains no private/internal ids.
9. Public Prompt DTO contains no storage keys.
10. Non-public Archive states are public 404/unavailable.
11. Missing localization never becomes indexable fallback localization.
12. GET /api/archive/:id remains protected.
13. /prompts?id=<id> remains protected product behavior.
14. Legacy Prompt snapshot fallback is never used by Public Prompt.
15. Public description is never derived from protected Prompt content.
16. Shared presentation never merges public/protected data sources.
17. Creator attribution is not introduced until 4C policy exists.
18. Staging NUXT_PUBLIC_NOINDEX=true remains authoritative during verification.
```

---

## 18. Accepted implementation slices

```text
4B.1 Backend public read model              -> DONE / VERIFIED
4B.2 Nuxt public Prompt SSR route           -> DONE / VERIFIED
4B.3 SEO metadata                           -> DONE / VERIFIED
4B.4 Public-link migration                  -> DONE / VERIFIED
post-4B.4 interaction polish                -> DONE / VERIFIED
4B.5A Localized descriptions                -> DONE / ACCEPTED
4B.5B Shared Prompt presentation            -> DONE / ACCEPTED
4B.5C Public Discovery visual layer         -> DONE / ACCEPTED
4B.5D Final regression / founder acceptance -> DONE / ACCEPTED
```

---

## 19. Final acceptance evidence

Aggregate command:

```text
pnpm test:phase4b-final
```

Final result:

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

Backend final regression -> PASS.

Production-like Cloudflare-connected stack -> healthy.

Automated staging smoke:

```text
pnpm smoke:phase4b-final
public Prompt API 200
invalid public Prompt API 404
protected Archive detail 401
EN/FA Public Prompt SSR 200
EN/FA Discovery SSR 200
SEO/noindex/private-boundary checks PASS
```

Manual founder browser smoke -> PASS.

Founder explicit acceptance:

```text
Phase 4B accepted
```

---

## 20. Final state / next phase

```text
Phase 21.5.4B -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
```

Next:

```text
Phase 21.5.4C — Public Creator + Indexability Policy
```

4C must inherit and preserve every accepted 4A/4B routing, localization, SEO, privacy, authorization and staging-safety boundary above.
