# Milestone 21.5 — Phase 4C.3 Creator Application + Admin Review

Status: **IN PROGRESS / BACKEND FOUNDATION IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

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

This slice does not become DONE because backend code exists. Founder-local verification and explicit acceptance are still required.

---

## 1. Goal

Turn a completed authenticated profile into an explicit, reviewable Creator application without changing the account RBAC role.

```text
profile complete
  != Creator

published Prompt
  != Creator

explicit request
  -> pending
  -> admin/super_admin review
  -> approved | rejected
```

Creator lifecycle remains orthogonal to:

```text
users.role = user | admin | super_admin
```

---

## 2. Authorization contract

Dedicated permission:

```text
creators.manage
```

Target grants:

```text
user        -> no creators.manage
admin       -> creators.manage
super_admin -> wildcard -> creators.manage
```

Important invariant:

```text
admin does NOT gain users.manage merely to review Creator applications
```

Creator review actions are independent from role changes, account suspension, session revocation, and Cloud-data reset.

Self-review is blocked server-side.

---

## 3. User application endpoint

```text
POST /api/creator-account/request
```

Requirements:

```text
authenticated active account
canonical username
screenName EN + FA
bio EN + FA
article EN + FA
>= 1 active controlled taxonomy skill
```

The server reads the current database state and recomputes readiness at submission time. UI readiness is never trusted as authorization.

Transitions:

```text
none     -> pending + requested event
rejected -> pending + reapplied event
pending  -> pending, idempotent, no duplicate event
approved -> conflict
suspended-> conflict
```

Saving `/manage/profile` remains independent and never creates an application automatically.

---

## 4. Admin review endpoints

Review projection:

```text
GET /api/admin/creators/:userId
```

Actions:

```text
POST /api/admin/creators/:userId/approve
POST /api/admin/creators/:userId/reject
POST /api/admin/creators/:userId/suspend
POST /api/admin/creators/:userId/unsuspend
```

Optional request body:

```json
{
  "note": "optional review note"
}
```

Review note technical ceiling:

```text
2000 characters
```

Explicit transition table:

```text
pending   + approve   -> approved
pending   + reject    -> rejected
approved  + suspend   -> suspended
suspended + unsuspend -> approved
```

Any other state/action pair returns a conflict instead of silently coercing state.

Approval recomputes the Creator readiness contract again while the target account is locked. A pending applicant cannot remove required content after submitting and still be approved accidentally.

---

## 5. Transaction and history rules

Request/review mutations use database transactions.

Request transaction serializes against profile editing through the account row lock used by the profile-management contract.

Every real lifecycle transition appends to:

```text
creator_account_events
```

Event vocabulary already established by migration 027:

```text
requested
approved
rejected
suspended
unsuspended
reapplied
```

Admin actions additionally append to the existing administrative audit ledger using actions:

```text
creator.approved
creator.rejected
creator.suspended
creator.unsuspended
```

The current-state row stays efficient for policy/UI reads while history remains append-only.

---

## 6. Admin review projection privacy

The review endpoint is authenticated and permission-gated. It may contain internal review information needed by the reviewer, but it is NOT a Public Creator DTO and must never be reused by `/api/public/creators/:username`.

The public allowlist remains a later 4C.4 boundary.

---

## 7. Backend implementation checkpoint

Implemented:

```text
[x] creators.manage backend permission
[x] admin grant without users.manage
[x] user application endpoint
[x] server-authoritative request readiness recheck
[x] none -> pending requested flow
[x] pending idempotency
[x] rejected -> pending reapply flow
[x] approved/suspended request conflict
[x] Creator admin review projection
[x] approve/reject/suspend/unsuspend endpoints
[x] explicit state-transition validation
[x] self-review block
[x] approval-time readiness recheck
[x] lifecycle event append
[x] admin audit append
[x] optional bounded review note
[x] backend lifecycle contract test suite
```

Not yet implemented/accepted in this checkpoint:

```text
[ ] /manage/profile Request Creator Account UI
[ ] pending/rejected/reapply UI states
[ ] manage/users Creator status column/badge
[ ] manage/users Creator status filter
[ ] Creator review modal/details workflow
[ ] approve/reject UI + note
[ ] suspend/unsuspend Creator UI
[ ] founder-local backend verification
[ ] founder-local frontend verification
[ ] explicit 4C.3 acceptance
```

---

## 8. Verification gate

Because current 4C.3 changes touch the API image, the smallest rebuild scope is:

```powershell
pnpm api
```

After the implementation commit is pulled, relevant backend verification is:

```powershell
docker compose exec api npm run test:creator-account
docker compose exec api npm run test:creator-profile-foundation
docker compose exec api npm run test:profile-management
```

No full-stack rebuild is justified for backend-only Creator lifecycle verification.

Frontend 4C.3 verification will use the service-scoped frontend workflow separately when that UI lands.

---

## 9. Acceptance rule

```text
backend lifecycle tests PASS
+ request/reapply/idempotency manual smoke PASS
+ admin/super_admin permission/review smoke PASS
+ self-review rejection PASS
+ manage/users workflow PASS
+ profile request UI PASS
+ founder explicit acceptance
= 4C.3 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

Until then:

```text
4C.3 -> IN PROGRESS
```
