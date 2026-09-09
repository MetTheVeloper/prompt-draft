# Milestone 21.5 — Phase 4C Verification Ledger

Status: **ARCHITECTURE FOUNDER-ACCEPTED / 4C.1 ACCEPTED / 4C.2 IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

No implementation slice is DONE merely because code exists. Every slice requires founder-local verification and explicit acceptance.

---

## 1. Current checkpoint

```text
4C repository audit                         -> COMPLETE
4C revised Creator/profile architecture     -> FOUNDER ACCEPTED 2026-09-09
4C.1 Creator Profile Foundation             -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
4C.2 Authenticated Profile Management       -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
4C.3 Creator Application + Admin Review     -> NOT STARTED
4C.4 Public Creator policy/API              -> NOT STARTED
4C.5 Public Creator SSR route               -> NOT STARTED
4C.6 Creator SEO/indexability               -> NOT STARTED
4C.7 Prompt/Discovery attribution           -> NOT STARTED
4C.8 aggregate/staging acceptance           -> NOT STARTED
Phase 21.5.4C                               -> IN PROGRESS / NOT ACCEPTED
```

Implementation commits currently include:

```text
9efc3c61ead97729ac8a2d25765be16cef38311e  docs: lock revised Phase 4C Creator identity architecture
e9dca683cfb409af448fbaf22d556640dfca1805  feat: add Phase 4C Creator profile foundation
6369b946b0721d81102ca600b469d3889807fe18  docs: record Phase 4C.1 founder-local verification
30d52c277d0cae416cc35f354dbc33c2d807fcd1  feat: add authenticated profile management API
fbeb1b7b5c063884551dea3cf866ea9996f191a8  feat: add authenticated profile editor
9f6ce9a7869bd000cf166fa643994a57aa785a4c  feat: add Edit profile entry to account menu
2ea2e8536b174c47ba8511edb78faa4c84c61668  fix: localize Jalali birthday month labels
206530c394233d2b2ec670391727527138710af6  feat: seed Creator profile skill taxonomy
521be66c7ff3c983276730589236f763e8fb3244  test: lock Creator skill taxonomy inventory
5bd7d8101de7129ecbf61b8b0b30def58048d031  test: expose Creator taxonomy verification
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

Earlier proposed inference:

```text
active account + published Prompt => Creator
```

is **SUPERSEDED**.

Creator application readiness requires:

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

## 3. 4C.1 — Creator Profile Foundation acceptance

Implementation evidence:

```text
[x] numbered migration follows 026 -> 027_creator_profile_foundation.sql
[x] user_profiles one-to-one extended profile storage
[x] localized screen-name fields
[x] localized bio fields
[x] localized Markdown article fields
[x] canonical birthday DATE
[x] location display/provider metadata separation
[x] controlled localized skill category + skill schema
[x] user_profile_skills relationship
[x] user_profile_links max-5 ordered schema
[x] creator_accounts current-state schema
[x] creator_account_events lifecycle history schema
[x] event UPDATE protection
[x] Creator remains independent from users.role
[x] pure Creator readiness/normalization module
[x] no SEO-style minimum-length score
[x] taxonomy deliberately unseeded pending founder content decision
```

Founder-local evidence reported 2026-09-09:

```text
docker compose exec api npm run db:schema
-> migrations 001 through 027 applied successfully

docker compose exec api npm run test:creator-profile-foundation
-> 7 tests / 7 pass / 0 fail

docker compose exec api npm run test:public-prompt
-> 10 tests / 10 pass / 0 fail

PostgreSQL table-presence query
-> 7 expected Creator/profile foundation tables present
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

## 4. 4C.2 — Authenticated Profile Management implementation

### 4.1 Backend contract

Owner-only endpoints:

```text
GET /api/profile
PUT /api/profile
```

Implementation:

```text
backend/src/profileManagement.mjs
backend/src/profileManagement.test.mjs
```

Rules:

```text
[x] authentication required
[x] GET returns owner editing projection only
[x] PUT validates and updates inside a database transaction
[x] existing /api/auth/profile/complete semantics are not weakened
[x] ordinary user may save an incomplete extended profile
[x] Save changes never auto-submits Creator request
[x] username canonicalization follows current account contract
[x] email stays private and uniqueness-checked
[x] at least username or email must remain on the account
[x] birthday accepts canonical YYYY-MM-DD only
[x] skill selections must resolve to active taxonomy entries
[x] profile links support max 5 and http/https URLs only
[x] location supports custom display text now and internal suggestion metadata later
[x] approved/suspended Creator username rename is blocked until alias redirects exist
[x] approved/suspended Creator cannot silently drop Creator-required fields
[x] avatar/cover endpoints remain independent and reusable
```

