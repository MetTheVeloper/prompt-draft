# Milestone 21.5 — Phase 4C Creator Identity, Profile, Approval + Public Architecture

Status: **REVISED ARCHITECTURE / FOUNDER ACCEPTED / 4C.1 FOUNDATION NEXT**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

This document is the authoritative Phase 4C source of truth. It supersedes the earlier audit proposal that inferred Creator eligibility from account/publication signals.

Founder acceptance on 2026-09-09 establishes a stronger product contract: **Creator is an explicit, reviewed public-identity state, not a user role and not something inferred automatically from published Prompts.**

Nothing here marks implementation slices DONE. Every slice still requires founder-local verification and explicit acceptance.

---

## 1. Core model — role and Creator are separate axes

Existing authorization roles remain unchanged:

```text
user
admin
super_admin
```

Role answers:

> What system/admin permissions does this account have?

Creator answers:

> Does this account have an intentionally requested and administratively approved public Creator identity?

Therefore `creator` MUST NOT be added to `users.role`.

Conceptual examples:

```text
role=user        + creatorStatus=approved
role=admin       + creatorStatus=none
role=admin       + creatorStatus=approved
role=super_admin + creatorStatus=approved
```

Creator state is orthogonal to RBAC.

A published Prompt also does not automatically make its owner a Creator.

---

## 2. Creator lifecycle

Current-state vocabulary:

```text
none       -> no Creator request/state exists
pending    -> Creator request submitted and awaiting review
approved   -> public Creator identity approved
rejected   -> latest Creator request rejected; user may complete/edit and request again
suspended  -> previously approved Creator identity is administratively unavailable
```

Target lifecycle:

```text
authenticated account
  -> edits/saves profile at /manage/profile
  -> completes Creator-required profile contract
  -> requests Creator account
  -> pending
  -> admin/super_admin review
      -> approved
      -> rejected

approved
  -> may later be suspended/unsuspended independently of users.status
```

Rules:

```text
profile completion never auto-promotes a user to Creator
publishing Prompts never auto-promotes a user to Creator
Creator request requires server-authoritative profile completeness
approval requires dedicated Creator-management authorization
self-approval is not allowed by default
account suspension always makes public Creator unavailable regardless of Creator state
```

Reapplication after rejection is allowed and must preserve review/audit history.

---

## 3. Authenticated profile-management surface

All authenticated accounts use:

```text
/manage/profile
```

The avatar/profile menu will gain:

```text
Edit profile
```

The same page is used by ordinary accounts and approved Creators.

It manages existing identity/media plus new extended profile fields:

```text
avatar
cover
username
email
screenName EN/FA
bio EN/FA
article EN/FA
birthday
skills
links
location
```

Primary actions:

```text
Save changes
Request Creator Account
```

`Save changes` is always independent from Creator application. Users may build a complete profile and never request Creator status.

`Request Creator Account` becomes available only when the server-authoritative Creator-required profile contract is satisfied.

---

## 4. Extended profile field contract

### 4.1 Screen name

Localized presentation name:

```ts
screenName: {
  en: string | null
  fa: string | null
}
```

- optional for ordinary accounts
- EN + FA required for Creator application
- distinct from canonical `username`
- suitable for visible page heading, metadata and Person/ProfilePage structured data

### 4.2 Bio

Localized short Creator biography:

```ts
bio: {
  en: string | null
  fa: string | null
}
```

- optional for ordinary accounts
- EN + FA required for Creator application
- one source for visible intro + meta/OG/Twitter description projection

### 4.3 Article

Localized long-form Markdown content:

```ts
article: {
  en: string | null
  fa: string | null
}
```

- optional for ordinary accounts
- EN + FA required for Creator application
- stored as Markdown text in the database, not as mutable filesystem `.md` files
- later rendered through a sanitized Markdown pipeline
- intended for personal branding, self-description, work/product narrative and unique SEO content

### 4.4 Birthday

```ts
birthday: string | null // canonical database DATE
```

- optional for everyone
- Persian UI uses a Jalali picker
- non-Persian UI uses a Gregorian picker
- both convert to one canonical Gregorian `DATE` for storage
- **private by default and excluded from Public Creator V1**

### 4.5 Skills

Skills use a controlled taxonomy, not free-text identity strings.

Conceptual taxonomy:

```text
Technology
Design
AI / Data
Infrastructure / DevOps
Product
Marketing / SEO
Business / Management
Content / Creative
... extensible
```

Each skill has a stable slug and localized labels.

Example:

```ts
{
  slug: 'frontend-development',
  title: {
    en: 'Frontend Development',
    fa: 'توسعه فرانت‌اند'
  },
  category: 'technology'
}
```

