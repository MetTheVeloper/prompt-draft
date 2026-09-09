# Milestone 21.5 — Phase 4C Verification Ledger

Status: **ARCHITECTURE FOUNDER-ACCEPTED / 4C.1 ACCEPTED / 4C.2 ACCEPTED / 4C.3 ACCEPTED / 4C.4 ACCEPTED / 4C.5 ACCEPTED / 4C.6 ACCEPTED / 4C.7 NEXT**

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
4C.7 Prompt/Discovery attribution           -> NEXT
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

Public Creator accessibility:

```text
account exists + active
AND Creator status == approved
AND canonical username
```

Public Creator indexability:

```text
accessible && creatorProfileComplete
```

Discoverability V1:

```text
indexable
```

Published Prompt count is never a Creator eligibility requirement.

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

### Accepted backend contract

```text
GET /api/profile
PUT /api/profile
```

Verified behavior:

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

### Accepted frontend contract

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
```

Founder browser evidence:

```text
profile load/save persists
incomplete regular profile may save
duplicate username rejected
localized ScreenName/Bio/Article persists
custom location persists
controlled grouped skills persist
Gregorian/Jalali birthday UX verified
avatar + cover flows verified
```

Accepted V1 deferrals:

```text
location suggestion provider -> later; custom location text valid V1
sanitized Markdown rendering -> 4C.5
```

Post-acceptance profile polish on 2026-09-09:

```text
profile menu redesigned around auto-upload media
Creator label/display-name behavior updated
referral/Goin controls compacted
email editor visibility reinforced beside username using project el-grid
email remains private and uses existing PUT /api/profile identity contract
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

### Accepted backend contract

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

### Accepted frontend contract

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
Creator status colors without status markers in the list column
review modal
EN/FA profile review
skills/links/location review
optional review note
lifecycle event history
approve/reject/suspend/restore actions
self-review UI guard
article preview uses var(--normalText)
```

### Final founder-local automated evidence 2026-09-09

```text
test:generated-username -> 3/3 PASS
test:creator-account -> 15/15 PASS
test:profile-management -> 8/8 PASS
frontend Docker production build -> PASS
```

The final Creator account suite includes:

```text
creatorAccount.test.mjs
creatorAdminIndex.test.mjs
```

and verifies:

```text
request/reapply/pending idempotency
state-safe admin transitions
creators.manage separation from users.manage
review-note normalization + limits
complete/incomplete request behavior
approval readiness recheck
lifecycle + audit writes
self-review backend block
approval failure after profile becomes incomplete
admin list status/search/limit contract
review-safe account metadata + pagination
event history ordering/admin-only projection
```

### Final founder browser evidence 2026-09-09

Founder manually exercised and reported all Creator states and review flows working, including:

```text
request -> pending
Creator Applications pending list
review modal localized content
self-review blocked
second-account review
approve Creator
approved filter/state
Creator profile menu label behavior
```

Founder statement after final smoke:

```text
همه چی درسته هیچ خطایی نداریم
```

Result:

```text
4C.3 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 6. 4C.4 — Public Creator Policy + Sanitized Backend Projection

Detailed implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_4_PUBLIC_CREATOR_POLICY_API.md
```

### Accepted policy

```text
accessible = account exists + active + Creator approved + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
hasPublishedPrompt = signal only; never a gate
```

Internal policy reasons/signals remain server-only.

### Accepted API

```text
GET /api/public/creators/:username
```

Behavior:

```text
approved/active/canonical -> 200
none/pending/rejected/Creator-suspended/account-inactive -> generic 404
invalid/noncanonical username -> generic 404
non-GET -> 405 Allow GET
username-keyed; browser never resolves UUID first
```

### Accepted public DTO

```text
identity.username
identity.screenName EN/FA
identity.bio EN/FA
identity.article EN/FA Markdown source
identity.avatarUrl
identity.cover safe URLs/dimensions
identity.skills active localized taxonomy only
identity.links supported HTTP/HTTPS links only
identity.location.text only
canonical published Archive publication summaries
safe policy.indexable/discoverable outcomes
```

Explicitly absent:

```text
internal UUID
email
birthday
role
account status
Creator lifecycle status/reviewer/review note
XP
Goin/balance
permissions
sessions
referrals
private Drafts
owner-only stats
storage keys
location provider metadata
admin audit data
raw Prompt bodies
variants
source Draft/User identifiers
```

Publication source:

```text
prompt_archive_items.source_user_id = internal Creator user id
status = published
public_id IS NOT NULL
```

Internal UUID is used for the join only and never serialized.

### Founder-local evidence 2026-09-09

```text
test:public-creator -> 10/10 PASS
test:public-prompt  -> 10/10 PASS
frontend Docker production build -> PASS
```

Focused 4C.4 coverage proves:

```text
public policy state matrix
zero-publication Creator policy
approved-incomplete accessible/noindex distinction
canonical publication summary mapping
positive DTO allowlist
private sentinel leakage scan
forbidden SQL-column scan
published-only Archive source contract
none/pending/rejected/suspended generic 404 behavior
noncanonical username no-query behavior
GET/405/unrelated handler behavior
```

Founder staging API smoke:

```text
GET https://api.grassic.ir/api/public/creators/grassias
-> 200 / ok=true
-> localized ScreenName/Bio/Article
-> active skills
-> safe website link
-> location.text only
-> publications=[]
-> policy.indexable=true
-> policy.discoverable=true
-> no observed private denylist fields
```

This also proves an approved zero-publication Creator remains a valid public Creator.

Founder explicit acceptance:

```text
4C.4 رو ببند بریم سراغ 4C.5
```

Result:

```text
4C.4 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 7. 4C.5 — Public Creator SSR

