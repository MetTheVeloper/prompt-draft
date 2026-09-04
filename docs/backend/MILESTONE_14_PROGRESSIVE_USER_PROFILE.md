# Milestone 14 — Progressive User Profile Foundation

Status: **IN PROGRESS — implementation complete, local verification pending**

This milestone establishes the foundation for progressively enriching a user account after low-friction registration.

The product goal is not a one-off email form. Future features should be able to require specific profile information only when it becomes useful, while the account can start with minimal identity data.

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

New migration:

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

Auth responses now include:

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

`useAuth()` now exposes:

```text
profile
missingProfileFields
hasProfileField(field)
completeProfile(input)
```

Login, registration, `/api/auth/me`, and profile completion all populate the same profile-state contract.

## Reusable frontend requirement helper

New composable:

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

If the requirement is already satisfied, the continuation can run immediately. Otherwise the shared Global Modal opens and asks only for the missing fields.

## Reusable completion UI

New component:

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

## First real entry point

The Profile Menu now shows:

```text
Complete profile
```

only while one of the currently supported identity fields is missing.

This gives Milestone 14 a real product verification path without inventing a fake feature gate.

Expected example:

```text
username-only account
  -> Profile Menu shows Complete profile
  -> modal asks for email only
  -> save
  -> Auth state now contains username + email
  -> Complete profile action disappears
  -> account can subsequently sign in with either username or email
```

The reverse flow applies to an email-only account, where the modal asks for username.

## Localization

New completion UI copy is included in both:

```text
i18n/locales/auth.en.ts
i18n/locales/auth.fa.ts
```

## Explicitly out of scope

This milestone does not yet implement:

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

Those should become separate vertical slices on top of this foundation.

## Verification required before DONE

The user must verify locally:

```text
1. existing username-only account still logs in
2. existing email-only account still logs in (if available)
3. Profile Menu shows Complete profile when one identity field is missing
4. username-only account can add a unique valid email
5. email-only account can add a unique valid username
6. successful completion updates Profile Menu immediately
7. completed account can log out and sign back in using either identity
8. invalid values are rejected without changing the account
9. duplicate username/email returns a safe conflict UI
10. existing identity cannot be replaced through the completion API
11. EN/FA modal UI works
12. backend/API restart keeps completed profile data
13. pnpm generate succeeds
```

Do not mark this milestone DONE until the user explicitly confirms local verification.