### 4.2 Frontend contract

Route:

```text
/manage/profile
/fa/manage/profile
```

Implementation evidence:

```text
[x] generic authenticated middleware
[x] ordinary authenticated user can enter /manage/profile
[x] /manage root no longer treats Profile as an admin-only concern
[x] administrative Manage sections remain permission-gated
[x] Profile section is visible to every authenticated account
[x] avatar profile menu contains Edit profile
[x] locale-safe navigation to /manage/profile
[x] existing avatar upload/remove flow integrated
[x] existing cover upload/remove flow integrated
[x] username input
[x] private email input
[x] Screen Name EN/FA inputs
[x] Bio EN/FA inputs
[x] Article EN/FA Markdown source inputs
[x] birthday input
[x] FA UI uses Jalali year/month/day picker
[x] non-FA UI uses Gregorian date input
[x] both serialize canonical YYYY-MM-DD
[x] skills multi-select wired to controlled taxonomy API
[x] links editor with max 5
[x] custom location text editing
[x] Creator current status + readiness shown
[x] Request Creator action intentionally absent until 4C.3
[x] Jalali month labels are localized through i18n, not hardcoded in the component
```

### 4.3 Skills taxonomy V1 — founder-directed implementation

Founder direction 2026-09-09:

```text
Build the compact V1 taxonomy as proposed: roughly 6-8 categories / 30-40 skills.
```

Implemented as:

```text
backend/sql/028_seed_profile_skill_taxonomy.sql
backend/src/profileSkillTaxonomy.test.mjs
npm run test:profile-skill-taxonomy
```

V1 contract:

```text
8 categories
40 skills
5 skills per category
localized EN + FA titles
controlled canonical slugs
stable sort order
idempotent upsert
migration reruns preserve operational active=false state
```

Categories:

```text
AI & Prompting
Product & Design
Software Development
Visual Creation
Content & Language
Data & Automation
Media Production
Business & Growth
```

The taxonomy is deliberately broad rather than language/framework-specific. Future expansion should be additive and versioned; free-text skills remain out of scope for canonical Creator identity.

### 4.4 Location suggestion decision

Founder direction 2026-09-09 permits leaving Location as custom text if there is no immediate production-safe free suggestion service worth coupling into this slice.

Research checkpoint:

```text
Public Nominatim
  -> unsuitable: public-service policy explicitly forbids client-side autocomplete

Photon public demo
  -> supports search-as-you-type but has no availability guarantee / hard usage contract
  -> not appropriate as a production dependency

Geoapify
  -> credible free autocomplete tier exists, but requires an external API key/account

LocationIQ
  -> credible free tier exists, but requires token + attribution/usage terms
```

Decision for 4C.2:

```text
[x] retain provider-independent DB contract
[x] retain working custom location text UI
[x] do not add a third-party provider/key requirement to 4C.2
[x] provider-backed suggestion may be added later without schema redesign
```

This is now an intentional defer, not an unresolved 4C.2 blocker.

### 4.5 Article preview decision

```text
[x] Markdown source editing is the 4C.2 requirement
[x] rendered/sanitized public Markdown belongs to Public Creator SSR (4C.5)
[x] editor preview may be added later but is not a 4C.2 acceptance blocker
```

---

## 5. 4C.2 founder-local verification gate

### 5.1 Automated evidence already reported 2026-09-09

```text
docker compose up -d --build api frontend
-> API image built
-> frontend Nuxt production build completed successfully inside Docker

docker compose exec api npm run db:schema
-> migrations 001 through 027 applied successfully

docker compose exec api npm run test:creator-profile-foundation
-> 7 tests / 7 pass / 0 fail

docker compose exec api npm run test:profile-management
-> 8 tests / 8 pass / 0 fail

docker compose exec api npm run test:public-prompt
-> 10 tests / 10 pass / 0 fail

pnpm locale:check
-> localization audit ran
-> hardcoded candidates: 0
-> strict command exited 1 because repository-wide EN/FA missing/extra-key backlog remains
```

The Docker frontend build is therefore already green. The strict locale mismatch requires differential/baseline treatment before final 4C.2 acceptance; it is not a Nuxt build failure.

### 5.2 Founder browser evidence already reported 2026-09-09

```text
[x] Profile page is functionally working
[x] multiple profile datasets save successfully
[x] saved profile data persists after leaving/reopening the page
[x] duplicate username is rejected
[x] founder populated the current Grass profile with EN/FA profile content for future UI fixtures
```

Remaining detailed manual checks are kept below until explicitly covered/accepted.

