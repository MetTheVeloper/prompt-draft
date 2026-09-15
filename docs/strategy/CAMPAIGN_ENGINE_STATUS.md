# Campaign Engine — Status

Last updated: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Status: **ACTIVE PRE-SCALE ENGINEERING TRACK / CE4.5 ACCEPTED / CE5 MANAGE MARKETING FOUNDER-LOCAL VERIFIED / DRAFT PREVIEW NEXT**

## Current execution state

```text
Founder direction / scenarios         -> APPROVED
Campaign Engine V1 contract           -> DOCUMENTED
CE1 Foundation                        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
Expiring / Promotional Goin V1        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE2.1 Runtime Core                    -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE2.2 Actions / Attempts              -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE3 Promotion Surfaces                -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE4 Custom Game + Chance Wheel        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE4.5 Shared Telegram Publishing      -> DONE / ACCEPTED
  TG1 Shared Backend Foundation       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
  TG2 Composer + /manage/telegram     -> DONE / FOUNDER-LOCAL BUILD + VISUAL VERIFIED / ACCEPTED 2026-09-13
  TG3 Prompt Archive Adapter          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
  Archive management/image workflow  -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
CE5 /manage/marketing + TG4           -> IN PROGRESS
  Campaign admin/operator foundation -> IMPLEMENTED
  Structured Manage Marketing UX     -> FOUNDER-LOCAL VERIFIED 2026-09-15
  Draft Preview                      -> NEXT
  TG4 Campaign Telegram adapter      -> AFTER PREVIEW
CE6 Measurement & Reconciliation      -> NOT STARTED
CE7 Final Verification                -> NOT STARTED
```

Production/indexability invariants remain unchanged:

```text
production runtime active
NUXT_PUBLIC_NOINDEX=true -> KEEP
SEO/indexability launch  -> DEFERRED
Domain Expansion         -> SCALE-GATED / NOT CURRENT IMPLEMENTATION
```

Campaign/Telegram work must not alter production DNS/Tunnel/Worker/indexability as a side effect.

---

## Canonical sources — read before new implementation

Project workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Campaign architecture and active execution:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
```

Accepted Campaign / Economy records:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE2_1_VERIFICATION.md
docs/strategy/CAMPAIGN_ENGINE_CE2_2_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
```

Telegram bridge records:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Archive operator acceptance:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

Production/pre-scale context:

```text
docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
docs/strategy/STATUS.md
```

Inherited authorities remain unchanged:

```text
user_economy_events      -> authoritative Goin ledger
product_analytics_events -> observational analytics
admin_audit_log          -> privileged mutation audit
backend authorization    -> permission authority
campaign_versions        -> immutable published Campaign snapshots
telegram_publications    -> shared Telegram publication ledger
```

---

## Frozen architectural invariants

```text
Campaign is a domain object, not a page type.

Canonical public route:
  /campaign/:slug
  /fa/campaign/:slug

Published Campaign Versions are immutable.
Participation locks to the exact published version it started under.
Browser receives only safe public projections.

Mechanics are registry-driven and composable.
Trusted metrics come only from the Metric Registry.
Client Actions are untrusted input/audit evidence.
Trusted Domain Events are server-created.
Attempts are first-class server runtime objects.

Browser never decides:
  authoritative user identity
  eligibility
  accepted completion
  winner/result
  reward amount
  reward expiry
  reward grant

Chance/random outcomes are server-authoritative.
Custom UI uses the same Campaign runtime contracts.

Campaign Reward Grant reconciles to user_economy_events.
No Campaign wallet or second Goin balance is allowed.
Promotional Goin may expire inside the same Economy ledger.
Debits consume active expiring Goin FEFO before permanent Goin.
Campaign reward budgets are transactionally guarded.
Reward qualification + issuance are idempotent.

Promotion Surfaces are separate from Campaign Experience.
/manage/marketing reuses the existing Manage shell and authorization system.
```

Telegram remains a shared distribution subsystem rather than Campaign business logic:

```text
Telegram = Preview + CTA
Mini App = Entry point
Prompt Draft = all business logic

/manage/archive ----\
/manage/marketing ----> TelegramPostComposer -> shared backend TelegramPublisher
/manage/telegram ----/
```

Prompt and Campaign must never grow separate Telegram publishers.

Telegram must never decide Campaign eligibility, participation, attempts, outcome, reward amount, reward expiry, reward grant or Goin state.

---

## Database/runtime state already accepted

Campaign/Economy/Telegram migrations through the current track include:

```text
029_campaign_engine_v1.sql
030_expiring_promotional_goin.sql
031_campaign_reward_grant_contract.sql
032_telegram_publishing_foundation.sql
```

Campaign foundation tables:

```text
campaigns
campaign_versions
campaign_participations
campaign_actions
campaign_events
campaign_mechanic_states
campaign_attempts
campaign_reward_budgets
campaign_reward_grants
campaign_promotion_user_states
```

Shared Telegram persistence:

```text
telegram_publications
telegram_publication_attempts
telegram_publication_messages
```

Published `campaign_versions` remain DB-protected against UPDATE/DELETE.

---

## CE1 through CE4 — ACCEPTED

CE1 accepted the Campaign Definition/schema/registry/authorization foundation.

Expiring Goin accepted the same-ledger promotional expiry/allocation model and FEFO debit behavior.

CE2.1 accepted public runtime projection, caller state, participation/version lock, trusted metric refresh, atomic completion rewards and reconciliation.

