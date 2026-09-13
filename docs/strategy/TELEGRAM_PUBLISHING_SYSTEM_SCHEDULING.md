# Telegram Publishing System — Scheduling Decision

Status: **FOUNDER-DIRECTION APPROVED / SCHEDULED / IMPLEMENTATION DEFERRED TO CE4.5 BRIDGE**

Date: 2026-09-13

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

This document records the execution timing decision for the founder-provided `TELEGRAM_PUBLISHING_SYSTEM_HANDOFF.md` direction. It does not authorize immediate Telegram implementation.

## 1. Current Campaign Engine reality used for scheduling

Current accepted branch state:

```text
CE1 Foundation                 -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / VERIFIED / ACCEPTED
CE2.1 Runtime Core             -> DONE / VERIFIED / ACCEPTED
CE2.2 Actions / Attempts       -> DONE / VERIFIED / ACCEPTED
CE3 Promotion Surfaces         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE4 Custom Game + Chance Wheel -> NEXT
CE5 /manage/marketing          -> NOT STARTED
CE6 Measurement               -> NOT STARTED
CE7 Final Verification         -> NOT STARTED
```

Current repository facts relevant to Telegram scheduling:

```text
/manage/archive exists and already contains legacy/current Telegram message metadata fields.
/manage/marketing does not exist yet.
/manage/telegram does not exist yet.
app/config/manage.ts does not yet register marketing or telegram sections.
Campaign public/runtime API contracts exist.
CE3 on-site promotion + bounded attribution handoff is accepted.
The Nuxt /campaign/:slug entry surface and game/wheel experience still belong to CE4.
Backend authorization already has super_admin wildcard semantics and Campaign permissions.
```

Therefore Telegram still correctly waits until Campaign entry/mechanic surfaces are stable.

## 2. Scheduling decision

Telegram publishing will **not** be implemented inside CE4 and did not interrupt CE3.

The shared Telegram foundation enters as a dedicated bridge slice:

```text
CE3
  -> accepted on-site Campaign promotion + attribution contracts

CE4
  -> Campaign public entry experience
  -> custom game / chance wheel authority
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
  -> manual publication history / retry / reconciliation hardening as required

CE7
  -> aggregate Campaign + Telegram integration verification
```

This ordering is authoritative unless the founder explicitly changes it later.

## 3. Why CE4.5 is the correct entry point

### Not CE3

CE3 owns Prompt Draft-rendered promotion surfaces such as header/floating/modal/dashboard placements.

Telegram is an external distribution channel. It shares discovery/entry concepts but must not be forced into the same rendering/placement model.

CE3 established bounded on-site attribution semantics that later external entry channels can align with. It correctly did not contain Telegram Bot API or Telegram publication persistence.

### Not before CE4

A Campaign Telegram CTA must point into a stable Prompt Draft Campaign entry experience.

CE4 is where the public Campaign entry, custom-game trust boundary and chance-wheel authority become concrete. Building Telegram before CE4 acceptance would encode temporary entry assumptions.

### Before CE5

CE5 creates `/manage/marketing`, the first real Campaign operator surface.

The shared Telegram foundation must exist before Campaign Telegram UI is added so CE5 can consume the same `TelegramPostComposer` and backend publisher from day one.

Do not build a temporary Campaign-specific Telegram modal/publisher in CE5 and refactor it later.

## 4. Shared subsystem boundary

Mandatory architecture:

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

Prompt Archive, Campaign Engine and manual publishing are producers of a shared Telegram post draft. They must not contain duplicated Telegram Bot API logic.

Campaign Engine itself remains Telegram-agnostic and continues to own only Campaign business logic.

## 5. CE4.5 target scope

### TG1 — Shared backend foundation

Implement only after re-auditing the then-current branch and official Telegram Bot API / Mini App contracts.

Expected responsibilities:

```text
super-admin-only server authorization
backend-only Telegram credentials
shared Telegram post validation
publication persistence / payload snapshot
idempotent publish identity
Telegram API adapter/publisher
audit integration
normalized failure state
manual retry-safe foundation
Mini App/deep-link routing contract
```

Telegram publication persistence must be source-neutral and allow multiple publications per source item.

Do not store publication authority only on Prompt or Campaign rows.

### TG2 — Shared Composer + /manage/telegram

Create one reusable `TelegramPostComposer` following the existing Manage design system and UI implementation guidelines.

It should support at minimum:

```text
single/multiple media
caption/content
one or more supported CTAs
Prompt Draft entry point per CTA
preview
publish action
```

The browser composes a draft; only the backend publishes to Telegram.

`/manage/telegram` is super-admin only and starts as the manual/custom publishing surface plus useful publication history.

### TG3 — Prompt Archive adapter

`/manage/archive` opens the same Composer with Prompt-derived prefill.

Existing `telegram_message_id` / `telegram_url` Archive metadata must be audited and reconciled as legacy/source metadata. Do not create a second competing per-Prompt publication model or assume those fields can represent future multiple publications.

Prompt body/unlock/Goin behavior stays inside Prompt Draft and must never be reimplemented in Telegram.

## 6. CE5 Telegram integration

TG4 is integrated while building `/manage/marketing`, after the shared foundation already exists.

Campaign source code may build a Telegram draft from the safe public Campaign projection, but publication always goes through the shared publisher.

Campaign CTA entry must preserve accepted Campaign attribution semantics, conceptually:

```text
source    = telegram
medium    = channel
campaign  = <campaign identifier>
placement = channel_post
```

Exact values/transport are re-audited against the accepted CE3 attribution contract at implementation time.

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

## 7. Automatic Prompt publishing timing

Automatic publishing of newly published Prompts is explicitly **not a CE4.5 or CE5 blocker**.

TG5 remains deferred until the manual/shared subsystem is accepted and the core Campaign Engine reaches its acceptance boundary, unless the founder explicitly promotes it earlier.

Reason:

```text
automatic delivery introduces durable outbox/job/retry concerns
Telegram failure must never fail Prompt publication
manual/shared publication architecture should be proven first
```

When implemented, automatic publishing must call the same backend publisher as manual Prompt/Campaign posts.

## 8. Reporting and retry timing

Telegram must not create a second analytics system.

CE6 may consume Telegram acquisition through existing Product Analytics + Campaign reporting contracts.

Operational publication history and retry/reconciliation should be hardened before CE7 if the manual Telegram subsystem is part of the accepted V1 deployment surface.

Automatic Prompt-delivery job orchestration may remain a later independent slice.

## 9. Security invariants

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

## 10. Implementation-time mandatory re-audit

Before TG1 implementation, re-read the latest branch and at minimum:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
this scheduling document
```

Also inspect the then-current implementations of:

```text
/manage/archive
/manage/marketing
Manage section registration
authorization / super-admin guards
admin_audit_log patterns
Prompt public projection and publication lifecycle
Prompt unlock / Economy services
Campaign public entry + attribution
Arvan media/storage
all existing Telegram-related Prompt/Archive fields
```

Then verify current official Telegram Bot API / Mini App deep-link, media, init-data and security constraints before freezing implementation contracts.

## 11. Verification discipline

This scheduling update is documentation-only and requires no Docker rebuild.

Future TG slices must use the project time-first workflow:

```text
inspect exactly changed services
-> smallest focused tests
-> API rebuild only for backend changes
-> frontend rebuild only for UI changes
-> both only when both actually changed
-> SQL schema apply only when a migration exists
-> never default to pnpm stack
```

## 12. Current execution order

The next Campaign implementation is now:

```text
CE4 — Custom Game + Chance Wheel
```

Telegram implementation begins only after CE4 acceptance, as:

```text
CE4.5 — Shared Telegram Publishing Foundation
```

Then CE5 consumes that foundation for `/manage/marketing` Campaign publishing.
