# Milestone 21.5 — Phase 4C Public Creator Architecture + Indexability Policy

Status: **AUDIT/DESIGN PROPOSED / IMPLEMENTATION NOT STARTED / FOUNDER ACCEPTANCE PENDING**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Parent sources of truth:

```text
docs/strategy/STATUS.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
docs/strategy/MILESTONE_21_5_PHASE4B_PUBLIC_PROMPT_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4B_VERIFICATION.md
docs/strategy/MILESTONE_21_5_PHASE4B_5_PUBLIC_SURFACE_HARDENING.md
docs/strategy/MILESTONE_21_5_PHASE4B_5D_FINAL_REGRESSION_ACCEPTANCE.md
```

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

This document is the proposed Phase 4C source of truth. It records the repository audit, public/private boundary, Creator contract, indexability policy, SEO semantics, Prompt↔Creator attribution strategy, implementation slices, and acceptance gates.

Nothing in this document marks Phase 4C implementation DONE. The architecture remains proposed until founder review/explicit acceptance.

---

## 1. Inherited non-negotiable decisions

Canonical Creator routes:

```text
/creator/:username
/fa/creator/:username
```

`/user` remains an account/product surface and is not the canonical public Creator route.

Public Creator V1 may expose only intentionally-public identity/publication data.

Explicitly forbidden from the public Creator contract:

```text
email
balance/Goin
sessions
permissions
private Drafts
owner-only stats/counts
XP initially
```

Accessibility and indexability are separate concepts.

A valid Creator may be public-accessible while remaining `noindex` and absent from sitemap/discovery.

A nonexistent, suspended, deleted, or otherwise public-access-prohibited Creator must not render an accessible Creator profile.

Staging remains:

```text
https://grassic.ir
https://api.grassic.ir
NUXT_PUBLIC_NOINDEX=true
```

`prompt-draft.ir` must remain untouched during 4C development/verification.

---

## 2. Repository audit — current identity/account model

### 2.1 User schema

Current `users` identity/account fields established by migrations include:

```text
id UUID
username nullable text
email nullable text
password_hash
status active|suspended
role
created_at / updated_at
avatar_url + avatar_storage_key
cover_url + cover_storage_key
cover_thumbnail_url + cover_thumbnail_storage_key
cover dimensions
```

The database enforces case-insensitive username uniqueness through a unique index on `LOWER(username)`.

Current account identity requires at least one of username/email. A user can therefore legitimately exist without a username.

Current account states found in the authoritative schema are:

```text
active
suspended
```

No user soft-delete column or `deleted` user status exists in the audited branch. Physical deletion remains conceptually possible at the database level, and later account-state expansion must be treated as unavailable by the Creator policy unless explicitly allowed.

### 2.2 Username normalization

Backend auth and existing profile resolution normalize usernames as:

```text
trim
lowercase
regex: ^[a-z0-9._-]{3,64}$
```

`app/utils/publicRoutes.ts` already contains `publicCreatorPath(username)` with the same normalization/validation rule.

Therefore the canonical username identity for Creator URLs is lowercase normalized username.

Noncanonical casing should never create a second canonical identity.

### 2.3 Profile fields

Current progressive profile requirements know only:

```text
username
email
```

There is currently no audited database/application field for:

```text
bio
displayName
localized bio
localized display name
```

Avatar and cover media exist, but their existing account/profile use does not by itself define a new Creator privacy contract.

Conclusion:

```text
4C V1 must not invent a bio-quality requirement or pretend localized Creator biography data already exists.
```

A future bio/display-name feature requires its own storage, editing, moderation, localization, and explicit-public semantics before becoming part of the Creator contract.

---

## 3. Repository audit — current `/user` and profile APIs

### 3.1 `/user` is product/account UI

Current `/user` behavior accepts query identity:

```text
/user?id=<internal UUID>
/user?un=<username>
```

It is explicitly client-only in Nuxt route rules.

It uses optional auth and changes behavior for the owner. The page includes product/account operations such as:

```text
Draft publish/unpublish
Draft edit/delete
preview management
copy/download
admin promotion/moderation actions
owner-aware counts
XP presentation
```

This confirms `/user` cannot safely double as the canonical public SSR Creator page.

### 3.2 Existing user profile APIs are not the 4C public contract