CE2.2 accepted server attempt reservation, period limits/timezones, idempotent Actions, mechanic-state revisioning and trusted action/event boundaries.

CE3 accepted on-site promotion selection/rendering/dismissal/frequency controls and bounded Campaign attribution handoff.

CE4 accepted the public Campaign entry experience, Custom Game runtime, server-authoritative Chance Wheel outcome handling and generic runtime notices.

Canonical CE4 record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
```

CE1-CE4 must not be reopened without a concrete regression.

---

## CE4.5 Shared Telegram Publishing — DONE / ACCEPTED

TG1, TG2 and TG3 are accepted. The Prompt Archive adapter founder-local gate was completed on 2026-09-15 and the shared Telegram publishing foundation is therefore closed as an accepted prerequisite for TG4.

Canonical TG3 record:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
Status -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
```

Accepted Archive management/image hardening remains recorded separately:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
Status -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
```

Do not redesign TG1-TG3 or Archive management while implementing TG4 unless a concrete regression is found.

---

## CE5 Manage Marketing — IN PROGRESS

Canonical current checkpoint:

```text
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
```

The current CE5 implementation includes:

```text
Campaign admin API/client/types
existing marketing permissions
Manage section registration
/manage/marketing Campaign list/editor
structured Campaign Definition editor
raw JSON advanced escape hatch
draft save + optimistic revision handling
validate + immutable version publish
pause / resume / end / archive
runtime summary cards
EN/FA Manage copy
```

### Founder-local verified UI/UX checkpoint — 2026-09-15

The founder manually verified the current Manage Marketing refinement slice and confirmed all requested behavior is correct:

```text
Objective dropdown descriptions explain when each objective should be selected
Gregorian Starts at / Ends at fields work in both EN and FA
Timezone is an IANA dropdown instead of free text
EN/FA localized content layout and forced LTR/RTL behavior are correct
manual Canonical input is removed
indexable canonical derives from /campaign/:slug
no Campaign canonical is emitted for Campaign-level noindex
Validate keeps page feedback and also shows a result modal
Pause / Resume / End / Archive are grouped in a dedicated operations card
lifecycle action visual hierarchy and confirmations are preserved
```

Relevant final refinement commits:

```text
2de30888  feat: add reusable Gregorian date-time field
31cf0eba  feat: improve Campaign form scheduling and locale UX
d3784e76  feat: expand Campaign builder UX copy
d6741f38  feat: localize Campaign builder UX
b076c9ff  fix: derive public Campaign canonical from slug
6ca369ba  feat: improve Campaign validation and lifecycle UX
```

This closes the current Manage Marketing UI/UX checkpoint, **not CE5 overall**.

---

# NEXT — CE5 Draft Preview, then TG4

Immediate next slice:

```text
CE5 Draft Preview
```

The Campaign API/runtime contract explicitly requires `/manage/marketing` Preview. The preferred direction is:

```text
current mutable Campaign draft
  -> same renderer registry
  -> preview mode
  -> operator-visible preview
```

Preview must be non-authoritative and non-reward-capable:

```text
no real participation
no real attempts
no real completion/reward mutation
no real Goin issuance
no reward budget consumption
```

Do not route Preview through production action endpoints using a hidden `preview=true` flag.

After Draft Preview:

```text
TG4 Campaign adapter
  -> /manage/marketing
  -> existing TelegramPostComposer
  -> existing TG1 publisher
  -> telegram_publications
```

TG4 Campaign CTA attribution must align with the accepted Campaign attribution semantics. TG4 must not create a Campaign-specific Bot API client, publisher, publication ledger or retry system.

CE5 completion order is therefore:

```text
Manage Marketing operator surface -> FOUNDER-LOCAL VERIFIED 2026-09-15
Draft Preview                     -> NEXT
TG4 Campaign Telegram adapter     -> AFTER PREVIEW
CE5 aggregate verification        -> THEN
CE6 Measurement & Reconciliation  -> AFTER CE5 ACCEPTANCE
```

---

## CE6 — Measurement & Reconciliation

Status:

```text
NOT STARTED
```

Expected scope from the V1 plan:

```text
funnel summary
participant/reward inspection
budget remaining
Economy transaction trace
placement/mechanic/reward reconciliation
```

The existing `/manage/marketing` runtime summary cards are useful CE5 operator context but do not by themselves satisfy CE6.

Telegram acquisition must feed existing Product Analytics + Campaign runtime + Economy authorities rather than create a second analytics pipeline.

## CE7 — Final Verification

Status:

```text
NOT STARTED
```

CE7 is the aggregate Campaign/Telegram integration acceptance boundary after CE5/CE6 and any required pre-CE7 retry/reconciliation hardening.

---

## Resume instruction

```text
1. inspect latest feature/growth-foundation HEAD before every decision/write
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read CAMPAIGN_ENGINE_STATUS.md and CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
4. keep CE1-CE4.5 accepted unless a concrete regression exists
5. keep Archive management/image workflow accepted unless a concrete regression exists
6. implement CE5 Draft Preview as the next slice
7. after Preview, implement TG4 through the shared Telegram composer/publisher/ledger only
8. complete CE5 aggregate verification before starting CE6
9. keep NUXT_PUBLIC_NOINDEX=true and SEO launch deferred
10. do not start Domain Expansion implementation before its scale gate
11. do not create parallel wallet, analytics, authorization, Campaign or Telegram authorities
```

This documentation-only checkpoint requires no Docker rebuild.