# Milestone 14 — Progressive User Profile Foundation

Status: **DONE — locally verified**

This milestone establishes the foundation for progressively enriching a user account after low-friction registration.

The product goal is not a one-off email form. Future features can require specific profile information only when it becomes useful, while the account can start with minimal identity data.

## Product semantics

A Prompt Draft account may now have:

```text
username only
email only
username + email
```

At least one identity remains required.

Existing identity values are intentionally immutable through the progressive-completion endpoint. This milestone only fills fields that are currently missing. Future account-settings work can define separate, explicit rename/change/verification semantics.

## Schema

Migration:

```text
backend/sql/008_progressive_user_profile.sql
```

Changes:

```text
old users CHECK:
  exactly one of username/email

new users CHECK:
  username OR email must exist

users.updated_at:
  added as a first-class account mutation timestamp
```

Existing case-insensitive unique indexes for username and email remain authoritative.

## Backend profile state

Reusable module:

```text
backend/src/profileRequirements.mjs
```

Current supported profile fields:

```text
username
email
```

Auth responses include:

```text
profile.supportedFields
profile.completedFields
profile.missingFields
```

The module also exposes reusable missing-field / requirement-payload helpers so future backend capabilities can return a stable `PROFILE_REQUIREMENT` contract instead of inventing feature-specific checks.

## Profile completion API

Endpoint:

```text
POST /api/auth/profile/complete
Authorization: Bearer <token>
Content-Type: application/json
```

Example body:

```json
{
  "email": "user@example.com"
}
```

or:

```json
{
  "username": "prompt-user"
}
```

Both missing fields may be supplied together.

Successful response returns the refreshed:

```text
user
profile
permissions
```

### Mutation rules

```text
authentication required
only username/email are accepted in this milestone
username/email normalization matches registration/login semantics
existing non-empty identity fields cannot be changed here
repeating the same already-saved value is a successful no-op
unique identity collision -> 409 PROFILE_FIELD_TAKEN
attempt to replace existing identity -> 409 PROFILE_FIELD_LOCKED
validation failure -> 400 PROFILE_VALIDATION
```

The database unique indexes remain the final race-safe uniqueness boundary.

## Frontend auth state

`useAuth()` exposes:

```text
profile
missingProfileFields
hasProfileField(field)
completeProfile(input)
```

Login, registration, `/api/auth/me`, and profile completion populate the same profile-state contract. Frontend hydration also derives profile state from the returned user when necessary, so an older/incomplete auth payload does not incorrectly hide missing fields.

## Reusable profile requirement helper

Composable:

```text
app/composables/useProfileRequirements.ts
```

Main API:

```text
getMissingProfileFields(fields)
isProfileSatisfied(fields)
requireProfileFields(fields, options)
completeMissingIdentity(options)
```

A future feature can declare, for example:

```text
requireProfileFields(["email"], {
  onCompleted: continueFeature,
})
```

If the requirement is already satisfied, the continuation runs immediately. Otherwise the shared Global Modal asks only for the missing fields.

## Reusable profile completion UI

Component:

```text
app/components/auth/ProfileRequirementModal.vue
```

It uses the existing EL component system and Global Modal infrastructure.

The modal:

```text
renders only requested missing fields
performs localized client validation
calls the authoritative backend completion API
refreshes in-memory Auth state immediately
supports a continuation callback for the feature that requested the data
```

## Profile Menu entry point

The Profile Menu shows:

```text
Complete profile
```

only while one of the currently supported identity fields is missing.

Verified example:

```text
username-only account
  -> Profile Menu shows Complete profile
  -> modal asks for email only
  -> save
  -> Auth state contains username + email
  -> Complete profile action disappears
  -> account can subsequently sign in with either username or email
```

The reverse foundation also supports an email-only account receiving a username.

## Reusable email requirement gate

Milestone 14 also verified the first real product consumer of progressive profile completion.

New reusable pieces:

```text
app/composables/useEmailRequirement.ts
app/components/auth/EmailRequirementModal.vue
```

Usage contract:

```text
requireEmail({
  from: "globalOutputCopy",
  onCompleted: continueAction,
})
```

Behavior:

```text
logged-in user with email
  -> action continues immediately

logged-in user without email
  -> dedicated Email Requirement modal opens
  -> email is completed through authoritative profile API
  -> continuation runs after success

anonymous user
  -> action remains gated
  -> modal offers sign-in / account creation path
```

The `from` field is preserved as a reusable source/context identifier so future features can distinguish why email was requested without creating feature-specific modal infrastructure.

## First gated feature

Both Copy buttons in Global Output now use the same email requirement gate.

Verified flow:

```text
Global Output Copy
  -> email already present: direct copy
  -> missing email: modal -> save -> copy continuation
  -> duplicate email: safe 409 UI
  -> anonymous: sign-in requirement UI
```

This is a product/UX gate, not a security boundary: the compiled prompt is already visible in the browser. Any future feature whose underlying data must truly be protected requires authoritative server-side enforcement.

## Localization

Progressive completion and email-requirement UI are localized in both:

```text
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
```

The email gate uses Vue I18n-safe literal syntax for the example email placeholder.

## Local verification completed

The user explicitly verified the milestone locally.

Verified behavior includes:

```text
username-only registration
missing email detected in Profile Menu
unique valid email completion -> 200
Profile Menu updates immediately
login with username after completion
login with added email after completion
invalid email rejected
duplicate email -> 409 with safe localized UI
existing identity immutability
completed profile persists across backend/database restart
EN/FA progressive-profile UI
reusable Email Requirement modal
from="globalOutputCopy" context handling
Global Output Copy gate with missing email
Global Output direct Copy when email exists
anonymous Copy gate
continuation successfully copies after email completion
```

The final email-modal visual experiment was intentionally rolled back to the previously accepted version; visual refinement remains a future polish task and does not block the foundation.

## Explicitly out of scope

This milestone does not implement:

```text
phone number storage
email verification
phone verification
identity rename/change flows
marketing consent
analytics consent
model-training consent
XP / score ledger
leaderboards
referrals
behavioral event tracking
```

Those remain separate vertical slices on top of this foundation.

## Next logical milestone

The recommended next vertical slice is:

```text
XP / Score Event Ledger Foundation
```

The goal is an auditable, idempotent event ledger rather than a mutable `users.score += N` counter, so future Draft saves, Wizard completion, referrals, streaks, publishing, and other activities can award points without losing provenance.