Existing endpoints include:

```text
GET /api/users/resolve?username=...
GET /api/users/:uuid/profile
GET /api/users/:uuid/drafts
```

They were designed for the current `/user` product/profile surface.

For a non-owner, the current profile projection still exposes fields including:

```text
internal user UUID
totalXp
publicDraftCount
createdAt
username
avatar/cover
```

The owner additionally receives total Draft count and private Draft visibility/data through owner-gated paths.

Therefore:

```text
DO NOT reuse /api/users/:uuid/profile as the Public Creator V1 DTO.
DO NOT make internal UUID the public Creator route identity.
DO NOT widen existing owner/product APIs to satisfy 4C.
```

4C requires a new server-authoritative, username-keyed public projection.

---

## 4. Repository audit — publication ownership semantics

### 4.1 Public Drafts vs canonical public Prompts

`prompt_drafts.visibility` currently supports:

```text
private
public
```

Public Drafts are user-controlled product/profile publication state.

Canonical public Prompt acquisition pages, however, are served from published Archive items through the accepted 4B projection.

These are distinct concepts and should stay distinct.

### 4.2 Archive provenance

Migration 019 established user-Draft provenance on Archive items:

```text
source_kind = user_draft
source_user_id UUID -> users(id) ON DELETE SET NULL
source_draft_id text
```

The pair `(source_user_id, source_draft_id)` is unique for user-Draft-sourced Archive records when both are present.

Promotion accepts only a non-deleted public Draft belonging to an active user.

Once promoted, the Archive item is an independent Archive record; publication remains governed by Archive status.

Therefore `source_user_id` is the authoritative provenance link for Prompt↔Creator attribution where the source is a user Draft.

### 4.3 Current Discovery owner metadata

Current home/public Discovery directly LEFT JOINs `users` through `prompt_archive_items.source_user_id`, conditioned on `users.status='active'`, and may expose:

```text
owner.username
owner.avatarUrl
```

This predates the 4C Creator contract.

It is not sufficient as the final policy because it embeds a partial public-identity rule inside one query and does not expose `accessible/indexable/discoverable/reasons/signals` consistently.

### 4.4 Current Public Prompt projection

The accepted 4B `GET /api/public/prompts/:id` projection intentionally does not SELECT or expose creator/source-user identity.

That boundary must remain unchanged until the 4C Creator contract is implemented and founder-accepted.

---

## 5. Public/private boundary proposal

### 5.1 Default-deny rule

A field is not public merely because it exists on `users`, `/user`, an authenticated response, or an admin surface.

Public Creator V1 must use an explicit allowlist.

### 5.2 Proposed Public Creator V1 identity allowlist

Safe initial identity projection:

```ts
identity: {
  username: string
  avatarUrl: string | null
  cover: {
    fullUrl: string
    thumbnailUrl: string
    width: number
    height: number
    thumbnailWidth: number
    thumbnailHeight: number
  } | null
}
```

Deliberately excluded from V1 identity DTO:

```text
internal UUID
email
role
status
createdAt/updatedAt
XP
Goin/balance
permissions
session/auth state
referral state
private Drafts
owner-only stats/counts
storage keys
admin/moderation metadata
```

`createdAt/member since` is excluded initially because it is account metadata, not necessary for the public Creator identity contract.

Avatar/cover URLs are allowed only as presentation URLs. Storage keys remain private.

### 5.3 Publications allowlist

Creator publications should be projected from canonical published Archive items attributed by `source_user_id`, not by exposing raw Draft payloads.

Proposed publication summary:

```ts
{
  id: number
  title: { en?: string; fa?: string }
  description: { en?: string; fa?: string }
  availableLocales: ('en' | 'fa')[]
  publishedAt: string
  tags: string[]
  coverImage: {
    fullUrl: string
    thumbnailUrl: string
  } | null
}
```

This is presentation metadata only. It must not include:

```text
Prompt body
variants
source Draft payload/sourceTitle
sourceDraftId
sourceUserId/internal UUID
storage keys
unlock/economy/viewer state
```

The Creator publication projection should reuse the accepted public-safe Archive/Prompt presentation semantics where possible rather than creating a second protected-content path.

---

## 6. Public Creator lookup semantics

Proposed endpoint:

```text
GET /api/public/creators/:username
```

The backend performs username normalization and lookup directly. Browser/SSR code must not resolve username -> UUID and then call legacy `/api/users/:uuid/profile`.

### 6.1 Canonical lookup

Input normalization:

```text
trim
lowercase
^[a-z0-9._-]{3,64}$
```

Semantics:

```text
invalid username syntax            -> 404 public Creator not found
no matching user                   -> 404
matching user without username     -> impossible for username lookup / 404
matching suspended user            -> 404
future deleted/prohibited state    -> 404
active accessible creator          -> 200 sanitized Creator DTO
```

For public acquisition surfaces, malformed/unknown Creator identity should not reveal whether an inaccessible account exists.

### 6.2 Canonical URL behavior

The canonical identity is normalized lowercase username.

Recommended route behavior:

```text
/creator/Foo -> permanent redirect -> /creator/foo
/fa/creator/Foo -> permanent redirect -> /fa/creator/foo
```

Trailing-slash/noncanonical handling should follow the accepted 4A route semantics and strict routing audit.

The API may either normalize internally or reject noncanonical spelling; the page layer owns browser canonical redirect behavior.

---

## 7. Server-authoritative Creator policy

### 7.1 Contract

The policy must be evaluated server-side from authoritative account/publication facts and returned alongside the sanitized Creator projection.

Proposed shape:

```ts
type CreatorPublicPolicy = {
  accessible: boolean
  indexable: boolean
  discoverable: boolean
  reasons: CreatorPolicyReason[]
  signals: {
    accountActive: boolean
    canonicalUsername: boolean
    hasPublicAvatar: boolean
    hasPublicCover: boolean
    publishedPromptCount: number
    hasPublishedPrompt: boolean
  }
}
```

Important privacy rule:

The public 200 DTO may expose only policy information that is safe to disclose for an already-accessible Creator. 404 responses must remain generic and must not disclose hidden account state.

The internal policy evaluator may have richer private reasons/signals than the public response.

### 7.2 No arbitrary score

No weighted score or invented numeric quality threshold is introduced in 4C design.

Signals are direct factual booleans/counts derived from current authoritative data.

### 7.3 Accessibility

Proposed V1 accessibility rule:

```text
accessible =
  user exists
  AND status == active
  AND username exists
  AND username is canonical/valid
  AND no future public-access prohibition applies
```

Accessibility does not require avatar, cover, XP, bio, or a minimum publication count.

That preserves the accepted rule that a valid but incomplete/low-quality Creator can remain accessible.

### 7.4 Indexability

Because the current product has no explicit `creator_public` opt-in field and no bio/display-name field, the safest evidence of intentional public Creator publication is an active account with at least one canonical **published Archive Prompt** attributed through `source_user_id`.

Proposed V1 rule:

```text
indexable = accessible && hasPublishedPrompt
```

This is not a quality score and does not require avatar/cover.

Rationale:

- a published Archive Prompt is already an intentionally public, moderated/canonical publication surface;
- raw account existence alone should not automatically create an indexable search-engine identity page;
- raw `prompt_drafts.visibility='public'` is not the canonical 4B public Prompt publication contract;
- no nonexistent bio field is used as a gate;
- no arbitrary count greater than one is invented.

If founder product intent prefers every active username to be indexable, or requires an explicit Creator opt-in flag, this single rule is the primary review point before implementation.

### 7.5 Discoverability

Proposed V1 rule:

```text
discoverable = indexable
```

This keeps 4D sitemap and public Discovery from inventing a second eligibility definition.

If future curation/ranking needs a narrower discovery policy, it must be an explicit extension of the same server policy rather than a duplicate client-side heuristic.

### 7.6 Proposed reasons

Internal/safe reason vocabulary:

```text
CREATOR_NOT_FOUND
ACCOUNT_NOT_ACTIVE
USERNAME_MISSING
USERNAME_INVALID
PUBLIC_ACCESS_PROHIBITED
NO_PUBLISHED_PROMPTS
ELIGIBLE
```

For an accessible but non-indexable Creator with zero attributed published Prompts:

```text
accessible  = true
indexable   = false
discoverable = false
reasons     = [NO_PUBLISHED_PROMPTS]
```

Unavailable 404 responses should not return private reason detail.

---

