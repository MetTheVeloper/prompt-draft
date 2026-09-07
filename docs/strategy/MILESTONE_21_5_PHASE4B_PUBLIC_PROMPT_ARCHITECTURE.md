# Milestone 21.5 — Phase 4B Public Prompt Architecture

Status: **IN PROGRESS / DESIGN LOCKED / IMPLEMENTATION STARTED / NOT ACCEPTED**

Date: 2026-09-07

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

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
```

---

## 1. Objective

Phase 21.5.4B introduces a dedicated server-rendered public Prompt acquisition surface without weakening the existing protected Prompt product detail.

Canonical public Prompt routes:

```text
/prompt/:id
/fa/prompt/:id
```

The route identity is the existing numeric Archive `public_id`. Slug-based Prompt routes are deliberately out of scope.

The public Prompt route is an acquisition/presentation surface. It is not a replacement for the protected product route:

```text
Public SEO Prompt             -> /prompt/:id
Protected Product Prompt      -> /prompts?id=<id>
```

The public surface may expose only an explicit sanitized presentation projection.

---

## 2. Accepted security boundary

The existing protected contract remains authoritative:

```text
GET /api/archive            -> public sanitized list/catalog
GET /api/archive/:id        -> authenticated + email/profile gate
/prompts?id=<id>            -> protected product detail flow
```

Phase 4B must never make `GET /api/archive/:id` public and must never obtain protected detail and strip fields afterward.

The public query itself must avoid selecting protected columns.

Public Prompt must never expose:

```text
Prompt body
variants
unlock-gated content
private Drafts or Draft snapshots
source/internal Draft identity
email
balance / Goin state
sessions
permissions
viewer/account state
storage keys or storage credentials
```

---

## 3. Audit findings frozen into the design

The current Archive model already provides the correct publication authority and public identity:

```text
prompt_archive_items.public_id -> canonical public numeric id
prompt_archive_items.status    -> draft | published | archived
```

Current public Archive/Discovery code already demonstrates safe presentation primitives:

```text
localized EN/FA titles
publishedAt
public tags
public preview image URLs
preview/model metadata
optional intentionally public owner username/avatar in Discovery
```

Current protected Archive detail additionally carries:

```text
sourceTitle
prompt
full images
variants
```

and is guarded by Archive access authorization.

A public source Draft is not sufficient to make a Prompt SEO-public. Promoted user Drafts enter Archive as `status='draft'`; therefore Archive publication state remains the final public availability authority.

---

## 4. Public Prompt API contract

Phase 4B uses an endpoint independent from protected Archive detail:

```http
GET /api/public/prompts/:id
```

The endpoint is intentionally public and read-only.

### 4.1 Public DTO

Target contract:

```ts
type PublicPromptModel = 'dall-e' | 'gpt-image-1'

type PublicPromptLocale = 'en' | 'fa'

