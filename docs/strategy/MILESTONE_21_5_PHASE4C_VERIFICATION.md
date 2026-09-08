# Milestone 21.5 — Phase 4C Verification Ledger

Status: **ARCHITECTURE FOUNDER-ACCEPTED / 4C.1 IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

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
4C.1 Creator Profile Foundation             -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
4C.2 Authenticated Profile Management       -> NOT STARTED
4C.3 Creator Application + Admin Review     -> NOT STARTED
4C.4 Public Creator policy/API              -> NOT STARTED
4C.5 Public Creator SSR route               -> NOT STARTED
4C.6 Creator SEO/indexability               -> NOT STARTED
4C.7 Prompt/Discovery attribution           -> NOT STARTED
4C.8 aggregate/staging acceptance           -> NOT STARTED
Phase 21.5.4C                               -> IN PROGRESS / NOT ACCEPTED
```

Implementation commits:

```text
9efc3c61ead97729ac8a2d25765be16cef38311e  docs: lock revised Phase 4C Creator identity architecture
e9dca683cfb409af448fbaf22d556640dfca1805  feat: add Phase 4C Creator profile foundation
```

---

## 2. Architecture acceptance evidence

Founder explicitly accepted the revised direction on 2026-09-09 and requested implementation to begin.

Locked model:

```text
role=user|admin|super_admin remains RBAC only
Creator is independent explicit public-identity state
profile completion != Creator approval
published Prompt != Creator approval
all authenticated users can save extended profile data
Creator request requires localized Creator profile contract
admin + super_admin review through dedicated Creator permission
```

Earlier proposed inference:

```text
active account + published Prompt => Creator
```

is **SUPERSEDED**.

---

## 3. Locked Creator-required profile contract

Creator application requires:

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

Article is database-stored Markdown, not a mutable filesystem profile file.

Birthday is private in Public Creator V1 and stored as canonical database DATE regardless of Jalali/Gregorian input UI.

Links are max 5.

---

## 4. Creator lifecycle gate

Required current states:

```text
none
pending
approved
rejected
suspended
```

Required invariants:

```text
[ ] completing profile does not auto-request
[ ] saving profile does not auto-request
[ ] publishing Prompt does not auto-request
[ ] request endpoint validates requirements server-side
[ ] rejection can be followed by reapplication
[x] lifecycle state/history storage exists independently from users.role
[x] Creator status does not change users.role schema
[ ] account suspension overrides Creator availability
[ ] self-approval is rejected
```

The unchecked behavioral items belong to 4C.2–4C.4 and are not claimed by the foundation slice.

---

## 5. 4C.1 Creator Profile Foundation gate

Implementation evidence:

```text
[x] numbered migration follows current 026 migration head -> 027_creator_profile_foundation.sql
[x] user_profiles one-to-one extended profile storage
[x] localized screen-name fields
[x] localized bio fields
[x] localized Markdown article fields
[x] canonical birthday DATE
[x] location storage separates display text from provider metadata
[x] controlled localized skill-category taxonomy schema
[x] profile_skills controlled localized taxonomy schema
[x] user_profile_skills relationship
[x] user_profile_links max-5 ordered schema via position 0..4 + UNIQUE(user_id, position)
[x] creator_accounts current-state schema
[x] creator_account_events lifecycle history schema
[x] creator_account_events UPDATE protection enforces append-only history during account lifetime
[x] no creator value/column added to users.role
[x] pure Creator profile normalization/completeness module
[x] unit tests cover ordinary incomplete profile vs Creator-ready profile
[x] unit tests cover EN/FA requirement independently
[x] unit tests cover active-skill requirement
[x] unit tests cover canonical account/username gate
[x] technical field limits are not treated as SEO quality scoring
[x] backend test command documented
[x] taxonomy intentionally not seeded before founder content checkpoint
```

Foundation files:

```text
backend/sql/027_creator_profile_foundation.sql
backend/src/creatorProfileRequirements.mjs
backend/src/creatorProfileRequirements.test.mjs
backend/package.json
```

Technical storage ceilings are deliberately generous and are abuse/data-safety limits, not SEO thresholds:

```text
screenName: 160 chars per locale
bio: 2000 chars per locale
article: 100000 chars per locale
location display: 255 chars
profile link URL: 2048 chars
profile link label: 160 chars
```

The readiness tests deliberately prove that very short but non-empty required content is technically eligible; content-quality scoring remains out of scope.

### Founder-local verification commands

From repository root after pulling `feature/growth-foundation`:

```powershell
git pull
docker compose up -d --build api
docker compose exec api npm run db:schema
docker compose exec api npm run test:creator-profile-foundation
docker compose exec api npm run test:public-prompt
```

Manual schema inspection:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ user_profiles"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ profile_skill_categories"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ profile_skills"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ user_profile_skills"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ user_profile_links"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ creator_accounts"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ creator_account_events"
```

