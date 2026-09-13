# Expiring / Promotional Goin V1

Status: **IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## 1. Purpose

Prompt Draft must be able to issue short-lived promotional Goin without turning every campaign reward into permanent money supply.

Example:

```text
user permanent balance = 100 Goin
daily campaign reward  = 5 Goin
reward expiry           = 24 hours

if user spends 3 promotional Goin before expiry:
  remaining promotional Goin = 2
  expiry removes only 2
  permanent balance remains 100
```

This is an extension of the existing Economy ledger, not a replacement wallet.

## 2. Hard accounting rules

```text
user_economy_events remains the authoritative Goin event ledger
no users.goin_balance column
no campaign wallet
no promotional wallet
historical credits remain permanent
expires_at = NULL means permanent credit
expires_at != NULL is allowed only for positive credits
browser/client never decides authoritative expiry or amount
all debits use the same canonical per-user lock
```

The former V1 shorthand that spendable balance is always plain `SUM(user_economy_events.unit_delta)` is amended for expiring credits.

For an Economy that contains expiring credits:

```text
raw ledger balance
  = SUM(user_economy_events.unit_delta)

expired remaining
  = unspent remainder of credits whose expires_at <= as-of time

effective spendable balance
  = raw ledger balance - expired remaining
```

The event ledger plus expiry contract plus consumption allocations together are the authoritative accounting source.

## 3. Why an allocation table is required

A timestamp alone cannot safely implement expiry.

Example:

```text
+100 permanent
+5 expires tomorrow
-3 spend
```

Without provenance, the system cannot know whether the `-3` consumed permanent or expiring Goin. Blindly subtracting `5` tomorrow could burn permanent Goin.

V1 therefore adds:

```text
user_economy_expiring_credit_allocations
```

This is not a second ledger and stores no balance. It records only which part of a debit consumed which expiring credit lot.

Permanent funding remains implicit: any debit amount not allocated to an expiring lot came from the permanent pool.

## 4. Spend policy — FEFO

Debits consume Goin in this order:

```text
1. active expiring credits, earliest expires_at first
2. for equal expiry: oldest created_at first
3. for an exact tie: event id order
4. permanent Goin for any remaining debit
```

This is FEFO: First Expiring, First Out.

The policy protects the user from unnecessarily losing promotional value while preserving one visible Goin unit.

## 5. Expiry semantics

Expiry is deadline-driven and does not require a cron job or background burn worker.

At/after the deadline, the unspent remainder of that credit is no longer part of spendable balance.

Example:

```text
credit = +5, expires at T
allocated/spent before T = 3
remaining at T = 2
lifetimeExpired contribution after T = 2
```

If all 5 were consumed before T, expiry removes 0.
If none were consumed, expiry removes 5.

This design avoids scheduler drift, late burns, double-burn retries, and accidentally burning permanent Goin after a promotional lot was already spent.

## 6. Schema

Migration:

```text
backend/sql/030_expiring_promotional_goin.sql
```

Adds:

```text
user_economy_events.expires_at TIMESTAMPTZ NULL
```

Constraint:

```text
expires_at IS NULL
OR (
  unit_delta > 0
  AND expires_at > created_at
)
```

Adds allocation table:

```text
user_economy_expiring_credit_allocations
  user_id
  debit_event_id
  credit_event_id
  unit_amount
  created_at

PRIMARY KEY (debit_event_id, credit_event_id)
```

DB validation guarantees:

```text
debit and credit belong to the same user
debit event is negative
credit event is positive and expiring
expired credit cannot fund a later debit
total allocations cannot exceed debit amount
total allocations cannot exceed credit amount
```

Allocation INSERT validation also takes the canonical user row lock so concurrent allocation writes share the same serialization boundary as Economy mutations.

The allocation table rejects UPDATE through a DB trigger. DELETE is not globally rejected because existing account deletion semantics cascade users -> economy data.

## 7. Effective balance read model

Migration 030 creates:

```text
user_economy_balance_state
```

Fields:

```text
user_id
balance
permanent_balance
expiring_balance
lifetime_issued
lifetime_spent
lifetime_expired
transaction_count
next_expiry_at
```