- optional for ordinary accounts
- at least one active taxonomy skill required for Creator application
- exact initial taxonomy inventory is a separate founder-content checkpoint before profile UI acceptance

### 4.6 Links

Up to 5 public-facing profile links.

Supported initial types:

```text
website
github
linkedin
instagram
telegram
x
youtube
other
```

Links are optional for Creator application.

Only normalized web URLs are stored. No credentials/tokens/private handles are part of this contract.

### 4.7 Location

Twitter-like display location:

```ts
location: {
  text: string
  source: 'suggestion' | 'custom'
  providerPlaceId?: string
  countryCode?: string
} | null
```

- optional for everyone
- UI may provide searchable location suggestions
- user may still save custom display text
- provider metadata is internal editing metadata
- Public Creator V1 exposes only approved display-safe location text, not coordinates or provider identifiers

---

## 5. Storage architecture

Do not turn `users` into a wide mixed account/profile/Creator table.

Recommended normalized model:

```text
users
  -> authentication identity, role, account status, existing media ownership

user_profiles
  -> one-to-one extended editable profile content

profile_skills
  -> controlled localized skills taxonomy

user_profile_skills
  -> user <-> skill relationship

user_profile_links
  -> ordered max-5 links

creator_accounts
  -> current Creator lifecycle state

creator_account_events
  -> immutable Creator request/review/suspension history

creator_username_aliases (when Creator username-change support lands)
  -> SEO-safe old Creator username -> current user identity redirect lineage
```

### 5.1 Recommended `user_profiles`

Use explicit localized columns for queryability/constraints rather than hiding all profile semantics inside one arbitrary JSON document:

```text
user_id UUID PK/FK users(id)
screen_name_en TEXT
screen_name_fa TEXT
bio_en TEXT
bio_fa TEXT
article_en TEXT
article_fa TEXT
birthday DATE
location_text TEXT
location_source TEXT
location_provider_place_id TEXT
location_country_code TEXT
created_at
updated_at
```

### 5.2 Skills tables

```text
profile_skills
  slug TEXT PK
  category_slug TEXT
  title_en TEXT
  title_fa TEXT
  active BOOLEAN
  sort_order INTEGER

user_profile_skills
  user_id UUID FK
  skill_slug TEXT FK
  created_at
  PK(user_id, skill_slug)
```

### 5.3 Links table

```text
user_profile_links
  id UUID PK
  user_id UUID FK
  type TEXT
  url TEXT
  label TEXT nullable
  position SMALLINT 0..4
  created_at
  updated_at
  UNIQUE(user_id, position)
```

Restricting `position` to `0..4` plus uniqueness provides a database-level maximum of five links per profile without five hard-coded URL columns.

### 5.4 Creator state tables

```text
creator_accounts
  user_id UUID PK/FK
  status pending|approved|rejected|suspended
  requested_at
  reviewed_at nullable
  reviewed_by_user_id nullable
  review_note nullable
  approved_at nullable
  suspended_at nullable
  created_at
  updated_at

creator_account_events
  id UUID PK
  user_id UUID FK
  actor_user_id UUID nullable FK
  event_type requested|approved|rejected|suspended|unsuspended|reapplied
  metadata JSONB
  created_at
```

No row in `creator_accounts` means `creatorStatus=none`.

The current-state row supports efficient UI/public policy queries; the event table preserves lifecycle history.

Administrative approve/reject/suspend actions should additionally follow the existing admin-audit conventions where useful.

---

## 6. Creator application requirements

Server-authoritative V1 requirements:

```text
account status == active
valid canonical username exists
screenName.en non-empty
screenName.fa non-empty
bio.en non-empty
bio.fa non-empty
article.en non-empty
article.fa non-empty
at least one active selected skill
```

Not required:

```text
avatar
cover
birthday
links
location
published Prompt count
XP
Goin/balance
```

There is deliberately **no weighted profile-quality score**.

Technical maximum lengths may be enforced for abuse/data-safety reasons, but they are not SEO quality thresholds.

After approval, profile edits must not be allowed to silently remove Creator-required fields while `creatorStatus=approved`. The server must either reject an incomplete update or require an explicit state transition before the profile can fall below the approved Creator contract.

---

## 7. Authorization for Creator review

Do not grant existing broad `users.manage` permission to `admin` merely to approve Creator applications.

Introduce a dedicated permission:

```text
creators.manage
```

Target RBAC:

```text
user        -> no creator-review permission
admin       -> creators.manage
super_admin -> wildcard, therefore creators.manage
```

This lets admin + super_admin review Creator requests without widening admin access to unrelated user-account mutations.

Creator itself remains a state/capability, not a permission.

---