### 5.3 Taxonomy verification after pulling migration 028

Run:

```powershell
git pull

docker compose exec api npm run db:schema

docker compose exec api npm run test:profile-skill-taxonomy

docker compose exec api npm run test:profile-management

docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT COUNT(*) AS categories FROM profile_skill_categories WHERE active = TRUE; SELECT COUNT(*) AS skills FROM profile_skills WHERE active = TRUE;"

docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT category_slug, COUNT(*) AS skills FROM profile_skills WHERE active = TRUE GROUP BY category_slug ORDER BY category_slug;"
```

Expected:

```text
migration 028 applies successfully
taxonomy tests PASS
profile-management regression PASS
active categories = 8
active skills = 40
each V1 category = 5 active skills
```

Then browser-smoke the real Grass profile:

```text
[ ] Skills selector now contains localized taxonomy items
[ ] EN locale shows English category/skill labels
[ ] FA locale shows Persian category/skill labels
[ ] select one or more skills and Save
[ ] selected skills persist after reload
[ ] assuming all other required Creator fields are complete, Creator readiness becomes ready=true
```

### 5.4 Remaining manual browser checklist

```text
[ ] ordinary user avatar menu shows Edit profile
[ ] ordinary user can open /manage/profile without 403
[ ] /fa/manage/profile works locale-safely
[ ] ordinary user sees Profile but no unauthorized admin sections
[ ] admin/super_admin still see their permitted admin sections
[ ] /manage root keeps useful admin landing for admins and Profile fallback for ordinary users
[x] incomplete regular-user profile can save
[ ] saving does not create Creator request/state
[x] username/email/profile changes save and persist
[x] Screen Name EN/FA save + reload (covered by populated Grass profile smoke)
[x] Bio EN/FA save + reload (covered by populated Grass profile smoke)
[x] Article EN/FA save + reload (covered by populated Grass profile smoke)
[x] custom location save + reload (covered by populated Grass profile smoke)
[ ] links save + reload and sixth link is not allowed
[ ] EN birthday picker saves/reloads canonical date
[ ] FA Jalali picker saves/reloads the same canonical date correctly
[ ] avatar update/remove still works
[ ] cover update/remove still works
[x] Request Creator button is absent as expected before 4C.3
[ ] Skills taxonomy selection save + reload after migration 028
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 6. 4C.3 — Creator Application + Admin Review gate

Required evidence:

```text
[ ] Request Creator Account button reflects server requirements
[ ] request endpoint is authenticated and server-authoritative
[ ] incomplete profile request rejected with field-level errors
[ ] complete profile -> pending
[ ] repeated pending request is conflict-safe/idempotent
[ ] rejected account may reapply
[ ] creators.manage permission exists
[ ] admin receives creators.manage without unrelated users.manage
[ ] super_admin retains creators.manage through wildcard
[ ] manage/users Creator status badge + pending filter/review workflow
[ ] approve / reject + optional note
[ ] suspend / unsuspend Creator
[ ] no self-approval
[ ] lifecycle events + admin audit conventions preserved
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 7. 4C.4 — Public Creator policy/API gate

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

## 8. 4C.5 — Public Creator SSR gate

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

## 9. 4C.6 — SEO/indexability gate

```text
[ ] localized screenName drives name/title
[ ] localized bio drives visible/meta/OG/Twitter description
[ ] localized article provides authoritative unique content
[ ] EN self canonical / FA self canonical
[ ] reciprocal hreflang / x-default -> EN
[ ] server-authoritative indexability
[ ] no published-Prompt requirement
[ ] defensive incomplete-approved Creator may noindex
[ ] ProfilePage + Person structured data safe fields only
[ ] staging NUXT_PUBLIC_NOINDEX always wins
```

---

## 10. 4C.7 — Prompt/Discovery attribution gate

Blocked until Public Creator contract + SEO slices are accepted.

```text
[ ] Public Prompt attribution only for approved accessible Creator
[ ] source_user_id remains provenance source
[ ] published Prompt owner without Creator remains unattributed
[ ] legacy/provenance-less Prompt remains valid
[ ] no UUID in browser attribution
[ ] locale-safe Creator links
[ ] Discovery consumes the same Creator eligibility policy
[ ] no active-user-is-public-creator heuristic survives
[ ] 4B protected-field regression stays green
```

---

## 11. 4C.8 — Aggregate/final gate

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

## 12. Public privacy regression denylist

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

## 13. Acceptance rule

```text
architecture founder-accepted
+ 4C.1 founder-local verified/accepted
+ 4C.2 founder-local verified/accepted
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
