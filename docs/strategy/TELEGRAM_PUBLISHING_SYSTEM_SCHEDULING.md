# Telegram Publishing System — Scheduling Decision

Status: **FOUNDER-DIRECTION APPROVED / CE4 ACCEPTED / TG1-TG2 ACCEPTED / TG3 FINAL ACCEPTANCE NEXT**

Date: 2026-09-14

Branch:

```text
feature/growth-foundation
```

Founder-approved architectural direction:

```text
Telegram = Preview + CTA
Mini App = Entry point
Prompt Draft = all business logic
```

This document originally recorded why Telegram implementation was scheduled as a CE4.5 bridge after CE4 and before CE5. That scheduling decision has now been executed through TG1/TG2 and TG3 implementation. The historical rationale remains authoritative; current execution status is governed by `CAMPAIGN_ENGINE_STATUS.md` and the TG implementation checkpoints.

## 1. Current execution state

```text
CE1 Foundation                 -> DONE / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / ACCEPTED
CE2.1 Runtime Core             -> DONE / ACCEPTED
CE2.2 Actions / Attempts       -> DONE / ACCEPTED
CE3 Promotion Surfaces         -> DONE / ACCEPTED
CE4 Custom Game + Chance Wheel -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13

CE4.5 Shared Telegram Publishing
  TG1 backend foundation       -> DONE / ACCEPTED 2026-09-13
  TG2 Composer + /manage/telegram -> DONE / ACCEPTED 2026-09-13
  TG3 Prompt Archive adapter   -> IMPLEMENTED + HARDENED / FINAL TG3 ACCEPTANCE PENDING
  Archive management/images    -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14

CE5 /manage/marketing + TG4    -> NEXT AFTER TG3 ACCEPTANCE
CE6 Measurement                -> NOT STARTED
CE7 Final Verification         -> NOT STARTED
```

Current canonical status:

```text
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
```

TG3 current contract:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Archive operator acceptance:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

## 2. Why CE4.5 remains the correct bridge

The sequencing decision remains valid:

```text
CE3
  -> accepted on-site Campaign promotion + attribution contracts

CE4
  -> accepted public Campaign entry experience
  -> accepted Custom Game / Chance Wheel trust boundary
  -> stable Campaign entry target

CE4.5 — Shared Telegram Publishing Foundation
  -> TG1 backend publisher + persistence + authorization/audit
  -> TG2 TelegramPostComposer + /manage/telegram
  -> TG3 Prompt Archive adapter

CE5 — /manage/marketing
  -> TG4 Campaign adapter + Telegram attribution integration

CE6
  -> Campaign reporting consumes Telegram attribution through existing analytics/reporting

pre-CE7 hardening
  -> publication history / retry / reconciliation hardening as required

CE7
  -> aggregate Campaign + Telegram integration verification
```

The reason for doing Telegram before CE5 was to prevent `/manage/marketing` from inventing a temporary Campaign-specific Telegram publisher/composer and then refactoring it later. That objective has been met: TG1 and TG2 are accepted and TG3 uses the same shared path.

## 3. Shared subsystem boundary

Mandatory architecture remains:

```text
/manage/archive ───────┐
                       │ Prompt draft builder
/manage/marketing ─────┼──> TelegramPostComposer
                       │ Campaign draft builder
/manage/telegram ──────┘ Manual draft
                              |
                              v
                    shared Telegram Publishing API
                              |
                              v
                       TelegramPublisher
```

There must be exactly one publishing subsystem.

Prompt Archive, Campaign Engine and manual publishing are producers of a shared Telegram post draft. They must not contain duplicated Telegram Bot API logic, persistence, retry state or delivery authority.

Campaign Engine itself remains Telegram-agnostic and continues to own Campaign business logic.

## 4. TG1 — shared backend foundation — ACCEPTED

TG1 established:

```text
exact-super-admin server authorization
backend-only Telegram credentials
shared Telegram post validation
telegram_publications shared ledger
publication attempts/messages persistence
payload snapshot
idempotent publish identity
Telegram API adapter/publisher
audit integration
normalized failed / delivery_unknown states
manual retry-safe foundation
Mini App/deep-link routing contract
```

Canonical record:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
```

Publication persistence is source-neutral and permits multiple publications per source item. Prompt/Campaign rows are not Telegram delivery ledgers.

## 5. TG2 — shared Composer + /manage/telegram — ACCEPTED

TG2 established one reusable `TelegramPostComposer` following the existing Manage design system and UI implementation guidelines.

It supports the shared composition/publication path used by manual publishing, TG3 Prompt Archive and future TG4 Campaign publishing.

Canonical record:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
```

