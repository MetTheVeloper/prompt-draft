# Milestone 21B — Referral Growth Activation

Status: **SELECTED / CAPABILITY AUDIT COMPLETE / IMPLEMENTATION STARTED**

Parent:

```text
Milestone 21 — Growth Foundation
```

Predecessor:

```text
Milestone 21A — Behavioral Analytics Foundation
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

Mandatory inherited source:

```text
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
```

## 1. Goal

Turn the already-correct referral relation into a usable growth loop without creating another referral identity, reward ledger, or account system.

Desired user journey:

```text
existing user has username
  -> copies a canonical referral URL
  -> recipient opens URL
  -> existing /login flow receives referral username
  -> if recipient creates a new account, existing referralUsername field is already filled
  -> backend performs the existing Milestone 16 validation
  -> referrals row remains authoritative conversion truth
  -> existing trigger grants +500 XP to referred user and +1000 XP to referrer
```

## 2. Existing capability audit

### COMPLETE / reuse directly

```text
POST /api/auth/register
optional referralUsername request field
same username normalization as Auth
case-insensitive active-referrer resolution
one referrer per referred account
self-referral prevention
atomic account + referral write
referrals table as authoritative relation
referral_joined +500 score event
referral_reward +1000 score event
idempotent score ledger
GET /api/auth/me referrals.referredCount
Profile Menu invited-user count
localized manual referral field in registration
product_analytics_events + POST /api/analytics/events from 21A
anonymous analytics identity/session from useProductAnalytics()
```

### GAP / implement in 21B

```text
canonical shareable referral URL
URL -> existing referralUsername registration prefill
referral-link landing analytics
user-facing Copy referral link action
simple referral funnel verification/read queries
```

### DEFERRED unless evidence requires it

```text
random/generated invite codes
campaign-specific referral codes
multi-device/account anti-abuse
reward maturity windows
reward clawback
referral ranking/leaderboard
full admin referral tooling
complex attribution windows
```

## 3. Canonical referral URL V1

Use the existing username as the only referral identity.

Canonical V1 shape:

```text
/login?ref=<normalizedUsername>
```

Example:

```text
/login?ref=grass
```

Why:

- no new code namespace;
- username already has stable validation/lookup semantics;
- registration already accepts `referralUsername`;
- the URL stays compatible with the existing static frontend;
- no backend redirect/link entity is required for the experiment.

The URL parameter is an input hint only. It is not authoritative attribution. Registration still sends `referralUsername` to the existing backend, which re-validates the current active user and writes the canonical UUID relation.

## 4. Registration prefill contract

`app/pages/login.vue` should:

1. read `route.query.ref` on the client;
2. normalize lowercase/trim;
3. accept only the existing username grammar:
   `^[a-z0-9._-]{3,64}$`;
4. preserve the value while the login page transitions from identifier step to registration step;
5. prefill the already-existing `referralUsername` field;
6. keep the field editable;
7. never bypass backend validation;
8. ignore malformed `ref` values rather than treating them as accepted referrals.

The referral value should not be erased by the normal `submitIdentifier()` transition into account creation.

## 5. Referral landing analytics

Add a dedicated observational event using the 21A analytics primitive:

```text
referral_link_open
```

Meaning:

> A browser session opened `/login` with a valid-looking referral username parameter.

Resource:

```text
referral_username:<normalizedUsername>
```

This event is intentionally anonymous-capable and may later be associated with an authenticated user through the normal analytics identity model.

Important:

```text
referral_link_open != successful referral
```

Authoritative successful referral conversion remains:

```text
referrals row
```

Do not award XP from analytics.

## 6. Analytics validation extension

The 21A event endpoint currently validates Prompt Archive resources as positive numeric IDs.

21B should extend the event-rule validation model so resource ID semantics are event-specific:

```text
prompt_archive_* -> positive numeric public ID
referral_link_open -> normalized username
```

Do not weaken the endpoint into arbitrary resource strings.

For `referral_link_open` V1, no arbitrary metadata is required. Path/locale/anonymous/session identity are already part of the common analytics envelope.

## 7. Copy referral link surface

Once the URL/prefill contract is verified, expose a compact action from the existing authenticated Profile Menu rather than creating a new referral dashboard.

Requirements:

```text
requires current user.username
uses current site origin + /login?ref=<username>
copy to clipboard
localized EN/FA label/result
keeps existing invited-user count
no new backend endpoint required
```

A user without username cannot have a canonical username referral URL; the existing progressive profile-completion system should be reused rather than inventing an alternate code.

## 8. Conversion / funnel truth

V1 funnel sources:

```text
landing attempts       -> product_analytics_events where event_name=referral_link_open
successful referrals   -> referrals
reward issuance        -> user_score_events referral_joined/referral_reward
```

These datasets have different authority and must not be collapsed into one table.

## 9. Anti-abuse boundary

Current Milestone 16 protections remain:

```text
active referrer required
one referrer per account
no direct self-referral
case-insensitive canonical username resolution
requested invalid referral aborts signup
atomic referral relation + reward trigger
```

Do not add fingerprinting or speculative device policing in the first Growth experiment.

If actual abuse appears, extend eligibility rules around the authoritative relation/reward transaction rather than trusting analytics identities.

## 10. No schema migration required for first 21B slice

The first 21B activation slice reuses:

```text
users
referrals
user_score_events
product_analytics_events
```

Migration `020` is already generic enough for the new observational event. Therefore no `021` migration should be created merely to activate the referral URL flow.

## 11. First implementation sequence

```text
B1 close 21A verification docs
B2 add/refine referral_link_open analytics validation
B3 extend useProductAnalytics event/resource typing
B4 parse + prefill ?ref= in /login
B5 emit one referral_link_open per valid referral landing lifecycle
B6 verify URL prefill + analytics persistence
B7 add Profile Menu Copy referral link action
B8 verify real new-account conversion still creates canonical referrals row and existing rewards
B9 pnpm generate
B10 mark 21B DONE only after local user acceptance
```

## 12. Acceptance criteria

21B is complete when local verification proves:

```text
/login?ref=<validUsername> preserves/prefills the existing registration referral field
malformed ref parameter is not treated as a valid referral
referral_link_open persists through the existing analytics endpoint
landing event does not grant score and does not create a referrals row
copy-referral-link action creates the canonical URL
real signup from a referral link still uses POST /api/auth/register referralUsername
backend remains authoritative for active-user/self-referral/uniqueness validation
successful signup creates exactly one referrals row
existing +500 / +1000 reward behavior remains intact
invited-user count still derives from referrals
no second referral-code table/system exists
pnpm generate succeeds
```

## 13. Hard rules

```text
DO NOT create random referral codes in 21B.
DO NOT use analytics as referral conversion authority.
DO NOT award XP from referral_link_open.
DO NOT create a second reward ledger.
DO NOT bypass backend referral validation because the URL was generated by Prompt Draft.
DO NOT add a separate referral dashboard before the small activation loop is proven useful.
```
