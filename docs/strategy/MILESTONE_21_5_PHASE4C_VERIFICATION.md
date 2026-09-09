# Milestone 21.5 — Phase 4C Verification Ledger

Status: **ARCHITECTURE FOUNDER-ACCEPTED / 4C.1–4C.7 ACCEPTED / 4C.8 FINAL VERIFICATION IN PROGRESS**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

Implementation records:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_3_CREATOR_APPLICATION_ADMIN_REVIEW.md
docs/strategy/MILESTONE_21_5_PHASE4C_4_PUBLIC_CREATOR_POLICY_API.md
docs/strategy/MILESTONE_21_5_PHASE4C_5_PUBLIC_CREATOR_SSR.md
docs/strategy/MILESTONE_21_5_PHASE4C_6_CREATOR_SEO_INDEXABILITY.md
docs/strategy/MILESTONE_21_5_PHASE4C_7_PROMPT_DISCOVERY_CREATOR_ATTRIBUTION.md
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

No implementation slice is DONE merely because code exists. Every slice requires founder-local verification and explicit acceptance.

---

## 1. Current checkpoint

```text
4C repository audit                         -> COMPLETE
4C revised Creator/profile architecture     -> FOUNDER ACCEPTED 2026-09-09
4C.1 Creator Profile Foundation             -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.2 Authenticated Profile Management       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.3 Creator Application + Admin Review     -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.4 Public Creator policy/API              -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.5 Public Creator SSR route               -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.6 Creator SEO/indexability               -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.7 Prompt/Discovery attribution           -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.8 aggregate/staging acceptance           -> IMPLEMENTED / FINAL VERIFICATION PENDING
Phase 21.5.4C                               -> IN PROGRESS / NOT YET FINAL-ACCEPTED
```

---

## 2. Locked architecture

```text
role=user|admin|super_admin remains RBAC only
Creator is independent explicit public-identity state
profile completion != Creator approval
published Prompt != Creator approval
all authenticated users can save extended profile data
Creator request requires localized Creator profile contract
admin + super_admin review through dedicated creators.manage permission
```

Creator application readiness:

```text
active account
valid canonical username
screenName.en
screenName.fa
bio.en
bio.fa
article.en
article.fa
>= 1 active taxonomy skill
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

Public Creator policy:

```text
accessible = account exists + active + Creator approved + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
published Prompt count = signal only / never a Creator gate
```

---

## 3. 4C.1 — Creator Profile Foundation

Accepted implementation:

```text
027_creator_profile_foundation.sql
user_profiles
profile_skill_categories
profile_skills
user_profile_skills
user_profile_links
creator_accounts
creator_account_events
pure Creator readiness/normalization module
```

Founder-local evidence:

```text
db:schema -> migrations through 027 PASS
test:creator-profile-foundation -> 7/7 PASS
test:public-prompt -> 10/10 PASS
7 expected Creator/profile tables present
```

Founder explicit acceptance:

```text
4C.1 تایید
```

Result:

```text
4C.1 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 4. 4C.2 — Authenticated Profile Management

Accepted backend/frontend surface:

```text
GET /api/profile
PUT /api/profile
/manage/profile
/fa/manage/profile
Edit profile in avatar menu
```

Verified contract includes:

```text
ordinary accounts may save incomplete profiles
Save changes never creates Creator state
username/email validation + uniqueness
approved/suspended Creator username rename remains alias-gated
approved/suspended Creator cannot silently remove required Creator profile fields
private canonical birthday DATE
controlled skill taxonomy
max-5 HTTP/HTTPS links
provider-independent custom location text
avatar/cover media flows
localized ScreenName/Bio/Article
Creator readiness/status
```

Skills taxonomy V1:

```text
028_seed_profile_skill_taxonomy.sql
8 active categories
40 active skills
```

Founder-local evidence:

```text
test:profile-skill-taxonomy -> 4/4 PASS
profile-management -> 8/8 PASS
Creator foundation -> 7/7 PASS
Public Prompt regression -> 10/10 PASS
frontend production build PASS
browser save/reload/identity/skills/birthday/media smoke PASS
```

Accepted V1 deferral:

```text
provider-backed location suggestions -> later; custom location text accepted for V1
```

Result:

```text
4C.2 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 5. 4C.3 — Creator Application + Admin Review

Accepted owner request:

```text
POST /api/creator-account/request
```

Accepted admin review:

```text
GET  /api/admin/creators
GET  /api/admin/creators/:userId
GET  /api/admin/creators/:userId/events
POST /api/admin/creators/:userId/approve
POST /api/admin/creators/:userId/reject
POST /api/admin/creators/:userId/suspend
POST /api/admin/creators/:userId/unsuspend
```

Authorization:

```text
creators.manage
user        -> no
admin       -> yes, without users.manage
super_admin -> wildcard
```

Lifecycle:

```text
none -> pending/requested
rejected -> pending/reapplied
pending -> idempotent pending
pending -> approved | rejected
approved -> suspended
suspended -> approved
```

Safety:

```text
request readiness recalculated from saved DB state
approval readiness recalculated again inside transaction
self-review blocked backend + UI
lifecycle events + admin audit records
bounded optional review notes
```

Founder-local final evidence:

```text
test:generated-username -> 3/3 PASS
test:creator-account -> 15/15 PASS
test:profile-management -> 8/8 PASS
frontend Docker production build -> PASS
request/pending/reject/reapply/approve/suspend/restore browser flows PASS
self-review block PASS
```

Result:

```text
4C.3 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 6. 4C.4 — Public Creator Policy + Sanitized API

Accepted API:

```text
GET /api/public/creators/:username
```

Behavior:

```text
approved/active/canonical -> 200
none/pending/rejected/Creator-suspended/account-inactive -> generic 404
invalid/noncanonical username -> generic 404
non-GET -> 405 Allow GET
```

Positive public DTO includes only:

```text
identity.username
localized ScreenName/Bio/Article
safe avatar/cover
active localized skills
safe public links
location.text only
canonical published Archive summaries
policy.indexable/discoverable
```

Explicitly excluded:

```text
internal UUID
email
birthday
role/account status
Creator review/lifecycle internals
XP/Goin
permissions/sessions/referrals
private Drafts
storage keys
location provider metadata
admin audit data
raw Prompt bodies/variants/source ids
```

Founder-local evidence:

```text
test:public-creator -> 10/10 PASS
test:public-prompt -> 10/10 PASS
frontend Docker production build -> PASS
GET https://api.grassic.ir/api/public/creators/grassias -> 200 sanitized projection
publications=[] with indexable=true/discoverable=true -> zero-publication Creator contract proven
```

Result:

```text
4C.4 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 7. 4C.5 — Public Creator SSR

Accepted canonical routes:

```text
/creator/:username
/fa/creator/:username
```

Accepted behavior:

```text
SSR loads only sanitized Public Creator API
real 404 for unavailable identity
locale-preserving permanent canonical username redirect
localized EN/FA presentation
LTR/RTL
avatar/cover/fallback
skills/links/location
sanitized Markdown Article
zero-publication empty state
no owner/admin controls
```

Founder-local evidence:

```text
pnpm test:public-creator-web -> 14/14 PASS
pnpm locale:check -> fallback EN 0 / Public Creator FA missing 0 / extra 0
backend public Creator -> 10/10 PASS
frontend production build PASS
EN/FA light/dark browser smoke + Markdown + 404 PASS
```

Result:

```text
4C.5 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 8. 4C.6 — Creator SEO + Indexability

Accepted projection:

```text
localized ScreenName -> title / OG / Twitter title
localized Bio -> meta / OG / Twitter description
self canonical
reciprocal en-US/fa-IR hreflang
x-default -> EN/default
cover -> avatar -> PWA social image fallback
creator.policy.indexable -> route noindex decision
NUXT_PUBLIC_NOINDEX staging override wins
ProfilePage JSON-LD + Person mainEntity
safe links -> sameAs
localized controlled skills -> knowsAbout
```

Founder-local evidence:

```text
pnpm test:public-creator-seo -> 5/5 PASS
pnpm test:public-creator-web -> 19/19 PASS
pnpm locale:check -> fallback EN 0 / Public Creator FA missing 0 / extra 0
EN/FA staging source/head canonical/hreflang/OG/Twitter/JSON-LD/noindex smoke PASS
```

Founder explicit acceptance:

```text
4C.6 تاییده.
```

Result:

```text
4C.6 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 9. 4C.7 — Prompt / Discovery Creator Attribution

Detailed record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_7_PROMPT_DISCOVERY_CREATOR_ATTRIBUTION.md
```

Accepted attribution source/policy:

```text
prompt_archive_items.source_user_id remains authoritative provenance
attribution requires active account + approved Creator + canonical username
accessible Creator policy is reused; no active-user-is-Creator heuristic
```

Shared minimal public attribution:

```ts
creator: {
  username: string
  avatarUrl: string | null
} | null
```

Accepted behavior:

```text
Public Prompt gains locale-safe Creator attribution link
Home Discovery migrates owner -> creator vocabulary/policy
Public Discovery migrates owner -> creator vocabulary/policy
ordinary/pending/rejected/suspended/inactive/provenance-less Prompt remains public but unattributed
no UUID/source_user_id/email/private account data in browser attribution
no N+1 Public Creator API calls
```

Founder-local evidence 2026-09-09:

```text
docker compose exec api npm run test:creator-attribution -> 17/17 PASS
docker compose exec api npm run test:public-creator -> 10/10 PASS
pnpm test:creator-attribution-web -> 13/13 PASS
pnpm test:phase4b-final -> PASS
strict locale route audit -> 463 source files / no hazards
pnpm locale:check -> fallback EN 0 / Public Creator FA missing 0 / extra 0
```

Founder explicit acceptance:

```text
4C.7 تایید. خیلی هم عالی
```

Result:

```text
4C.7 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

---

## 10. 4C.8 — Aggregate + Staging Acceptance

Detailed record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_8_AGGREGATE_STAGING_ACCEPTANCE.md
```

Implemented aggregate commands:

```powershell
pnpm test:phase4c-final
pnpm frontend
pnpm smoke:phase4c-final
```

The aggregate regression intentionally does not rebuild services. It executes all accepted Creator/profile backend suites against the current API image plus Public Creator/attribution/Phase-4B/localization frontend regressions.

The final production build refreshes only the frontend service. Full `pnpm stack` is not required.

The staging smoke defaults to:

```text
https://grassic.ir
https://api.grassic.ir
grassias
```

and refuses to target `prompt-draft.ir`.

Final acceptance checklist:

```text
[ ] aggregate 4C backend/frontend tests PASS
[ ] Phase 4B regression PASS
[ ] strict locale-route audit PASS
[ ] production frontend Docker build PASS
[ ] founder-local EN/FA browser sanity remains PASS
[ ] grassic.ir Creator SSR smoke PASS
[ ] api.grassic.ir Creator API smoke PASS
[ ] approved Creator fixture PASS
[ ] zero-publication approved Creator fixture PASS
[ ] generic unavailable Creator -> 404
[ ] negative Creator lifecycle state matrix PASS through accepted backend fixtures
[ ] serialized public API/SSR private-key leakage -> zero observed
[ ] global staging noindex preserved
[ ] prompt-draft.ir untouched
[ ] founder explicit final Phase 4C acceptance
```

Current result:

```text
4C.8 -> IMPLEMENTED / FINAL FOUNDER-LOCAL + STAGING VERIFICATION PENDING
```

---

## 11. Public privacy regression denylist

Every public Creator/Prompt/Discovery DTO and SSR serialization check must protect against at least:

```text
email
birthday
passwordHash / password_hash
role
account status
Creator review status/review note
balance/goin
permissions
sessions
totalXp / xp
owner-only Draft counts
private Draft visibility/payload
sourceDraftId
sourceUserId/internal UUID
storageKey / storage_key
location provider place id
coordinates
admin audit metadata
```

Positive allowlists remain the primary boundary; denylist checks are defense in depth.

---

## 12. Acceptance rule

```text
4C.1 accepted
+ 4C.2 accepted
+ 4C.3 accepted
+ 4C.4 accepted
+ 4C.5 accepted
+ 4C.6 accepted
+ 4C.7 accepted
+ 4C.8 aggregate local/staging gates PASS
+ founder explicit final Phase 4C acceptance
= Phase 21.5.4C DONE / ACCEPTED
```

Until then:

```text
Phase 21.5.4C -> IN PROGRESS
```