## 8. Username/email editing and canonical Creator identity

The new `/manage/profile` experience is intended to support editing username/email in addition to media/profile content.

This differs from the existing profile-completion endpoint, which only fills missing username/email and locks already-set identity fields.

Therefore identity editing needs a dedicated authenticated contract rather than weakening the old completion endpoint implicitly.

### Username

For approved Creators, changing username changes the canonical public URL:

```text
/creator/old-name -> /creator/new-name
/fa/creator/old-name -> /fa/creator/new-name
```

Before Creator username edits are enabled, implement Creator username alias/history so old public URLs can permanently redirect to the current canonical username and cannot be hijacked by a different public Creator identity.

### Email

Email remains private account identity. Changing it must preserve uniqueness/auth semantics and must never cause it to enter public Creator DTOs/SSR/JSON-LD.

---

## 9. Public Creator contract

Canonical routes remain:

```text
/creator/:username
/fa/creator/:username
```

`/user` remains account/product UI and is not the canonical Creator SEO route.

Target public endpoint:

```text
GET /api/public/creators/:username
```

Public lookup is username-keyed; browser clients do not resolve username -> internal UUID first.

### 9.1 Public identity allowlist

For an approved accessible Creator, Public Creator V1 may expose:

```ts
identity: {
  username: string
  screenName: { en: string; fa: string }
  bio: { en: string; fa: string }
  article: { en: string; fa: string } // Markdown source for public rendering
  avatarUrl: string | null
  cover: PublicCover | null
  skills: PublicSkill[]
  links: PublicProfileLink[]
  location: { text: string } | null
}
```

Explicitly excluded:

```text
internal user UUID
email
birthday
role
account status
Creator review metadata
review notes
XP
Goin/balance
permissions
sessions
referral state
private Drafts
owner-only stats/counts
storage keys
provider location ids/coordinates
admin audit metadata
```

### 9.2 Publications

Creator publications are canonical published Archive Prompts attributed through `source_user_id`.

Raw Draft payloads are never exposed as Public Creator publication bodies.

A Creator may be valid with zero Archive Prompts; publication count does not define Creator status.

---

## 10. Server-authoritative public policy

The earlier rule `active user + published Prompt => Creator` is superseded.

Internal policy concept:

```ts
type CreatorPublicPolicy = {
  accessible: boolean
  indexable: boolean
  discoverable: boolean
  reasons: CreatorPolicyReason[]
  signals: {
    accountActive: boolean
    creatorApproved: boolean
    canonicalUsername: boolean
    creatorProfileComplete: boolean
    hasPublishedPrompt: boolean
  }
}
```

Do not expose sensitive internal state/reasons on 404 responses.

### Accessibility

```text
accessible =
  account exists and active
  AND creator_accounts.status == approved
  AND valid canonical username exists
```

Pending/rejected/suspended/non-Creator accounts are not public Creator pages and return a generic 404.

### Indexability

```text
indexable = accessible && creatorProfileComplete
```

Because Creator approval requires the localized screen name, bio, article and skills contract, a normally valid approved Creator should already be SEO-ready.

The separate defensive `creatorProfileComplete` check preserves the accepted distinction between accessibility and indexability if legacy/corrupt/migrated data ever violates the approval invariant.

No published-Prompt requirement is used.

### Discoverability

V1:

```text
discoverable = indexable
```

4D sitemap/discovery must consume the same policy rather than inventing another Creator definition.

---

## 11. Public Creator SEO semantics

Locale routes:

```text
EN/default -> /creator/:username
FA         -> /fa/creator/:username
```

Creator approval requires authoritative EN + FA screen name/bio/article content, allowing both localized routes to carry real localized Creator content.

Per locale:

```text
screenName[locale] -> primary visible name/title source
bio[locale]        -> visible intro + meta/OG/Twitter description source
article[locale]    -> long-form unique Creator content
```

SEO:

```text
self canonical
reciprocal EN/FA hreflang
x-default -> EN/default
ProfilePage JSON-LD
Person mainEntity
policy-driven robots
staging NUXT_PUBLIC_NOINDEX always wins
```

The existing staging contract remains:

```text
https://grassic.ir
https://api.grassic.ir
NUXT_PUBLIC_NOINDEX=true
```

`prompt-draft.ir` remains untouched during 4C implementation/verification.

---

## 12. Prompt ↔ Creator attribution

Attribution can be added only after the public Creator contract is verified safe.

A public Prompt may link to a Creator only when:

```text
Archive item status == published
source_user_id exists
source account is active
Creator state == approved
canonical username exists
```

A user may own published Archive Prompts while having no Creator account. In that case the Prompt remains public and simply has no public personal-brand attribution.

