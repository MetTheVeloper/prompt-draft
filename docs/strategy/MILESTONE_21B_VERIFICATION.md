# Milestone 21B — Referral Growth Activation Verification

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21B_REFERRAL_GROWTH.md
```

Implementation handoff:

```text
docs/strategy/MILESTONE_21B_IMPLEMENTATION.md
```

## Verified product loop

The user completed the full Referral Growth Activation loop locally on 2026-09-06.

Verified flow:

```text
existing referrer username = grass
Profile Menu -> Copy referral link
copied URL = http://localhost:3030/login?ref=grass
signed-out recipient opens copied URL
existing registration referral field is prefilled with grass
new account m010 completes normal registration
existing Milestone 16 backend creates the canonical referral relation
existing score trigger grants both rewards exactly once
referrer's invited-user count refreshes from referrals
pnpm generate passes
```

## Landing attribution verification

The first 21B slice was verified before conversion.

Observed analytics row:

```text
event_name    = referral_link_open
user_id       = NULL
resource_type = referral_username
resource_id   = grass
path          = /login?ref=grass
locale        = en
metadata      = {}
```

Verified behavior:

```text
valid ?ref= username is normalized and preserved
registration referral field is prefilled
field remains editable
Change Identifier does not lose URL attribution
malformed referral URL is ignored
landing analytics remains observational only
landing analytics does not create a referral relation or award XP
```

## Copy-link verification

The Profile Menu action was verified visually and functionally.

Verified copied local URL:

```text
http://localhost:3030/login?ref=grass
```

The action therefore uses the current browser origin and the canonical V1 path:

```text
/login?ref=<normalizedUsername>
```

No generated/random referral-code namespace was introduced.

## Canonical referral relation verification

After creating the new account `m010` from the copied link, PostgreSQL returned the new canonical relation:

```text
referral id              = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
referral_username_used   = grass
referrer_username        = grass
referred_username        = m010
```

This proves successful referral conversion still comes from the existing `referrals` relation rather than analytics or client state.

## Reward verification

For referral:

```text
5f63047f-6d5e-40dd-a2b9-00460a57c8d3
```

exactly the expected existing score events were observed:

```text
grass
  event_type      = referral_reward
  points          = +1000
  source_type     = referral
  source_id       = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
  idempotency_key = referral_reward:v1:5f63047f-6d5e-40dd-a2b9-00460a57c8d3

m010
  event_type      = referral_joined
  points          = +500
  source_type     = referral
  source_id       = 5f63047f-6d5e-40dd-a2b9-00460a57c8d3
  idempotency_key = referral_joined:v1:5f63047f-6d5e-40dd-a2b9-00460a57c8d3
```

No second reward ledger or analytics-based reward path exists.

## Profile read-model verification

The referrer Profile Menu refreshed from:

```text
Invited users = 3
```

to:

```text
Invited users = 4
```

after the successful signup.

The referrer's displayed XP also reflected the existing +1000 reward. The count remains derived from the authoritative `referrals` relation through the existing Auth read model.

## Release verification

The user confirmed:

```powershell
pnpm generate
```

completed successfully after the 21B changes.

## 21B acceptance result

All 21B acceptance gates are satisfied:

```text
canonical username referral URL exists
Profile Menu copies the canonical URL
valid referral URL prefills the existing registration field
malformed referral URL is ignored
referral_link_open analytics persists for valid landings
landing analytics remains non-authoritative
real signup uses the existing /api/auth/register referralUsername contract
backend referral validation remains authoritative
successful conversion creates exactly one canonical referrals row
referred user receives +500 exactly once
referrer receives +1000 exactly once
invited-user count increases from referrals
no second referral-code/auth/reward system exists
pnpm generate passes
```

Milestone 21B is closed.

Next phase:

```text
Milestone 21C — User Preferences & Personalized Discovery
```