The browser composes a draft; only the backend publishes to Telegram.

## 6. TG3 — Prompt Archive adapter — CURRENT

TG3 connects `/manage/archive` to the same Composer and publisher.

Current source-of-truth behavior is documented in:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Current Prompt prefill includes public-safe bilingual Prompt presentation, public persisted images, hashtags, Prompt Mini App CTA, fixed community direct-HTTPS CTA and model metadata. Protected Prompt body/unlock/Goin behavior remains inside Prompt Draft.

Existing `telegram_message_id` / `telegram_url` Archive metadata remain compatibility/source fields; they are not the shared publication ledger.

The Archive management/image hardening discovered during TG3 is separately accepted:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
Status -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
```

TG3 itself still needs the final Telegram-specific founder-local acceptance evidence defined in its own checkpoint. Archive image verification must not be used as synthetic proof for unverified Telegram-specific behavior.

## 7. CE5 Telegram integration — TG4

TG4 begins with CE5 only after TG3 is accepted and CE4.5 is closed.

Campaign source code may build a Telegram draft from the safe public Campaign projection, but publication always goes through the shared publisher.

Campaign CTA entry must preserve accepted Campaign attribution semantics, conceptually:

```text
source    = telegram
medium    = channel
campaign  = <campaign identifier>
placement = channel_post
```

Exact values/transport must be re-audited against the accepted CE3 attribution contract at CE5 implementation time.

Telegram is not a Campaign mechanic and must not decide:

```text
eligibility
participation
attempt availability
outcome/winner
reward amount
reward expiry
reward grant
Goin state
```

## 8. Automatic Prompt publishing timing

Automatic publishing of newly published Prompts is still **not a CE4.5 or CE5 blocker**.

TG5 remains deferred until the manual/shared subsystem is accepted and the core Campaign Engine reaches its intended acceptance boundary, unless the founder explicitly promotes it earlier.

Reason:

```text
automatic delivery introduces durable outbox/job/retry concerns
Telegram failure must never fail Prompt publication
manual/shared publication architecture should be proven first
```

When implemented, automatic publishing must call the same backend publisher as manual Prompt/Campaign posts.

## 9. Reporting and retry timing

Telegram must not create a second analytics system.

CE6 may consume Telegram acquisition through existing Product Analytics + Campaign reporting contracts.

Operational publication history and retry/reconciliation should be hardened before CE7 if the manual Telegram subsystem is part of the accepted V1 deployment surface.

Automatic Prompt-delivery job orchestration may remain a later independent slice.

## 10. Security invariants

Frozen direction:

```text
Telegram = public preview + CTA only.
Mini App = routing/entry surface only.
Prompt Draft = authoritative business logic.
Bot token remains backend-only.
Publishing is super-admin only server-side.
Telegram user identity is not automatically Prompt Draft identity.
Mini App init/user data must be validated server-side.
No Prompt body, balance, reward decision or sensitive user data goes into CTA/deep-link payloads.
No Campaign reward/eligibility logic is implemented in Telegram.
No second wallet, unlock system, analytics pipeline or Campaign engine is introduced.
All privileged publication mutations are auditable where appropriate.
```

## 11. Implementation-time mandatory re-audit

Before TG4 / CE5 implementation, re-read the latest branch and at minimum:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

Also inspect the then-current implementations of:

```text
/manage/archive
/manage/marketing
/manage/telegram
Manage section registration
authorization / super-admin guards
admin_audit_log patterns
Prompt public projection and publication lifecycle
Prompt unlock / Economy services
Campaign public entry + attribution
Arvan media/storage
all existing Telegram-related Prompt/Archive fields
```

Then verify current official Telegram Bot API / Mini App contracts if CE5/TG4 changes depend on them.

## 12. Verification discipline

This scheduling update is documentation-only and requires no Docker rebuild.

Future slices must use the project time-first workflow:

```text
inspect exactly changed services
-> smallest focused tests
-> API rebuild only for backend changes
-> frontend rebuild only for UI changes
-> both only when both actually changed
-> SQL schema apply only when a migration exists
-> never default to pnpm stack
```

## 13. Current execution order

```text
TG3 final Telegram-specific founder acceptance
  -> record TG3 ACCEPTED
  -> CE4.5 COMPLETE

then

CE5 — /manage/marketing
  -> TG4 Campaign adapter using shared TelegramPostComposer + TG1 publisher
```

This ordering is authoritative unless the founder explicitly changes it later.