Legacy/managed/Telegram/provenance-less Archive items remain valid without Creator attribution.

---

## 13. Revised Phase 4C implementation slices

The earlier 4C.1–4C.5 plan is superseded because Creator profile data and approval lifecycle now need to exist before a public Creator projection can be correct.

### 4C.1 — Creator Profile Foundation

Deliverables:

```text
migration for normalized extended profile storage
skills taxonomy schema
profile-skill relationship
max-5 ordered profile-link schema
Creator current-state + immutable lifecycle-event schema
creator profile requirement/normalization pure module
contract tests for Creator completeness and safe limits
no public route yet
```

Gate:

```text
founder-local schema apply PASS
backend unit tests PASS
manual schema inspection PASS
```

### 4C.2 — Authenticated Profile Management

Deliverables:

```text
authenticated profile read/update API
/manage/profile
Edit profile avatar-menu entry
existing avatar/cover integration
screenName/bio/article/birthday/skills/links/location editing
Save changes independent from Creator request
Jalali/Gregorian birthday input -> canonical DATE
identity-edit contract for username/email
```

Username-change alias/SEO protection must be solved before approved-Creator username edits are accepted.

### 4C.3 — Creator Application + Admin Review

Deliverables:

```text
Request Creator Account API/UI
server-authoritative requirement gate
pending/rejected/reapply flow
creators.manage permission for admin + super_admin
manage/users Creator badges/filter/detail
approve/reject/suspend/unsuspend actions
audit/event history
no self-approval
```

### 4C.4 — Public Creator Policy + Sanitized Backend Projection

Deliverables:

```text
server-authoritative Creator public policy
GET /api/public/creators/:username
approved-only public access
generic 404 for none/pending/rejected/suspended/unavailable
localized safe public profile DTO
canonical published-publication summaries
privacy denylist tests
```

### 4C.5 — Nuxt Public Creator SSR Route

Deliverables:

```text
/creator/:username
/fa/creator/:username
SSR loading
canonical lowercase/alias redirect behavior
real 404
responsive LTR/RTL profile/personal-brand presentation
sanitized Markdown rendering
```

### 4C.6 — Creator SEO + Indexability

Deliverables:

```text
screenName/bio/article localized SEO projection
self canonical
EN/FA hreflang
x-default
policy-driven robots
ProfilePage + Person JSON-LD
staging noindex preservation
```

### 4C.7 — Prompt/Discovery Creator Attribution

Blocked until 4C.4–4C.6 are founder-accepted as safe.

Deliverables:

```text
optional Public Prompt creator attribution
locale-safe Creator links
Discovery owner metadata converges on Creator policy
non-Creator source users remain unattributed
```

### 4C.8 — Aggregate + Staging Acceptance

Deliverables:

```text
aggregate frontend/backend contract tests
strict locale-route audit
production build
founder-local browser smoke
staging API/SSR smoke on grassic.ir/api.grassic.ir
staging global noindex proof
prompt-draft.ir untouched proof
explicit founder Phase 4C acceptance
```

---

## 14. Privacy and security invariants

Must remain true throughout 4C:

```text
Creator is not a role
Creator approval never broadens admin/system permissions
profile completeness never auto-approves Creator
published Prompts never auto-approve Creator
/user remains product/account UI
/manage/profile remains authenticated
private Drafts remain private
email never enters public Creator DTO/SSR/JSON-LD
birthday is private in V1
XP remains absent from Public Creator V1
Goin/balance absent
permissions/sessions absent
internal UUID is not browser Creator identity
storage keys absent
location provider ids/coordinates absent
pending/rejected/suspended Creator identity not publicly disclosed
staging noindex wins globally
prompt-draft.ir untouched
```

---

## 15. Founder-accepted decisions recorded 2026-09-09

Accepted:

```text
Creator is a separate public-identity state, not a new role
all authenticated users may edit/save extended profile fields
profile completion alone does not create Creator status
Creator application requires ScreenName EN/FA + Bio EN/FA + Article EN/FA + >=1 skill
birthday optional and locale-appropriate picker; canonical DATE storage
skills use controlled multilingual taxonomy
links are optional and modeled as an extensible ordered collection, max 5
location supports suggestion + custom display text
/manage/profile is the common editing surface
Creator application is explicitly submitted
admin + super_admin can review through dedicated Creator-management authorization
approved Creator becomes eligible for canonical public personal-brand page
published Prompt count is not required to define or index a Creator
```

Open content/product detail that does **not** block 4C.1 schema foundation:

```text
exact initial skills taxonomy inventory/order
final visual placement of long-form Creator article
final profile-page visual composition
```

Next implementation action:

```text
4C.1 Creator Profile Foundation only
```
