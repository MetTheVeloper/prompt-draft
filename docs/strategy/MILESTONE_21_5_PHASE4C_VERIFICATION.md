# Milestone 21.5 — Phase 4C Verification Ledger

Status: **OPEN / AUDIT-DESIGN RECORDED / IMPLEMENTATION GATES PENDING**

Date: 2026-09-08

Branch:

```text
feature/growth-foundation
```

Architecture source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4C_PUBLIC_CREATOR_ARCHITECTURE.md
```

This ledger records verification evidence for Phase 21.5.4C. No implementation slice is DONE merely because code or tests exist. Each slice requires founder-local verification and explicit acceptance at the appropriate checkpoint.

---

## 1. Current checkpoint

```text
4C audit                             -> COMPLETE AS ENGINEERING AUDIT / FOUNDER REVIEW PENDING
4C architecture/design               -> PROPOSED / FOUNDER ACCEPTANCE PENDING
4C.1 backend Creator policy/DTO      -> NOT STARTED
4C.2 Public Creator SSR route        -> NOT STARTED
4C.3 Creator SEO/indexability        -> NOT STARTED
4C.4 Prompt/Discovery attribution    -> NOT STARTED
4C.5 aggregate/staging acceptance    -> NOT STARTED
Phase 21.5.4C                        -> IN PROGRESS / NOT ACCEPTED
```

No implementation should begin until the audit/design checkpoint is explicitly accepted.

---

## 2. Audit evidence recorded

### User/account schema

Verified from current branch migrations/source:

```text
username is nullable but case-insensitively unique when present
username normalization -> trim + lowercase + ^[a-z0-9._-]{3,64}$
email is account/private identity and not approved public Creator data
status -> active|suspended
avatar + cover presentation fields exist
bio/displayName/localized profile text -> not present in audited schema
user soft-delete status/column -> not present in audited schema
```

Result: **AUDITED**

### Current `/user` boundary

Verified:

```text
client-only product/account route
supports internal UUID or username query lookup
optional auth + owner-aware behavior
Draft edit/delete/publish/unpublish actions
XP and Draft stats presentation
admin promotion/moderation hooks
```

Result: **AUDITED — NOT A CANONICAL PUBLIC CREATOR SURFACE**

### Existing profile APIs

Verified current non-owner profile payload includes fields unsuitable for Public Creator V1:

```text
internal user UUID
XP
public Draft count
account createdAt
```

Owner paths additionally expose owner-only Draft state/data.

Result: **AUDITED — MUST NOT BE REUSED AS 4C PUBLIC DTO**

### Publication provenance

Verified:

```text
prompt_archive_items.source_user_id
prompt_archive_items.source_draft_id
source_kind=user_draft
promotion source requires public, non-deleted Draft + active user
published Archive status remains canonical public Prompt publication state
```

Result: **AUDITED — source_user_id selected as proposed Creator attribution provenance**

### Discovery/Public Prompt state

Verified:

```text
Discovery currently joins active source user and may expose username/avatar
Public Prompt currently exposes no creator/source-user identity
```

Result: **AUDITED — future convergence on shared Creator policy required**

### Locale/SEO primitives

Verified:

```text
EN default unprefixed
FA /fa prefix
publicCreatorPath(username) already exists
usePublicSeo supports canonical/hreflang/x-default/page noindex
NUXT_PUBLIC_NOINDEX globally overrides staging indexability
/user explicitly client-only; new /creator route can remain SSR by default
```

Result: **AUDITED**

---

## 3. Architecture review gate

Founder must explicitly accept or revise these proposed rules before 4C.1 implementation:

```text
canonical route:
  /creator/:username
  /fa/creator/:username

accessible:
  active user
  + valid canonical username
  + no public-access prohibition

indexable:
  accessible
  + at least one attributed published Archive Prompt

discoverable:
  indexable

no avatar/cover/bio/XP/count threshold
```

Status: **PENDING FOUNDER ACCEPTANCE**

---

## 4. 4C.1 backend policy + public projection gate

Required implementation evidence:

```text
[ ] dedicated server-authoritative creator policy module
[ ] dedicated username-keyed public Creator endpoint
[ ] no UUID lookup round-trip required by public client
[ ] SELECT allowlist excludes private/account fields
[ ] public identity DTO contains only approved fields
[ ] publication DTO contains only canonical public presentation metadata
[ ] suspended/unknown/prohibited creators return generic 404
[ ] accessible/noindex Creator returns 200 with safe policy result
[ ] no XP
[ ] no email
[ ] no Goin/balance
[ ] no permissions/sessions
[ ] no private Draft data
[ ] no storage keys
[ ] backend contract/privacy tests PASS
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 5. 4C.2 Public Creator SSR route gate