Optional table-presence summary:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('user_profiles','profile_skill_categories','profile_skills','user_profile_skills','user_profile_links','creator_accounts','creator_account_events') ORDER BY tablename;"
```

Expected:

```text
7 rows
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

Do not start 4C.2 as accepted work until the founder reports these gates and explicitly accepts 4C.1.

---

## 6. 4C.2 Authenticated Profile Management gate

Required evidence:

```text
[ ] /manage/profile authenticated route
[ ] avatar menu contains Edit profile
[ ] owner profile API reads only owner-editable data
[ ] Save changes independent from Creator request
[ ] existing avatar/cover update path integrated
[ ] screenName EN/FA editable
[ ] bio EN/FA editable
[ ] article EN/FA Markdown editable/previewable
[ ] birthday Jalali picker in FA UI
[ ] birthday Gregorian picker outside FA UI
[ ] both produce canonical DATE
[ ] skills multi-select uses taxonomy IDs/slugs
[ ] links enforce max 5
[ ] location supports suggestions + custom text
[ ] email remains private
[ ] username/email editing uses dedicated update semantics, not silent weakening of profile-complete endpoint
[ ] approved Creator cannot silently clear Creator-required fields
[ ] Creator username-change SEO alias strategy verified before enabling approved-Creator rename
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 7. 4C.3 Creator Application + Admin Review gate

Required evidence:

```text
[ ] Request Creator Account button reflects server requirements
[ ] request endpoint is authenticated
[ ] incomplete profile request rejected with useful field-level errors
[ ] complete profile -> pending
[ ] repeated pending request is idempotent/conflict-safe
[ ] rejected account may reapply
[ ] creators.manage permission exists
[ ] admin receives creators.manage without receiving unrelated users.manage
[ ] super_admin retains creators.manage through wildcard
[ ] manage/users row exposes safe Creator status badge
[ ] pending Creator filter/review workflow
[ ] admin detail shows fields necessary for Creator review
[ ] approve action
[ ] reject action + optional review note
[ ] suspend/unsuspend Creator action
[ ] no self-approval
[ ] lifecycle event history written
[ ] admin audit convention preserved for admin actions
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 8. 4C.4 Public Creator policy/API gate

Required evidence:

```text
[ ] GET /api/public/creators/:username
[ ] username-keyed; no browser UUID resolution
[ ] approved + active -> public candidate
[ ] none/pending/rejected/suspended -> generic 404
[ ] suspended account -> generic 404
[ ] public DTO allowlist only
[ ] screenName EN/FA public
[ ] bio EN/FA public
[ ] article EN/FA public
[ ] approved skills public
[ ] approved links public
[ ] location display text only
[ ] birthday absent
[ ] email absent
[ ] role absent
[ ] review status/note absent
[ ] internal UUID absent
[ ] storage/provider metadata absent
[ ] canonical published Archive publication summaries only
[ ] zero-publication Creator still valid
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 9. 4C.5 Public Creator SSR gate

Required evidence:

```text
[ ] /creator/:username SSR
[ ] /fa/creator/:username SSR
[ ] unavailable -> real 404
[ ] lowercase canonical redirect
[ ] old approved-Creator username alias -> permanent current-canonical redirect when rename support exists
[ ] no UUID canonical identity
[ ] sanitized Markdown rendering
[ ] EN/FA LTR/RTL presentation
[ ] /user remains account/product route
[ ] no owner/admin controls on public Creator page
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 10. 4C.6 SEO/indexability gate

Required evidence:

```text
[ ] localized screenName drives title/name projection
[ ] localized bio drives visible + meta/OG/Twitter description source
[ ] localized article produces authoritative unique long-form content
[ ] EN self canonical
[ ] FA self canonical
[ ] reciprocal hreflang
[ ] x-default -> EN/default
[ ] indexability is server-authoritative
[ ] approved Creator does not require published Prompt to index
[ ] defensive incomplete-approved profile may noindex
[ ] ProfilePage JSON-LD
[ ] Person mainEntity safe fields only
[ ] staging NUXT_PUBLIC_NOINDEX still wins
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 11. 4C.7 Prompt/Discovery attribution gate

Blocked until Public Creator contract + SEO slices are founder-accepted.

Required evidence:

```text
[ ] Public Prompt attribution only for approved accessible Creator
[ ] source_user_id remains provenance source
[ ] source user with published Prompt but no Creator remains unattributed
[ ] provenance-less/legacy Prompt remains valid
[ ] no UUID in browser creator attribution
[ ] locale-safe Creator links
[ ] Discovery uses same Creator eligibility contract
[ ] no duplicate active-user-is-public-creator heuristic remains
[ ] 4B protected-field regression stays green
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 12. 4C.8 aggregate/final gate

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
[ ] X-Robots-Tag/global staging noindex preserved
[ ] smoke tooling refuses prompt-draft.ir
[ ] prompt-draft.ir untouched
[ ] founder explicit Phase 4C acceptance
```

Final status: **PENDING**

---

## 13. Public privacy regression denylist

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

## 14. Acceptance rule

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