Detailed implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_5_PUBLIC_CREATOR_SSR.md
```

### Accepted canonical routes

```text
/creator/:username
/fa/creator/:username
```

Nuxt route:

```text
app/pages/creator/[username].vue
```

### Accepted SSR/browser contract

```text
app/composables/usePublicCreator.ts
```

Behavior:

```text
SSR fetches only GET /api/public/creators/:username
server uses apiBaseInternal
browser uses public apiBase
positive DTO normalization only
API 404 -> real Nuxt 404
unexpected API failure -> 502
mixed-case/noncanonical username -> locale-preserving 301 canonical redirect
```

Approved/suspended Creator username editing remains locked, so no historical alias can currently be created accidentally. `creator_username_aliases` + permanent old-name redirects remain a precondition before that lock may ever be relaxed.

### Accepted public presentation

```text
localized ScreenName/Bio/Article
avatar + cover/fallback
@username
location.text only
localized active skills
safe public links
responsive publication summaries
zero-publication empty state
EN LTR / FA RTL
no owner/admin Creator controls
```

Publication cards are shown only when the publication advertises the active locale and link only to canonical localized Public Prompt routes.

### Accepted sanitized Markdown

```text
app/utils/publicCreatorMarkdown.ts
```

Contract:

```text
raw HTML escaped
javascript: rejected
data: rejected
HTTP/HTTPS + safe root-relative link/image URLs only
external links -> rel="ugc noopener noreferrer"
supported headings/paragraphs/emphasis/code/lists/quotes/hr/links/images
article source never bound directly to v-html
```

### Localization

```text
i18n/locales/public-creator.en.ts
i18n/locales/public-creator.fa.ts
```

registered through:

```text
i18n/i18n.config.ts
```

### Founder-local automated evidence 2026-09-09

```text
pnpm test:public-creator-web -> 14/14 PASS
pnpm locale:check -> Missing fallback EN 0 / Public Creator FA missing 0 / extra 0
docker compose exec api npm run test:public-creator -> 10/10 PASS
frontend Docker production build -> PASS
```

The runtime localization gate was repaired during verification to validate the actual merged Nuxt i18n messages rather than the obsolete source-fragment shape. Real pre-existing EN fallback gaps reported by that runtime check were filled rather than suppressing the gate.

### Founder staging/browser evidence 2026-09-09

Founder manually verified:

```text
/creator/grassias renders the EN Creator page
/fa/creator/grassias renders the FA Creator page
EN LTR and FA RTL presentation
light + dark theme presentation
localized ScreenName/Bio/Article/skills
sanitized Markdown headings/bold/link/image rendering
zero-publication Creator page remains valid
public website + location display
mixed-case canonical redirect behavior
unavailable username -> real 404
no Edit profile / Request Creator / admin-review controls on the public page
```

Founder supplied browser screenshots for EN/FA and 404 states and explicitly reported all smoke checks correct.

Founder explicit acceptance:

```text
همه چی درسته 4C.5 تاییده.
```

Result:

```text
4C.5 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

---

## 8. 4C.6 — Creator SEO/indexability gate

Detailed implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_6_CREATOR_SEO_INDEXABILITY.md
```

Accepted projection:

```text
localized ScreenName -> title / OG / Twitter title
localized Bio        -> meta / OG / Twitter description
localized Article    -> existing long-form authoritative body
self canonical through usePublicSeo
reciprocal EN/FA hreflang
x-default -> EN/default
cover -> avatar -> PWA fallback social image
server-authoritative creator.policy.indexable -> per-page noindex
NUXT_PUBLIC_NOINDEX global staging switch still wins
ProfilePage JSON-LD with Person mainEntity
safe public links -> Person.sameAs
localized controlled skills -> Person.knowsAbout
```

Privacy boundary:

```text
no email
no birthday
no role/account status
no Creator lifecycle/review fields
no UUID
no XP/Goin
no sessions/permissions/referrals
no private Draft/storage/provider/admin data
```

Location display text remains visible but is not projected as verified residence/home-location structured data.

Focused files:

```text
app/utils/publicCreatorSeo.ts
app/pages/creator/[username].vue
scripts/public-creator-seo.test.ts
```

Founder-local automated evidence 2026-09-09:

```text
pnpm test:public-creator-seo -> 5/5 PASS
pnpm test:public-creator-web -> 19/19 PASS
pnpm locale:check -> Missing fallback EN 0 / Public Creator FA missing 0 / extra 0
```

Founder staging source/head smoke verified on both EN and FA Creator routes:

```text
localized title + description
self canonical
reciprocal en-US/fa-IR hreflang
x-default -> EN/default
localized OG/Twitter title + description + image
ProfilePage JSON-LD with Person mainEntity
safe public sameAs + knowsAbout projection
no observed private fields in JSON-LD
NUXT_PUBLIC_NOINDEX=true preserved staging noindex
```

Founder explicit acceptance:

```text
4C.6 تاییده.
```

Result:

```text
4C.6 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

---

## 9. 4C.7 — Prompt/Discovery attribution gate

4C.7 is now unblocked because 4C.4–4C.6 are founder-accepted.

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
+ 4C.3 accepted
+ 4C.4 accepted
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