Required evidence:

```text
[ ] /creator/:username SSR 200 for accessible Creator
[ ] /fa/creator/:username SSR 200 for accessible Creator
[ ] unavailable Creator -> real 404
[ ] noncanonical case redirects to lowercase canonical username
[ ] no internal UUID in canonical route
[ ] accessible-but-nonindexable Creator still renders normally
[ ] /user remains unchanged/client-only/product-account
[ ] EN/FA LTR/RTL browser presentation verified
[ ] no protected/account controls appear on Creator page
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 6. 4C.3 SEO/indexability gate

Required evidence:

```text
[ ] EN self canonical
[ ] FA self canonical
[ ] reciprocal EN/FA hreflang
[ ] x-default -> English/default
[ ] page robots driven by server policy
[ ] accessible + nonindexable -> noindex
[ ] staging NUXT_PUBLIC_NOINDEX=true still wins globally
[ ] ProfilePage JSON-LD
[ ] Person mainEntity contains public-safe fields only
[ ] no fake localized Prompt fallback
[ ] raw SSR metadata inspection PASS
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 7. 4C.4 Prompt ↔ Creator + Discovery convergence gate

Blocked until 4C public Creator contract is accepted safe.

Required evidence:

```text
[ ] Public Prompt optional creator attribution only from source_user_id provenance
[ ] provenance-less/legacy Prompts remain valid without Creator
[ ] unavailable Creator -> no attribution link
[ ] Prompt creator DTO contains username + optional approved presentation media only
[ ] no internal UUID in browser-facing creator attribution
[ ] Prompt link locale-safe through publicCreatorPath + localePath
[ ] Discovery owner identity uses same Creator eligibility contract
[ ] no duplicate ad-hoc account-status/public-identity policy remains on public acquisition paths
[ ] Public Prompt protected-field regression remains green
[ ] Discovery protected-field regression remains green
```

Founder-local verification: **PENDING**

Acceptance: **PENDING**

---

## 8. 4C.5 aggregate/final gate

Required evidence before Phase 4C acceptance:

```text
[ ] aggregate 4C frontend/backend tests PASS
[ ] existing Phase 4B regression remains PASS
[ ] strict locale-routing audit PASS
[ ] production build PASS
[ ] founder-local EN/FA browser smoke PASS
[ ] grassic.ir Creator SSR smoke PASS
[ ] api.grassic.ir Creator API smoke PASS
[ ] accessible/noindex fixture verified
[ ] indexable-policy fixture verified while staging still globally noindex
[ ] suspended/unavailable fixture verified 404
[ ] Prompt attribution fixture verified
[ ] Discovery attribution fixture verified
[ ] serialized SSR private-key leakage -> zero
[ ] X-Robots-Tag staging protection preserved
[ ] smoke tooling refuses prompt-draft.ir
[ ] prompt-draft.ir untouched
[ ] founder explicit acceptance received
```

Final status: **PENDING**

---

## 9. Privacy regression denylist

Every public Creator/Prompt/Discovery DTO and SSR serialization check should scan for at least:

```text
email
passwordHash / password_hash
role
status (unless internal-only policy processing; never public account-state disclosure)
balance
goin
permissions
sessions
totalXp / xp
totalDraftCount
private Draft visibility/payload
sourceDraftId
sourceUserId/internal UUID
storageKey / storage_key
admin audit metadata
```

This denylist supplements, but does not replace, explicit positive DTO/query allowlists.

---

## 10. Acceptance rule

Phase 4C can be marked DONE only when:

```text
architecture accepted
+ 4C.1 founder-local verified/accepted
+ 4C.2 founder-local verified/accepted
+ 4C.3 founder-local verified/accepted
+ 4C.4 founder-local verified/accepted
+ 4C.5 aggregate local/staging gates PASS
+ founder explicit Phase 4C acceptance
= Phase 21.5.4C DONE / ACCEPTED
```

Until then:

```text
Phase 21.5.4C -> IN PROGRESS
```