`balance` is the amount the user can currently spend. `permanent_balance` is the remaining non-expiring pool. `expiring_balance` is the still-active unspent promotional pool. `lifetime_expired` is the amount of promotional Goin that reached expiry unspent.

Growth/operator outstanding and holder counts must use this expiry-aware read model instead of raw `SUM(unit_delta)`.

## 8. Transaction-aware Economy primitive

New internal core:

```text
backend/src/economyCore.mjs
recordUserEconomyEventInTransaction(client, input, options)
```

The existing public helper remains available:

```text
backend/src/economy.mjs
recordUserEconomyEvent(input)
```

It now wraps the transaction-aware primitive.

Positive credit input may include:

```text
expiresAt: timestamp | null
```

Negative events cannot have `expiresAt`.

For a debit, one DB transaction performs:

```text
lock user
check idempotency
validate provenance
calculate effective balance
reject overspend against effective balance
insert debit event
load active expiring lots in FEFO order
insert expiring-credit allocations
return updated effective Economy state
```

This transaction-aware primitive is also the required Economy boundary for Campaign CE2 reward settlement.

## 9. Existing Prompt Archive sink

Prompt Archive unlock previously inserted its own negative Economy event directly. That path must not bypass allocation logic.

V1 therefore routes Prompt Archive charging through the same transaction-aware Economy primitive while preserving the same durable unlock table, pricing policy, user lock, idempotency semantics and no-double-charge behavior.

As a result, an Archive unlock spends expiring Goin first when available.

## 10. Existing issuance remains backward compatible

Existing score-driven issuance from migration 023 does not supply `expires_at`, so existing sources remain permanent by default:

```text
account_created
profile_email_added
referral_joined
referral_reward
```

No historical credit is retroactively given an expiry. Campaign or other future issuance must opt in explicitly.

## 11. Campaign Engine contract

Campaign Engine does not receive a separate balance or wallet. A Campaign reward still reconciles to exactly one existing Economy event.

Future Campaign reward definitions may deliberately select an expiry policy, for example:

```text
amount = 5 Goin
expires after = 24 hours
```

Campaign budget and Goin expiry solve different supply risks:

```text
campaign reward budget -> caps how much may be issued
expiry                  -> caps how long promotional supply can remain outstanding
```

CE2 must use the transaction-aware Economy primitive instead of opening a nested independent Economy transaction.

## 12. Refund / transfer anti-laundering invariant

No refund or Creator-transfer implementation is added in this slice, but future work must preserve this rule:

> Promotional provenance must not be washed into permanent Goin.

A future refund must preserve the original permanent/promotional composition and original expiry where still meaningful, or use an explicitly stricter policy.

A future marketplace/Creator settlement must also decide how promotional-funded purchase value propagates before cash-out is enabled.

## 13. Product/API compatibility

Existing user-visible unit remains `goin`.

Existing Economy state keeps `balance` and adds additive detail:

```text
permanentBalance
expiringBalance
lifetimeExpired
nextExpiryAt
```

Economy history events add `expiresAt`.

No frontend change is required for V1 correctness because existing consumers may continue to use `economy.balance`.

## 14. Verification scope

Changed service scope:

```text
backend + SQL only
```

Smallest verification:

```powershell
pnpm api
docker compose exec api npm run db:schema
docker compose exec api node --test src/economyExpiringGoin.test.mjs
```

Optional schema evidence:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d user_economy_expiring_credit_allocations"
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d+ user_economy_balance_state"
```

No frontend rebuild is required. Do not use `pnpm stack` for reassurance.

## 15. Acceptance focus

```text
migration 030 reruns cleanly
historical/permanent Goin remains permanent
partial promo spend expires only unused remainder
expired Goin cannot satisfy affordability checks
FEFO consumes earliest expiry first
mixed debit falls through to permanent balance correctly
idempotent retry does not duplicate allocation
Prompt Archive debit uses the shared primitive
operator outstanding excludes expired unspent Goin
no new wallet/balance source exists
Campaign CE2 can join Economy issuance to its own transaction
```

Do not mark this slice DONE until founder-local evidence is clean and the founder sees no issue in the supplied logs.
