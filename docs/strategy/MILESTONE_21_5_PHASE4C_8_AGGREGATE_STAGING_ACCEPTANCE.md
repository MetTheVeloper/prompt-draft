# Milestone 21.5 — Phase 4C.8 Aggregate + Staging Acceptance

Status: **IMPLEMENTED / FINAL FOUNDER-LOCAL + STAGING VERIFICATION PENDING**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
docs/strategy/MILESTONE_21_5_PHASE4C_VERIFICATION.md
```

Accepted dependencies:

```text
4C.1 Creator Profile Foundation              ACCEPTED
4C.2 Authenticated Profile Management        ACCEPTED
4C.3 Creator Application + Admin Review      ACCEPTED
4C.4 Public Creator Policy + Sanitized API   ACCEPTED
4C.5 Public Creator SSR                      ACCEPTED
4C.6 Creator SEO + Indexability              ACCEPTED
4C.7 Prompt/Discovery Creator Attribution    ACCEPTED
```

4C.8 adds no new product semantics. It is the aggregate regression + production-build + staging-smoke gate that proves the accepted 4C slices still compose safely before Phase 4C itself may be marked DONE.

---

## 1. Time-first verification rule

The project-wide workflow remains authoritative:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

4C.8 is an acceptance checkpoint, so a broad regression suite is justified. It still must not rebuild the full Docker stack without need.

Current 4C.8 implementation changes only root scripts/docs. Therefore after the founder pulls this checkpoint:

```text
API rebuild       -> NOT REQUIRED when current running API image already contains accepted 4C.7 backend/tests
full stack rebuild -> NOT REQUIRED
frontend rebuild   -> REQUIRED ONCE as the final production-build/runtime-image gate
```

---

## 2. Aggregate regression command

New command:

```powershell
pnpm test:phase4c-final
```

Implementation:

```text
scripts/phase4c-final-regression.mjs
```

The command intentionally performs **no Docker rebuild**. It runs the accepted backend test scripts against the currently running API image, then the frontend/public/SEO/routing/localization regressions from the host.

Backend gates:

```text
test:creator-profile-foundation
test:profile-skill-taxonomy
test:profile-management
test:creator-account
test:generated-username
test:public-creator
test:creator-attribution
```

Frontend/platform gates:

```text
test:public-creator-web
test:creator-attribution-web
test:phase4b-final
locale:check
```

The inherited Phase 4B final regression continues to verify:

```text
SEO route contracts
Public Prompt browser/SSR DTO
Public Prompt SEO
localized Public Prompt descriptions
shared Prompt presentation
Public Discovery presentation
public-link migration
interaction polish
strict locale-routing audit
```

---

## 3. Final production build/runtime-image gate

Run once:

```powershell
pnpm frontend
```

This performs the production Nuxt build inside the frontend Docker image and refreshes only that service.

Do not run `pnpm stack` for this gate.

---

## 4. Staging smoke command

New command:

```powershell
pnpm smoke:phase4c-final
```

Implementation:

```text
scripts/phase4c-final-staging-smoke.mjs
```

Defaults:

```text
site     = https://grassic.ir
API      = https://api.grassic.ir
Creator  = grassias
```

The smoke refuses to target `prompt-draft.ir`.

It verifies:

```text
approved Creator public API -> 200
positive public Creator allowlist only
Creator policy indexable/discoverable true for approved complete fixture
zero-publication Creator remains valid
unknown public Creator -> generic 404
EN Creator SSR -> 200
FA Creator SSR -> 200
localized ScreenName/Bio
self canonical
reciprocal EN/FA hreflang + x-default
ProfilePage + Person JSON-LD
permanent mixed-case username canonical redirect
missing Creator SSR -> 404
staging X-Robots-Tag noindex preserved
serialized public API/SSR private-key denylist -> zero observed leakage
```

Optional stable Prompt attribution fixture:

```powershell
$env:PHASE4C_SMOKE_PROMPT_ID="123"
pnpm smoke:phase4c-final
```

When provided, the smoke also requires that Public Prompt to attribute to the accepted Creator and verifies locale-safe Creator links from EN/FA Prompt SSR.

A Prompt id is intentionally not hardcoded because attribution fixtures may change. 4C.7 already has accepted backend/browser policy-matrix coverage for unattributed and unavailable Creator states.

---

## 5. Privacy denylist

The aggregate/staging boundary protects the positive DTO contract and additionally scans for serialized keys including:

```text
email
birthday
passwordHash / password_hash
role
creatorStatus
reviewNote
balance / goin
permissions
sessions
totalXp
sourceDraftId
sourceUserId / source_user_id
storageKey / storage_key
location provider ids
admin audit data
```

The denylist is defense in depth; positive public allowlists remain authoritative.

---

## 6. Negative Creator-state evidence

The accepted backend suites already exercise:

```text
none
pending
rejected
Creator-suspended
account-inactive
invalid/noncanonical username
```

and prove those states do not become public Creator identities.

4C.8 does not require mutating production-like staging data merely to manufacture every negative lifecycle state. The staging smoke confirms a generic unavailable Creator 404 while the accepted state matrix supplies state-specific evidence.

---

## 7. Final founder checklist

```text
[ ] pnpm test:phase4c-final PASS
[ ] pnpm frontend PASS
[ ] pnpm smoke:phase4c-final PASS
[ ] EN/FA Creator page visual sanity remains correct
[ ] Creator attribution on Public Prompt/Home/Discovery remains correct from accepted 4C.7 smoke
[ ] approved Creator fixture works
[ ] zero-publication approved Creator remains valid
[ ] generic unavailable Creator remains 404
[ ] staging noindex remains active
[ ] no observed private public serialization
[ ] prompt-draft.ir remains untouched
[ ] founder explicitly accepts Phase 21.5.4C
```

---

## 8. Acceptance rule

Until the three aggregate commands and final founder smoke are accepted:

```text
4C.8 -> FINAL VERIFICATION PENDING
Phase 21.5.4C -> IN PROGRESS
```

After explicit founder acceptance:

```text
4C.8 -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
Phase 21.5.4C -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED
Next -> 21.5.4D Sitemap / Robots / Discovery Migration
```
