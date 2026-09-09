# Milestone 21.5 — Phase 4C Verification Ledger

Status: **ARCHITECTURE FOUNDER-ACCEPTED / 4C.1 ACCEPTED / 4C.2 ACCEPTED / 4C.3 IMPLEMENTED / FOUNDER-LOCAL UI + INTEGRATION VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

4C.3 implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_3_CREATOR_APPLICATION_ADMIN_REVIEW.md
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
4C.3 Creator Application + Admin Review     -> IMPLEMENTED / FOUNDER-LOCAL UI + INTEGRATION VERIFICATION PENDING
4C.4 Public Creator policy/API              -> NOT STARTED
4C.5 Public Creator SSR route               -> NOT STARTED
4C.6 Creator SEO/indexability               -> NOT STARTED
4C.7 Prompt/Discovery attribution           -> NOT STARTED
4C.8 aggregate/staging acceptance           -> NOT STARTED
Phase 21.5.4C                               -> IN PROGRESS / NOT ACCEPTED
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

Founder-local evidence 2026-09-09:

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

### Backend accepted contract

```text
GET /api/profile
PUT /api/profile
```

Verified behavior includes:

```text
owner authentication required
ordinary account may save incomplete extended profile
Save changes never creates Creator state
existing /api/auth/profile/complete fill-only semantics preserved
username/email identity validation + uniqueness
approved/suspended Creator username rename blocked until alias support
approved/suspended Creator cannot silently remove required Creator profile fields
canonical birthday DATE
controlled taxonomy skills
max-5 http/https links
custom location text with provider-independent storage contract
existing avatar/cover flows retained
```

### Frontend accepted contract

```text
/manage/profile
/fa/manage/profile
Edit profile in avatar menu
```

Verified fields/UI:

```text
avatar + cover
username + private email
ScreenName EN/FA
Bio EN/FA
Article EN/FA Markdown source
Birthday
Skills
Links
Location
Creator readiness/status
```

### Skills taxonomy V1

Migration:

```text
028_seed_profile_skill_taxonomy.sql
```

Founder-local evidence:

```text
test:profile-skill-taxonomy -> 4/4 PASS
active categories -> 8
active skills -> 40
```

Founder browser evidence confirms:

```text
EN/FA grouped skill selector works using el-multi-select group headers
selected skills display/save correctly
```

### Birthday UX final state

Founder browser evidence confirms:

```text
EN -> Gregorian year/month/day dropdowns
FA -> Jalali year/month/day dropdowns
both use the same one-row interaction model
both project to one canonical stored date
Birthday + Location card headings align to flex-start like Skills/Links
```

### Other accepted product decisions

```text
Location suggestion provider remains intentionally deferred; custom text is valid V1
Markdown source editing is the 4C.2 requirement; sanitized rendering belongs to 4C.5
```

### 4C.2 founder-local evidence

Previously reported automated evidence:

```text
frontend Docker production build PASS
profile-management tests -> 8/8 PASS
Creator foundation tests -> 7/7 PASS
Public Prompt regression -> 10/10 PASS
hardcoded localization candidates -> 0
```

Founder browser evidence accumulated through 2026-09-09:

```text
profile loads and persists saved data
incomplete regular profile may save
duplicate username rejected
EN/FA ScreenName/Bio/Article persist
custom location persists
skill taxonomy loads, groups and persists
EN Gregorian birthday UX verified
FA Jalali birthday UX verified
final card/header alignment verified
```

Founder explicit acceptance on 2026-09-09:

```text
عالی الان همه چی درسته بزن بریم بعدی
```

Result:

```text
4C.2 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 5. 4C.3 — Creator Application + Admin Review

Detailed implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_3_CREATOR_APPLICATION_ADMIN_REVIEW.md
```

### Backend implemented

Owner request:

```text
POST /api/creator-account/request
```