## 8. Localization + SEO policy

### 8.1 Route localization

Inherited locale contract:

```text
English/default -> /creator/:username
Persian         -> /fa/creator/:username
```

Creator identity itself is currently language-neutral:

```text
username
avatar
cover
```

There is no localized bio/display-name data today.

The page chrome and generated SEO description may be localized by application translation strings, while the authoritative Creator identity remains the same across locales.

### 8.2 Canonical/hreflang

For an accessible Creator:

```text
EN page -> self canonical to /creator/:username
FA page -> self canonical to /fa/creator/:username
EN <-> FA reciprocal hreflang
x-default -> English/default Creator URL
```

Because both locales currently render the same language-neutral identity/publication graph with localized UI/SEO framing, both locale routes can exist authoritatively.

Publication cards must respect each Prompt's accepted `availableLocales`; no fake localized Prompt title/description fallback may be introduced.

### 8.3 Robots

Page-level robots:

```text
policy.indexable == true  -> index, follow
policy.indexable == false -> noindex, follow preferred for accessible Creator
```

However the existing global staging switch remains authoritative:

```text
NUXT_PUBLIC_NOINDEX=true -> staging stays noindex regardless of Creator policy
```

The current shared `usePublicSeo()` already composes page-level `noindex` with the global staging noindex switch and should be reused.

### 8.4 Structured data

Proposed Creator JSON-LD type:

```text
ProfilePage
  mainEntity -> Person
```

Public-safe Person fields only:

```text
@type: Person
name: normalized/displayed username
url: localized canonical Creator URL
image: avatar URL when present
```

Do not put email, internal UUID, role, XP, balance, permissions, private counts, storage keys, or hidden account state into JSON-LD.

Creator publication references may be added only from canonical public Prompt URLs and only if they materially improve the graph; avoid duplicating protected Prompt content.

Structured data should be emitted only for accessible Creator pages. Indexability may remain false while the accessible page still has internally consistent metadata, but noindex remains authoritative.

---

## 9. Prompt ↔ Creator linking strategy

### 9.1 Attribution eligibility

A public Prompt may expose Creator attribution only when all are true:

```text
Archive item status == published
source_user_id exists
source user resolves through Creator policy
creator.accessible == true
canonical username exists
```

If provenance is absent or Creator is unavailable, the Prompt remains valid with no Creator attribution.

Legacy/managed/Telegram-backed Archive items must not invent a Creator.

### 9.2 Public Prompt DTO extension

After the Creator contract is accepted and verified, the 4B public Prompt DTO may gain a strictly sanitized optional field:

```ts
creator: {
  username: string
  avatarUrl: string | null
} | null
```

No internal UUID should be required by browser clients.

The Prompt page link is generated with:

```text
publicCreatorPath(creator.username)
localePath(...)
```

### 9.3 Discovery migration

Current Discovery's direct `users` join for owner username/avatar should be replaced or constrained by the same Creator public policy/projection before 4C attribution is considered complete.

This prevents Discovery, Public Prompt, Creator pages, and future sitemap logic from each carrying a different definition of public identity.

---

## 10. Recommended backend architecture

Proposed modules/responsibilities:

```text
creatorPolicy.mjs
  -> normalize Creator username
  -> evaluate authoritative accessible/indexable/discoverable state
  -> stable reason/signal vocabulary

publicCreator.mjs
  -> GET /api/public/creators/:username
  -> sanitized identity projection
  -> sanitized canonical published-publication projection
  -> invokes creatorPolicy

publicPrompt.mjs
  -> later optional sanitized creator attribution using shared creator policy/projection

homeDiscovery.mjs
  -> later consume shared creator eligibility instead of standalone owner rule
```

Critical query rule:

Public Creator queries should SELECT only fields necessary for the approved public DTO/policy. Do not select protected columns and strip them later when a narrow query can avoid reading them altogether.

---

## 11. Recommended frontend architecture

Proposed files:

```text
app/pages/creator/[username].vue
app/composables/usePublicCreator.ts
app/types/publicCreator.ts
app/utils/publicCreatorSeo.ts (only if Creator-specific pure projection is useful)
```

The route must be SSR-capable by default. It must **not** be added to `clientOnlyRoutes`.

`/user` remains unchanged as account/product UI.