type PublicPrompt = {
  id: number
  title: {
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
}

type PublicPromptResponse = {
  ok: true
  prompt: PublicPrompt
}
```

Fields are allowlisted. Adding a field later requires an explicit public-data decision.

### 4.2 Fields deliberately absent in V1

```text
prompt
variants
sourceTitle
telegramUrl
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

`telegramUrl` is already public elsewhere but is not required by the Phase 4B public Prompt contract, so it stays out of this narrow projection.

Creator attribution is deferred to Phase 4C so Public Creator identity/indexability policy is not accidentally pre-decided in 4B.

---

## 5. Backend read-model design

Public Prompt must use a dedicated read path over Archive data.

Core database condition:

```sql
WHERE items.public_id = $1
  AND items.status = 'published'
```

The public query may select only the fields needed to construct the allowlisted DTO.

In particular, these Archive columns must not be selected:

```text
items.prompt
items.variants
items.source_title
source/private Draft payloads
```

Images may expose only browser-usable public presentation URLs and position.

Storage identifiers remain private implementation details.

---

## 6. Availability and HTTP semantics

A public Prompt returns `200` only when all of the following are true:

```text
id is a valid positive safe integer
Archive item exists for that public_id
Archive status is published
requested route locale has authoritative localized presentation content
```

From a public client's perspective all unavailable content states are treated equivalently.

Expected route/API behavior:

```text
published                    -> 200
Archive draft                -> 404
Archive archived             -> 404
missing/deleted              -> 404
invalid public id            -> unavailable / route 404 semantics
missing requested locale     -> route 404
```

The public response must not reveal that a non-public Prompt exists internally or identify its private state.

No public redirect from an unavailable Prompt to `/prompts?id=<id>` is allowed.

---

## 7. Localization contract

Accepted global locale contract remains:

```text
English -> default / no prefix
Persian -> /fa
Nuxt i18n strategy -> prefix_except_default
```

Public Prompt derives locale availability from authoritative localized fields rather than UI fallback behavior.

Target domain field:

```ts
availableLocales: Array<'en' | 'fa'>
```

A locale URL may render/index only when its localization is authoritative and valid.

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

The application must never render fallback English content under an indexable Persian Prompt URL and pretend it is localized Persian content, or vice versa.

The current Archive title validation normally requires both EN and FA; the availability contract remains explicit so later content models cannot silently violate this rule.

---

## 8. Canonical / hreflang policy

For a Prompt with authoritative EN and FA localizations:

```text
/prompt/123
  canonical -> /prompt/123

/fa/prompt/123
  canonical -> /fa/prompt/123
```

Both expose reciprocal alternates:

```text
en-US -> /prompt/123
fa-IR -> /fa/prompt/123
x-default -> /prompt/123
```

`x-default` points to English/default only when a valid English localization exists.

`usePublicSeo` remains the shared SEO primitive; Phase 4B must not introduce a parallel canonical/hreflang implementation.

---

## 9. Metadata and structured-data policy

SEO metadata must be derived only from sanitized public presentation fields.

Allowed inputs include:

```text
localized public title
publication date
public tags
public model metadata
public preview image
canonical public URL
```

Protected Prompt text must never be used to manufacture description, keywords, structured data or OG metadata.

Initial structured-data type:

```text
CreativeWork
```

Safe conceptual properties:

```text
@type
name
url
datePublished
image
keywords
inLanguage
isPartOf
```

Creator/author structured data is deferred to Phase 4C.

Forbidden structured-data inputs include:

```text
text = protected Prompt body
articleBody = protected Prompt body
variants
unlock/account/economy state
```

---

## 10. Open Graph image policy

OG/Twitter preview image priority:

```text
first valid public image by position
  -> otherwise site-level/default public OG fallback
```

The route must not generate an OG image from protected content or private Draft media.

EN/FA pages may share the same public preview image while keeping locale-specific textual metadata.

---

## 11. Creator attribution boundary

Phase 4B deliberately does not add creator identity to the Public Prompt DTO or structured data.

Existing Discovery owner presentation remains unchanged.

Creator attribution/linking for Public Prompt becomes eligible only after Phase 21.5.4C defines:

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

## 12. Internal linking strategy

Once the Public Prompt page is implemented, public acquisition surfaces should link to the canonical public Prompt route rather than directly into the protected product detail.

Target acquisition flow:

```text
Discovery / Home / future Blog / future Creator
  -> /prompt/:id
  -> explicit product CTA
  -> /prompts?id=:id
```

`app/utils/publicRoutes.ts::publicPromptPath(id)` is the canonical public route helper and must be reused.

The protected route remains valid and is not redirected or retired in 4B.

---

## 13. Runtime / cache policy

Public Prompt is an SSR acquisition surface and therefore remains under the default Nuxt SSR policy.

Server-side API reads use the existing server-only internal API origin:

```text
NUXT_API_BASE_INTERNAL
Docker staging target -> http://api:4000
```

Browser-visible reads, when needed, use:

```text
NUXT_PUBLIC_API_BASE
staging -> https://api.grassic.ir
```

Phase 4B prioritizes publication correctness over aggressive caching.

No long-lived cache may allow an archived/unpublished Prompt to remain publicly served for an unsafe duration.

Short revalidation/caching may be introduced later only with explicit invalidation/freshness semantics.

---

## 14. Security invariants

The following are hard Phase 4B invariants:

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
13. /prompts?id=<id> remains protected/client-product behavior.
14. Legacy Prompt snapshot fallback is never used by Public Prompt.
15. Creator attribution is not introduced until the 4C policy exists.
```

---

## 15. Implementation slices

Phase 4B implementation proceeds in narrow slices:

### 4B.1 — Backend public read model

```text
dedicated /api/public/prompts/:id handler
explicit public DTO mapper
published-only database query
public image/tag/model projection
invalid/non-public/missing semantics
leakage-focused contract tests
```

### 4B.2 — Nuxt public Prompt SSR route

```text
/prompt/:id page
SSR-safe public Prompt composable/read helper
requested-locale availability gate
real 404 behavior
public presentation UI only
```

### 4B.3 — SEO metadata

```text
usePublicSeo integration
canonical/hreflang/x-default
OG/Twitter image/title metadata
truthful CreativeWork structured data
staging noindex precedence preserved
```

### 4B.4 — Public-link migration

```text
Discovery/public acquisition links -> publicPromptPath(id)
product CTA -> /prompts?id=<id>
no protected-route behavior change
```

### 4B.5 — Verification / founder smoke

```text
contract tests
build
EN/FA SSR HTML
200/404/publication state behavior
canonical/hreflang
OG/structured data
X-Robots-Tag staging protection
protected endpoint regression
protected product route regression
```

---

## 16. Acceptance gate

Phase 4B remains **IN PROGRESS** until all required automated checks and founder-local/staging runtime smoke checks pass.

The assistant must not mark Phase 4B `ACCEPTED` merely because implementation or automated tests pass.

Required final state transition:

```text
implementation complete
  -> automated verification PASS
  -> founder local/staging smoke PASS
  -> founder explicitly accepts
  -> Phase 4B ACCEPTED
```

Until then the canonical status is:

```text
IN PROGRESS / NOT ACCEPTED
```
