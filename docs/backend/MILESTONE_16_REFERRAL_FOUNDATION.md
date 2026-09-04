# Milestone 16 — Referral Foundation

Status: **IN PROGRESS — implementation complete, local verification pending**

This milestone adds the first persisted referral relationship to Prompt Draft and connects it to the existing XP ledger without introducing a separate referral-code generator.

## Product semantics

The user's existing username is the referral input/code.

```text
new account registration
  -> optional referral username
  -> resolve existing active user by username
  -> persist referrer -> referred-user relationship by UUID
  -> referred user receives +500 XP
  -> referrer receives +1000 XP
```

Referral is intentionally registration-only in this milestone. A user cannot attach a referrer to an already-created account later.

The username entered during registration is stored as an audit snapshot, but the authoritative relationship is always user-id based.

## Schema

Migration:

```text
backend/sql/012_create_referrals.sql
```

Table:

```text
referrals
  id
  referrer_user_id
  referred_user_id
  referral_username_used
  created_at
```

Key invariants:

```text
referrer_user_id -> users.id
referred_user_id -> users.id
UNIQUE (referred_user_id)
CHECK (referrer_user_id <> referred_user_id)
```

One account can therefore have at most one persisted referrer.

A referrer may refer multiple users.

`referral_username_used` preserves the normalized username that was entered at registration time. Future username changes cannot break the relationship because joins use UUIDs.

## XP integration

`012_create_referrals.sql` also installs an `AFTER INSERT` trigger on `referrals`.

One referral row produces exactly two ledger events:

```text
referred user
  event_type      = referral_joined
  points          = +500
  source_type     = referral
  source_id       = <referralId>
  idempotency_key = referral_joined:v1:<referralId>

referrer
  event_type      = referral_reward
  points          = +1000
  source_type     = referral
  source_id       = <referralId>
  idempotency_key = referral_reward:v1:<referralId>
```

The existing `user_score_events` unique `(user_id, idempotency_key)` invariant protects the score ledger from duplicate logical rewards.

Because the XP trigger runs inside the same database statement that creates the referral relationship, a referral row cannot be committed without its two score events when the statement succeeds.

Current score examples:

```text
username-only signup without referral -> 1000 XP
username-only signup with referral    -> 1500 XP
email signup without referral         -> 2000 XP
email signup with referral            -> 2500 XP
referrer reward per accepted referral -> +1000 XP
```

## Registration API contract

Existing endpoint:

```text
POST /api/auth/register
```

New optional request field:

```json
{
  "identifier": "new-user",
  "password": "example123",
  "referralUsername": "grass"
}
```

`referralUsername` is optional. Omitting it preserves the existing registration flow.

When provided, the backend:

```text
normalizes it with the same username rules used by Auth
resolves it case-insensitively
requires the referrer account to exist and be active
rejects direct self-referral when the new identifier is the same username
creates the user and referral relationship atomically
returns the normal Auth session payload including the resulting XP state
```

Stable referral error codes:

```text
REFERRAL_USERNAME_INVALID
REFERRAL_USERNAME_NOT_FOUND
REFERRAL_SELF_REFERENCE
```

Invalid or unavailable referral input aborts registration. Prompt Draft does not silently create the account while discarding the requested referral.

## Atomic account + referral creation

Referral-aware signup uses one PostgreSQL data-modifying CTE:

```text
eligible_referrer
  -> inserted_user
  -> inserted_referral
  -> referral XP trigger
```

The referrer is checked for `status = active` again inside the write statement. If the referrer becomes unavailable between validation and the write, no user row is inserted by that statement.

This avoids a partial state where a requested referral signup creates the user but loses the referral relationship.

Session creation remains the existing post-registration Auth behavior and is outside the referral relationship transaction boundary.

## Frontend registration UI

The existing `/login` registration step now renders this field directly after Repeat Password:

```text
Referral username (optional)
```

The field is not shown during normal sign-in.

`useAuth().register()` now accepts:

```ts
register(identifier, password, {
  referralUsername,
})
```

Frontend copy is localized in EN and FA, including:

```text
field label
placeholder
+500 / +1000 XP hint
invalid username error
referrer-not-found error
self-referral error
```

## Security / integrity boundaries

Backend validation is authoritative.

The UI field being optional or hidden in login mode is not a security boundary.

Current integrity rules:

```text
one referrer per referred account
no direct self-referral relation
active referrer required
case-insensitive username lookup
invalid/nonexistent referrer aborts signup
XP derives from the persisted referral relation
```

## Explicitly deferred

Not part of Milestone 16:

```text
random/generated referral codes
referral links / URL prefill
Profile Menu referral-code display
referral invite list UI
referral dashboard / ranking
admin referral tooling
phone/email verification as referral eligibility
multi-account/device anti-abuse
reward maturity windows
reward clawbacks
campaign-specific referral rules
```

The current reward is intentionally simple. Stronger anti-abuse eligibility can later be layered on top of the persisted relationship and XP ledger without changing the core relation model.

## Local verification required before DONE

The user must verify locally:

```text
1. migration 012_create_referrals.sql applies successfully
2. registration without referral still works unchanged
3. referral field appears only during account creation and after Repeat Password
4. invalid-format referral -> localized validation error and no account created
5. nonexistent referral username -> localized error and no account created
6. valid username-only referral signup -> new user starts with 1500 XP
7. valid email-based referral signup -> new user starts with 2500 XP
8. referrer receives exactly +1000 XP for that persisted referral
9. referrals row stores correct referrer_user_id / referred_user_id / referral_username_used
10. ledger contains exactly one referral_joined +500 event for referred user
11. ledger contains exactly one referral_reward +1000 event for referrer
12. direct username self-referral is rejected
13. suspended referrer is rejected
14. EN/FA registration copy and errors render correctly
15. Docker restart preserves referral relation and XP
16. final pnpm generate succeeds
```

Do not mark Milestone 16 DONE until the user explicitly confirms local verification.
