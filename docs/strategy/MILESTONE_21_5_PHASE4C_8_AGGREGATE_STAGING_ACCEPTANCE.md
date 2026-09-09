# Milestone 21.5 — Phase 4C.8 Aggregate + Staging Acceptance

Status: **DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09**

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

Final accepted verification scope:

```text
API rebuild        -> NOT REQUIRED; accepted 4C.7 API image already contained current backend/tests
full stack rebuild -> NOT REQUIRED
frontend rebuild   -> REQUIRED ONCE and founder-verified PASS
```

---

## 2. Aggregate regression command

Accepted command:

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

### Founder-local aggregate evidence 2026-09-09

```text
Creator profile foundation       -> 7/7 PASS
Creator skill taxonomy           -> 4/4 PASS
Authenticated profile management -> 8/8 PASS
Creator application/admin review -> 15/15 PASS
Generated username contract      -> 3/3 PASS
Public Creator policy/API        -> 10/10 PASS
Prompt/Discovery attribution     -> 17/17 PASS
Public Creator SSR/SEO/browser   -> 19/19 PASS
Creator attribution browser      -> 13/13 PASS
Phase 4B final regression        -> PASS
strict locale route audit        -> 463 source files / no hazards
runtime localization             -> fallback EN 0 / Creator FA missing 0 / extra 0
```

Aggregate command result:

```text
[phase4c-final] PASS: all Phase 4C backend/frontend/privacy/routing/localization regression gates passed.
```

---

## 3. Final production build/runtime-image gate

Accepted command:

```powershell
pnpm frontend
```

This performs the production Nuxt build inside the frontend Docker image and refreshes only that service.

Founder reported final result:

```text
pnpm frontend -> PASS
runtime remains healthy after refreshed frontend image
```

No full-stack rebuild was required.

---

## 4. Staging smoke command

Accepted command:

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

### Founder staging evidence 2026-09-09

```text
approved Creator API               -> 200
unknown Creator API                -> 404
EN Creator SSR                     -> 200
EN mixed-case Creator redirect     -> 301
EN missing Creator SSR             -> 404
FA Creator SSR                     -> 200
FA mixed-case Creator redirect     -> 301
FA missing Creator SSR             -> 404
privacy denylist                   -> PASS
staging noindex                     -> PASS
prompt-draft.ir target guard        -> PASS / production domain not targeted
```

Smoke result:

```text
[phase4c-smoke] PASS: Creator API/SSR, EN/FA SEO, canonical redirects, generic 404, privacy denylist and staging noindex checks passed.
[phase4c-smoke] prompt-draft.ir was not targeted by this smoke.
```

Optional stable Prompt attribution fixture remained intentionally skipped because no stable staging Prompt id was configured. This is not a blocker: 4C.7 already founder-accepted the backend/browser attribution matrix, including unavailable and unattributed states.

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

Founder aggregate + staging evidence observed zero leakage from this denylist.

---

## 6. Negative Creator-state evidence

The accepted backend suites exercise:

```text
none
pending
rejected
Creator-suspended
account-inactive
invalid/noncanonical username
```

and prove those states do not become public Creator identities.

4C.8 intentionally did not mutate production-like staging data merely to manufacture every negative lifecycle state. The staging smoke confirms a generic unavailable Creator 404 while the accepted state matrix supplies state-specific evidence.

---

## 7. Final founder checklist

```text
[x] pnpm test:phase4c-final PASS
[x] pnpm frontend PASS
[x] pnpm smoke:phase4c-final PASS
[x] EN/FA Creator page visual sanity remains correct
[x] Creator attribution on Public Prompt/Home/Discovery remains correct from accepted 4C.7 smoke
[x] approved Creator fixture works
[x] zero-publication approved Creator remains valid
[x] generic unavailable Creator remains 404
[x] staging noindex remains active
[x] no observed private public serialization
[x] prompt-draft.ir remains untouched
[x] founder explicitly accepts Phase 21.5.4C
```

Founder explicit final acceptance:

```text
pnpm frontend هم PASS بود — Phase 4C تایید
```

---

## 8. Acceptance result

```text
4C.8 -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09
Phase 21.5.4C -> DONE / FOUNDER-LOCAL + STAGING VERIFIED / ACCEPTED 2026-09-09
Next -> 21.5.4D Sitemap / Robots / Discovery Migration
```
