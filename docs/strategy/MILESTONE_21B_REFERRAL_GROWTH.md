# Milestone 21B — Referral Growth Activation

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

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

Canonical verification record:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## 1. Goal

Turn the already-correct referral relation into a usable growth loop without creating another referral identity, reward ledger, or account system.

Verified user journey:

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

### COMPLETE / reused directly

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

### GAPS CLOSED IN 21B

```text
canonical shareable referral URL
URL -> existing referralUsername registration prefill
referral-link landing analytics
user-facing Copy referral link action
simple referral funnel verification/read queries
```

### DEFERRED unless evidence requires it

```text
random/generated referral codes
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

Verified local example:

```text
http://localhost:3030/login?ref=grass
```

Why:

- no new code namespace;
- username already has stable validation/lookup semantics;
- registration already accepts `referralUsername`;
- the URL stays compatible with the existing static frontend;
- no backend redirect/link entity is required for the experiment.

The URL parameter is an input hint only. It is not authoritative attribution. Registration still sends `referralUsername` to the existing backend, which re-validates the current active user and writes the canonical UUID relation.

## 4. Registration prefill contract

`app/pages/login.vue`:

1. reads `route.query.ref` on the client;
2. normalizes lowercase/trim;
3. accepts only the existing username grammar:
   `^[a-z0-9._-]{3,64}$`;
4. preserves the value while the login page transitions from identifier step to registration step;
5. prefills the already-existing `referralUsername` field;
6. keeps the field editable;
7. never bypasses backend validation;
8. ignores malformed `ref` values rather than treating them as accepted referrals.

The referral value is not erased by the normal `submitIdentifier()` transition into account creation.

## 5. Referral landing analytics

Dedicated observational event:

```text
referral_link_open
```

Meaning:

> A browser session opened `/login` with a valid-looking referral username parameter.

Resource:

```text
referral_username:<normalizedUsername>
```

Important:

```text
referral_link_open != successful referral
```

Authoritative successful referral conversion remains:

```text
referrals row
```

XP is never awarded from analytics.

## 6. Analytics validation extension

The 21A analytics endpoint now uses event-specific resource semantics:

```text
prompt_archive_*    -> positive numeric public ID
referral_link_open  -> normalized username
```

The endpoint was not weakened into arbitrary resource strings.

For `referral_link_open` V1, no arbitrary metadata is accepted. Path/locale/anonymous/session identity remain part of the common analytics envelope.

## 7. Copy referral link surface

The authenticated Profile Menu exposes a compact Copy referral link action when the account has a username.

Implemented behavior:

```text
requires current user.username
uses current site origin + /login?ref=<username>
clipboard API with DOM fallback
localized EN/FA result state
keeps existing invited-user count
no new backend endpoint
```

A user without username does not receive an alternate generated code. Existing progressive profile completion remains the route to acquiring a username.

## 8. Conversion / funnel truth

V1 funnel sources remain separate:

```text
landing attempts       -> product_analytics_events where event_name=referral_link_open
successful referrals   -> referrals
reward issuance        -> user_score_events referral_joined/referral_reward
```

These datasets have different authority and are not collapsed into one table.

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

21B did not add fingerprinting or speculative device policing.

If actual abuse appears, eligibility rules should be extended around the authoritative relation/reward transaction rather than trusting analytics identities.

## 10. Schema result

No `021` migration was created for 21B.

21B reused:

```text
users
referrals
user_score_events
product_analytics_events
```

Migration number `021` therefore remains available for the next real schema change.

## 11. Completed implementation sequence

```text
B1 close 21A verification docs                                      DONE
B2 add/refine referral_link_open analytics validation              DONE
B3 extend useProductAnalytics event/resource typing                DONE
B4 parse + prefill ?ref= in /login                                 DONE
B5 emit one referral_link_open per valid referral landing lifecycle DONE
B6 verify URL prefill + analytics persistence                      DONE
B7 add Profile Menu Copy referral link action                      DONE
B8 verify real new-account conversion + existing rewards           DONE
B9 pnpm generate                                                   PASS
B10 mark 21B DONE after local user acceptance                      DONE
```

## 12. Acceptance result

Locally verified:

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

Verified conversion example:

```text
referrer = grass
referred = m010
referral = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
grass reward = +1000
m010 joined reward = +500
Invited users = 3 -> 4
```

## 13. Hard rules carried forward

```text
DO NOT create random referral codes without a later explicit need.
DO NOT use analytics as referral conversion authority.
DO NOT award XP from referral_link_open.
DO NOT create a second reward ledger.
DO NOT bypass backend referral validation because the URL was generated by Prompt Draft.
DO NOT add a separate referral dashboard before evidence justifies it.
```

Milestone 21B is closed. Continue with:

```text
Milestone 21C — User Preferences & Personalized Discovery
```