Creator page input is username only; it does not use internal UUID query parameters.

The public page consumes the new public Creator endpoint during SSR through the same server-internal/browser-public API-origin split accepted in 4B.

---

## 12. Implementation slices — proposed, not started

### 4C.1 — Creator policy + sanitized backend projection

Deliverables:

```text
server-authoritative policy evaluator
GET /api/public/creators/:username
sanitized identity DTO
sanitized canonical published-publication summaries
404 behavior
backend allowlist/privacy tests
```

Gate before acceptance:

```text
founder-local backend tests PASS
manual API payload inspection PASS
private-field leakage tests PASS
```

### 4C.2 — Nuxt Public Creator SSR route

Deliverables:

```text
/creator/:username
/fa/creator/:username
SSR data loading
canonical lowercase redirect behavior
real 404 for unavailable Creator
accessible-but-noindex rendering
responsive LTR/RTL public presentation
```

Gate:

```text
founder-local EN/FA SSR/runtime verification PASS
```

### 4C.3 — Creator SEO + policy projection

Deliverables:

```text
usePublicSeo integration
self canonical
EN/FA hreflang
x-default
policy-driven robots
ProfilePage + Person JSON-LD
staging noindex preservation
```

Gate:

```text
founder-local raw SSR metadata verification PASS
```

### 4C.4 — Prompt/Discovery Creator attribution migration

Only begins after 4C.1–4C.3 public Creator contract is founder-accepted as safe.

Deliverables:

```text
optional Public Prompt creator DTO
localized Prompt -> Creator links
Discovery owner metadata migrated to shared Creator policy
legacy/provenance-less Prompts remain unattributed
```

Gate:

```text
founder-local public/protected regression PASS
no new private fields in Prompt/Discovery DTOs
```

### 4C.5 — Aggregate verification + acceptance

Deliverables:

```text
aggregate frontend/backend contract tests
strict locale-routing audit
production build
founder-local browser smoke
staging smoke on grassic.ir/api.grassic.ir
NUXT_PUBLIC_NOINDEX preservation
prompt-draft.ir refusal/untouched check
```

Only after all gates and explicit founder acceptance may Phase 4C be marked DONE/ACCEPTED.

---

## 13. Verification invariants

Must remain true through every 4C slice:

```text
/user remains product/account UI
private Drafts remain private
legacy authenticated/admin endpoints retain authorization
email never enters public Creator DTO/SSR/JSON-LD
XP remains absent from Public Creator V1
Goin/balance never enters public Creator surfaces
sessions/permissions never enter public Creator surfaces
internal UUID is not the public Creator route identity
storage keys never enter public DTOs
suspended/unavailable Creator returns generic public 404
accessible != indexable
indexable/discoverable are server-authoritative
staging global noindex overrides page eligibility
prompt-draft.ir untouched
```

---

## 14. Audit conclusions

The current codebase already contains the necessary provenance and routing primitives for a safe 4C, but it does **not** yet contain a safe canonical Public Creator contract.

Most important findings:

```text
1. Existing /user is intentionally mixed owner/product UI and must stay separate.
2. Existing public-ish profile API exposes XP/counts/internal UUID and must not be reused as Creator V1.
3. Username normalization and case-insensitive uniqueness are already coherent enough for canonical username routes.
4. Avatar/cover exist; bio/display-name/localized profile text do not.
5. Archive `source_user_id` is the correct canonical Prompt provenance link for user-Draft promotions.
6. Current Discovery already exposes partial owner identity with its own direct join; this must converge on 4C policy.
7. Public Prompt deliberately has no creator today and should stay that way until the new contract is accepted.
8. No arbitrary quality score is necessary for V1.
9. The minimal defensible indexability signal is at least one attributed published Archive Prompt; this is the main founder-review rule before implementation.
```

---

## 15. Founder decision checkpoint before implementation

The audit/design is ready for review, but implementation remains blocked until explicit founder acceptance.

Primary policy decision to accept or revise:

```text
accessible  = active + valid canonical username + not prohibited
indexable   = accessible + at least one attributed published Archive Prompt
discoverable = indexable
```

No avatar/cover/bio/XP/count threshold is proposed.

If accepted, implementation should begin with 4C.1 only and proceed slice-by-slice through the verification ledger.