Admin review:

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
none      -> pending / requested
rejected  -> pending / reapplied
pending   -> idempotent pending
pending   -> approved | rejected by reviewer
approved  -> suspended
suspended -> approved
```

Safety:

```text
request readiness recalculated from saved DB state
approval readiness recalculated again inside transaction
self-review backend-blocked
real transitions append creator_account_events
admin transitions append admin_audit_log
optional review note bounded to 2000 chars
```

Admin index supports:

```text
status filter
username/email search
opaque cursor pagination
```

### Frontend implemented

Owner Profile surface:

```text
Request Creator Account
incomplete/ready state
pending state
rejected + reapply state
approved state
suspended state
saved-profile-only request semantics
```

`/manage/users`:

```text
Creator Applications panel
Pending default filter
All/Pending/Approved/Rejected/Suspended filters
username/email search
Creator status badges
review modal
EN/FA profile review
skills/links/location review
optional review note
lifecycle event history
approve/reject/suspend/restore actions
self-review UI guard
```

### Founder-local backend evidence already reported

Founder ran the original 4C.3 lifecycle suite after the API rebuild:

```text
npm run test:creator-account
-> 11 tests
-> 11 pass
-> 0 fail
-> duration_ms 232.536064
```

Those 11 tests verify:

```text
request/reapply/pending idempotency
state-safe admin transitions
creators.manage separation from users.manage
review note validation
complete request
incomplete request rejection
approval readiness recheck
lifecycle + audit writes
self-review block
approval failure after profile becomes incomplete
```

After that run, `creatorAdminIndex.test.mjs` was added to the same test command. Therefore the final focused backend rerun remains pending.

### Focused 4C.3 verification required next

Per `DEVELOPMENT_WORKFLOW.md`, do not rebuild the full stack.

```powershell
git pull
pnpm api
docker compose exec api npm run test:creator-account
pnpm frontend
```

No schema migration is required for this checkpoint.

Manual owner smoke:

```text
[ ] complete saved regular profile shows Request Creator Account
[ ] request -> pending
[ ] pending does not expose duplicate request action
[ ] incomplete saved profile cannot request
[ ] rejected profile may reapply after saving corrections
```

Manual admin smoke:

```text
[ ] admin + super_admin see Creator Applications panel
[ ] ordinary account has no Creator review tools
[ ] panel defaults to Pending
[ ] status filter works
[ ] username/email search works
[ ] review modal loads EN/FA content, skills, links/location and history
[ ] approve works for currently-ready pending profile
[ ] reject + optional note works
[ ] approved Creator can be suspended
[ ] suspended Creator can be restored
[ ] self-review blocked
[ ] admin can perform Creator review while still lacking users.manage
```

Founder-local verification: **PARTIAL — backend foundation 11/11 PASS; new index/UI integration pending**

Acceptance: **PENDING**

---

## 6. 4C.4 — Public Creator policy/API gate

```text
[ ] GET /api/public/creators/:username
[ ] username-keyed; no browser UUID resolution
[ ] approved + active -> public candidate
[ ] none/pending/rejected/suspended -> generic 404
[ ] public DTO positive allowlist only
[ ] localized screenName/bio/article public
[ ] approved skills/links public
[ ] display-safe location text only
[ ] birthday/email/role/review metadata/internal UUID absent
[ ] canonical published Archive publication summaries only
[ ] zero-publication approved Creator remains valid
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 7. 4C.5 — Public Creator SSR gate

```text
[ ] /creator/:username SSR
[ ] /fa/creator/:username SSR
[ ] unavailable -> real 404
[ ] lowercase canonical redirect
[ ] approved-Creator username alias redirect strategy before rename support
[ ] sanitized Markdown rendering
[ ] EN/FA LTR/RTL presentation
[ ] /user remains account/product route
[ ] no owner/admin controls on public Creator page
```

---

## 8. 4C.6 — Creator SEO/indexability gate

```text
[ ] localized ScreenName drives title/name
[ ] localized Bio drives visible/meta/OG/Twitter description
[ ] localized Article provides unique authoritative content
[ ] EN self canonical / FA self canonical
[ ] reciprocal hreflang / x-default -> EN
[ ] server-authoritative indexability
[ ] no published-Prompt requirement
[ ] defensive incomplete-approved Creator may noindex
[ ] ProfilePage + Person JSON-LD uses safe fields only
[ ] staging NUXT_PUBLIC_NOINDEX always wins
```

---

## 9. 4C.7 — Prompt/Discovery attribution gate

Blocked until Public Creator contract + SEO slices are accepted.

```text
[ ] Public Prompt attribution only for approved accessible Creator
[ ] source_user_id remains provenance source
[ ] published Prompt owner without Creator remains unattributed
[ ] legacy/provenance-less Prompt remains valid
[ ] no UUID in browser attribution
[ ] locale-safe Creator links
[ ] Discovery consumes same Creator policy
[ ] no active-user-is-public-creator heuristic survives
[ ] 4B protected-field regression stays green
```

---

## 10. 4C.8 — Aggregate/staging acceptance

```text
[ ] aggregate 4C backend/frontend tests PASS
[ ] Phase 4B regression PASS
[ ] strict locale-route audit PASS
[ ] production build PASS
[ ] founder-local EN/FA browser smoke PASS
[ ] grassic.ir Creator SSR smoke PASS
[ ] api.grassic.ir Creator API smoke PASS
[ ] pending/rejected/suspended public 404 fixtures PASS
[ ] approved Creator fixture PASS
[ ] zero-publication approved Creator fixture PASS
[ ] serialized SSR private-key leakage -> zero
[ ] global staging noindex preserved
[ ] prompt-draft.ir untouched
[ ] founder explicit Phase 4C acceptance
```

---

## 11. Public privacy regression denylist

Every public Creator/Prompt/Discovery DTO and SSR serialization check must scan for at least:

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

Positive allowlists remain the primary boundary; denylist tests are defense in depth.

---

## 12. Acceptance rule

```text
4C.1 accepted
+ 4C.2 accepted
+ 4C.3 founder-local verified/accepted
+ 4C.4 founder-local verified/accepted
+ 4C.5 founder-local verified/accepted
+ 4C.6 founder-local verified/accepted
+ 4C.7 founder-local verified/accepted
+ 4C.8 aggregate local/staging gates PASS
+ founder explicit final acceptance
= Phase 21.5.4C DONE / ACCEPTED
```

Until then:

```text
Phase 21.5.4C -> IN PROGRESS
```
