# Milestone 21.5 — Phase 4C.3 Creator Application + Admin Review

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

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

This slice turns a completed authenticated profile into an explicit, reviewable Creator application without changing the account RBAC role. Public Creator projection is intentionally a separate 4C.4 boundary.

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

Readiness is calculated from saved server state:

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

Owner UI states:

```text
none + ready       -> Request Creator Account enabled
none + incomplete  -> request disabled + missing requirements shown
pending            -> under review; no duplicate request action
rejected + ready   -> Request review again
approved           -> approved status
suspended          -> suspended status
```

Saving profile data remains separate from submitting/reapplying.

---

## 3. Authorization contract

Dedicated permission:

```text
creators.manage
```

Grants:

```text
user        -> no creators.manage
admin       -> creators.manage, still no users.manage
super_admin -> wildcard -> creators.manage
```

Creator review actions do not change role, account suspension state, session state or Cloud-data state.

Self-review is blocked server-side and disabled in UI.

---

## 4. Admin API contract

```text
GET  /api/admin/creators
GET  /api/admin/creators/:userId
GET  /api/admin/creators/:userId/events
POST /api/admin/creators/:userId/approve
POST /api/admin/creators/:userId/reject
POST /api/admin/creators/:userId/suspend
POST /api/admin/creators/:userId/unsuspend
```

Index query support:

```text
limit=1..100
cursor=<opaque cursor>
query=<username/email search>
status=pending|approved|rejected|suspended
```

Approve/reject accept optional internal review note up to 2000 characters.

---

## 5. Review transitions and concurrency

```text
pending   -> approved
pending   -> rejected
approved  -> suspended
suspended -> approved
```

Other state/action pairs fail with conflict instead of being coerced.

Before approval, current state is reacquired/locked and Creator readiness is recalculated. A profile that became incomplete after requesting cannot be approved.

Self-review:

```text
actor.id == targetUserId -> CREATOR_SELF_REVIEW_BLOCKED
```

Request/review mutations use transactions.

---

## 6. Audit and history

Every real Creator lifecycle transition writes:

```text
creator_account_events
```

Administrative transitions also write:

```text
admin_audit_log
```

Event vocabulary:

```text
requested
reapplied
approved
rejected
suspended
unsuspended
```

Repeated pending request is idempotent and does not append a duplicate event.

---

## 7. Admin review UI

`/manage/users` includes Creator Applications for actors with `creators.manage`.

Panel:

```text
default Pending filter
Pending / Approved / Rejected / Suspended filters
username/email search
cursor pagination
Creator status colored text
requested/updated timestamps
review action
```

Review modal:

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
approve/reject/suspend/restore actions
self-review disabled in UI
```

Final visual polish accepted with this slice:

```text
article preview uses var(--normalText)
Creator status list text keeps semantic color without marker background
```

---

## 8. Review projection privacy

Review endpoints are authenticated and permission-gated. Their internal account/review DTO must never be reused by:

```text
/api/public/creators/:username
/creator/:username
/fa/creator/:username
```

The public positive allowlist begins in 4C.4.

---

## 9. Founder-local verification evidence

Final focused backend run on 2026-09-09:

```text
npm run test:creator-account
-> 15 tests
-> 15 pass
-> 0 fail
```

The suite includes:

```text
creatorAccount.test.mjs
creatorAdminIndex.test.mjs
```

Covered:

```text
request/reapply/pending idempotency
explicit state-safe transitions
admin creators.manage without users.manage
review-note normalization/limit
complete + incomplete request behavior
approval readiness recheck
lifecycle + audit writes
self-review backend block
approval failure after profile becomes incomplete
admin list status/search/limit
review-safe account metadata + pagination
event history ordering/admin-only contract
```

Related final regression evidence:

```text
test:generated-username -> 3/3 PASS
test:profile-management -> 8/8 PASS
frontend Docker production build -> PASS
```

Founder browser smoke exercised:

```text
request -> pending
pending list/filter
localized review modal
self-review block
second-account review
approve Creator
approved state/filter
Creator profile-menu behavior
```

Founder statement after the final smoke:

```text
همه چی درسته هیچ خطایی نداریم
```

---

## 10. Acceptance

All required gates passed:

```text
[x] focused backend suite PASS
[x] frontend production container build PASS
[x] owner application browser smoke PASS
[x] admin review browser smoke PASS
[x] self-review browser/backend proof PASS
[x] explicit founder acceptance
```

Result:

```text
4C.3 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-09
```

Next:

```text
4C.4 Public Creator Policy + Sanitized Backend Projection
```
