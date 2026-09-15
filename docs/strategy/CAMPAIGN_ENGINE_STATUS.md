# Campaign Engine — Status

Last updated: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Status: **ACTIVE PRE-SCALE ENGINEERING TRACK / CE1-CE5 ACCEPTED / CE6 MEASUREMENT & RECONCILIATION NEXT**

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
CE5 /manage/marketing + TG4           -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
  Campaign admin/operator foundation -> ACCEPTED
  Structured Manage Marketing UX     -> ACCEPTED
  Draft Preview                      -> ACCEPTED
  TG4 Campaign Telegram adapter      -> ACCEPTED
  CE5 aggregate verification         -> ACCEPTED
CE6 Measurement & Reconciliation      -> NEXT / NOT STARTED
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
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
```

Accepted Campaign / Economy records:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE2_1_VERIFICATION.md
docs/strategy/CAMPAIGN_ENGINE_CE2_2_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
```

Telegram bridge records:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
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

Campaign/Economy/Telegram migrations through CE5 include:

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

## CE1 through CE4 — DONE / ACCEPTED

CE1 accepted the Campaign Definition/schema/registry/authorization foundation.

Expiring Goin accepted the same-ledger promotional expiry/allocation model and FEFO debit behavior.

CE2.1 accepted public runtime projection, caller state, participation/version lock, trusted metric refresh, atomic completion rewards and reconciliation.

CE2.2 accepted server attempt reservation, period limits/timezones, idempotent Actions, mechanic-state revisioning and trusted action/event boundaries.

CE3 accepted on-site promotion selection/rendering/dismissal/frequency controls and bounded Campaign attribution handoff.

CE4 accepted the public Campaign entry experience, Custom Game runtime, server-authoritative Chance Wheel outcome handling and generic runtime notices.

CE1-CE4 must not be reopened without a concrete regression.

---

## CE4.5 Shared Telegram Publishing — DONE / ACCEPTED

TG1, TG2 and TG3 are accepted. Shared Telegram publishing remains the only Telegram publication authority used by TG4.

Canonical records:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Do not redesign TG1-TG3 or Archive management unless a concrete regression is found.

---

## CE5 Manage Marketing — DONE / ACCEPTED 2026-09-15

Canonical records:

```text
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

Accepted CE5 scope:

```text
/manage/marketing list/editor
structured Campaign Definition authoring
validate / immutable publish
lifecycle controls
safe Draft Preview
responsive EN/FA operator UX
TG4 Campaign -> shared Telegram publishing bridge
shared managed-image uploader for Telegram media
```

Founder-local verification covered the operator form and responsive UI, Draft Preview with unsaved state, and TG4 end-to-end through a dedicated Telegram test channel.

TG4 acceptance evidence includes:

```text
managed-media backend contract tests -> 3/3 pass
real image post -> delivered to Telegram test channel
Join Campaign CTA -> rendered
CTA -> opened configured Telegram Mini App
Mini App -> resolved intended Campaign
```

CE5 aggregate verification confirms the accepted slices compose while preserving version immutability, server runtime/reward authority, the shared Economy ledger, shared Telegram publication authority and the independent production noindex gate.

Result:

```text
CE5 Manage Marketing -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
```

---

## CE6 — Measurement & Reconciliation

Status:

```text
NEXT / NOT STARTED
```

V1 scope:

```text
funnel summary
participant / reward inspection
budget remaining
Economy transaction trace
placement / mechanic / reward reconciliation
```

The existing `/manage/marketing` runtime summary cards are useful CE5 operator context but do not by themselves satisfy CE6.

CE6 must reconcile existing authoritative systems rather than create new ones:

```text
Campaign runtime + trusted domain events
product_analytics_events
campaign_reward_budgets
campaign_reward_grants
user_economy_events
admin authorization + admin_audit_log
```

Telegram acquisition must feed existing Product Analytics + Campaign runtime + Economy authorities rather than create a second analytics pipeline.

CE6 must not introduce:

```text
a second wallet
a second reward ledger
a second analytics warehouse
a client-authoritative reporting path
a Campaign-specific Telegram analytics authority
```

---

## CE7 — Final Verification

Status:

```text
NOT STARTED
```

CE7 is the aggregate Campaign/Telegram integration acceptance boundary after CE6 and any required pre-CE7 reconciliation hardening.

---

## Resume instruction — CE6 next

```text
1. inspect latest feature/growth-foundation HEAD before every decision/write
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read CAMPAIGN_ENGINE_V1.md
4. read CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
5. read CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
6. read CAMPAIGN_ENGINE_STATUS.md
7. read CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
8. preserve CE1-CE5 acceptance unless a concrete regression exists
9. start CE6 Measurement & Reconciliation
10. keep NUXT_PUBLIC_NOINDEX=true and SEO launch deferred
11. do not start Domain Expansion implementation before its scale gate
12. do not create parallel wallet, analytics, authorization, Campaign or Telegram authorities
13. apply time-first verification and smallest rebuild scope to every CE6 slice
```

This CE5 closure is documentation-only, so no Docker rebuild is required.
