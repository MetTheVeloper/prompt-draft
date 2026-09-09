# Milestone 21.5 — Phase 4C.3 Creator Application + Admin Review

Status: **IMPLEMENTED / FOUNDER-LOCAL UI + INTEGRATION VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parent architecture:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

Verification ledger:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

This slice turns a completed authenticated profile into an explicit, reviewable Creator application without changing the account RBAC role. It does not create the public Creator route; that remains Phase 4C.4+.

---

## 1. Locked invariants

```text
Creator remains separate from users.role
saving a profile never submits a Creator request
publishing a Prompt never creates Creator state
request eligibility is recalculated server-side from saved DB state
approval eligibility is recalculated again inside the review transaction
admin receives creators.manage without receiving users.manage
super_admin receives creators.manage through wildcard
self-review is blocked in the backend
account suspension and Creator suspension remain distinct states
Creator lifecycle history is append-only
```

---

## 2. Owner application contract

Endpoint:

```text
POST /api/creator-account/request
```

Authentication is required.

Readiness is calculated from the saved account/profile state:

```text
account.status == active
canonical username
screenName.en
screenName.fa
bio.en
bio.fa
article.en
article.fa
>= 1 active selected taxonomy skill
```

Transitions:

```text
none      -> pending / requested event
rejected  -> pending / reapplied event
pending   -> idempotent pending response / no duplicate event
approved  -> conflict
suspended -> conflict
```

Incomplete requests fail before Creator state mutation and return field-level requirement errors.

The owner UI is surfaced on the authenticated Profile manage surface. It intentionally operates on the **saved server profile**, so unsaved form edits are never treated as an application payload.

Owner UI states:

```text
none + ready       -> Request Creator Account enabled
none + incomplete  -> request disabled + missing requirements shown
pending            -> under review; no duplicate request action
rejected + ready   -> Request review again
approved           -> approved status
suspended          -> suspended status
```

Saving profile data remains a distinct action from submitting/reapplying.

---

## 3. Authorization contract

Dedicated permission:

```text
creators.manage
```

Implemented grants:

```text
user        -> no creators.manage
admin       -> creators.manage, still no users.manage
super_admin -> wildcard -> creators.manage
```

Creator review actions are independent from role changes, account suspension, session revocation, and Cloud-data reset.

Self-review is blocked server-side and also disabled in the review UI.

---

## 4. Admin API contract

Review index:

```text
GET /api/admin/creators
```

Supported query parameters:

```text
limit=1..100
cursor=<opaque cursor>
query=<username/email search>
status=pending|approved|rejected|suspended
```

Review detail:

```text
GET /api/admin/creators/:userId
```

Lifecycle history:

```text
GET /api/admin/creators/:userId/events
```

Mutations:

```text
POST /api/admin/creators/:userId/approve
POST /api/admin/creators/:userId/reject
POST /api/admin/creators/:userId/suspend
POST /api/admin/creators/:userId/unsuspend
```

Approve/reject accept an optional internal review note.

Review note technical ceiling:

```text
2000 characters
```

---

## 5. Review transitions and concurrency

```text
pending   -> approved
pending   -> rejected
approved  -> suspended
suspended -> approved
```

Other state/action pairs fail with explicit conflict errors instead of silently coercing state.

Before `approve`, the server reacquires/locks current state and recalculates Creator readiness. A profile that was complete when the request was submitted but became incomplete before review cannot be approved.

Self-review is rejected before transaction work:

```text
actor.id == targetUserId -> CREATOR_SELF_REVIEW_BLOCKED
```

Request/review mutations use database transactions. Request mutation serializes against profile editing through the account row lock used by the profile-management contract.

---

## 6. Audit and history

Every real lifecycle transition writes:

```text
creator_account_events
```

Administrator transitions also write the existing:

```text
admin_audit_log
```

Lifecycle event vocabulary:

```text
requested
reapplied
approved
rejected
suspended
unsuspended
```

A repeated request while already pending is idempotent and does not append a duplicate lifecycle event.

The event-history endpoint returns the review lifecycle for authorized admin UI use. It is not a public Creator projection.

---

## 7. Admin review UI

`/manage/users` now contains a Creator Applications panel for actors with `creators.manage`.

The panel provides:

```text
default Pending filter
All / Pending / Approved / Rejected / Suspended filters
username/email search
cursor pagination
Creator status badges
requested/updated timestamps
review action
```

The review modal provides:

```text
account + Creator state
server readiness state
EN/FA screen name
EN/FA bio
EN/FA Creator article source
active skills
public links
location display text
optional review note
Creator lifecycle history
state-appropriate approve/reject/suspend/restore actions
self-review disabled in UI in addition to backend protection
```

The existing general user-management table remains separate. `creators.manage` does not unlock unrelated user-account mutations.

---

## 8. Review projection privacy

The review endpoints are authenticated and permission-gated. They may contain internal account/review information needed by the reviewer, including email, birthday or review metadata where applicable.

They are **NOT** Public Creator DTOs and MUST NOT be reused by:

```text
/api/public/creators/:username
/creator/:username
/fa/creator/:username
```

The positive public allowlist remains a later 4C.4 boundary.

---

## 9. Founder-local backend evidence already reported

Founder-local run on 2026-09-09, before the later admin-index/history tests were added:

```text
npm run test:creator-account
-> 11 tests
-> 11 pass
-> 0 fail
-> duration ~232 ms
```

Covered evidence:

```text
request/reapply/pending-idempotency lifecycle
explicit state-safe admin transitions
admin creators.manage without users.manage
review-note normalization and limit
complete first request
incomplete request rejection
approval readiness recheck
lifecycle + admin audit writes
self-review block
approval failure after profile becomes incomplete
```

The later implementation adds `creatorAdminIndex.test.mjs` to the same `test:creator-account` command, so a focused rerun is required before full 4C.3 acceptance.

---

## 10. Implementation checkpoint

Backend:

```text
[x] creators.manage permission
[x] admin grant without users.manage
[x] user application endpoint
[x] server-authoritative request readiness recheck
[x] none -> pending requested flow
[x] pending idempotency
[x] rejected -> pending reapply flow
[x] approved/suspended request conflict
[x] Creator admin review detail projection
[x] Creator admin review index + status/search/pagination
[x] Creator lifecycle history endpoint
[x] approve/reject/suspend/unsuspend endpoints
[x] explicit state-transition validation
[x] self-review block
[x] approval-time readiness recheck
[x] lifecycle event append
[x] admin audit append
[x] optional bounded review note
[x] backend lifecycle contract tests
[x] backend admin-index/history contract tests added
```

Frontend:

```text
[x] owner Request Creator Account application card
[x] pending/rejected/reapply owner UI states
[x] server-saved-profile application semantics
[x] /manage/users Creator Applications panel
[x] Creator status filters + search
[x] Creator review modal/details workflow
[x] EN/FA profile review projection
[x] approve/reject UI + optional note
[x] suspend/restore Creator UI
[x] lifecycle history UI
[x] self-review UI guard
[x] EN/FA localization
```

Still pending:

```text
[ ] focused backend suite rerun including admin-index/history tests
[ ] frontend production container build after 4C.3 UI integration
[ ] owner request browser smoke
[ ] admin review browser smoke
[ ] explicit founder 4C.3 acceptance
```

---

## 11. Focused founder-local verification gate

Follow the project-wide time-first workflow. Do not rebuild the full stack.

Automated:

```powershell
git pull
pnpm api
docker compose exec api npm run test:creator-account
pnpm frontend
```

No schema migration is required for this incremental 4C.3 checkpoint.

Expected backend suite now includes both:

```text
backend/src/creatorAccount.test.mjs
backend/src/creatorAdminIndex.test.mjs
```

Manual owner smoke:

```text
[ ] complete saved regular profile shows Request Creator Account
[ ] request transitions owner UI to Pending
[ ] pending request cannot create duplicate lifecycle state
[ ] incomplete saved profile keeps request disabled / explains missing requirements
[ ] rejected request may reapply after profile changes are saved
```

Manual admin smoke:

```text
[ ] admin and super_admin see Creator Applications panel in /manage/users
[ ] ordinary user does not gain Creator review tools
[ ] panel defaults to Pending
[ ] Creator status filter works
[ ] username/email search works
[ ] review modal loads EN/FA profile content, skills, links/location and history
[ ] approve works only while current server readiness is complete
[ ] reject works and optional note persists
[ ] approved Creator may be suspended
[ ] suspended Creator may be restored
[ ] self-review is blocked
[ ] admin can review Creators while still lacking users.manage
```

---

## 12. Acceptance rule

4C.3 is not DONE merely because implementation exists.

Required:

```text
focused backend suite PASS
frontend production container build PASS
owner application browser smoke PASS
admin review browser smoke PASS
explicit founder acceptance
```

Until then:

```text
4C.3 -> IMPLEMENTED / FOUNDER-LOCAL UI + INTEGRATION VERIFICATION PENDING
```
