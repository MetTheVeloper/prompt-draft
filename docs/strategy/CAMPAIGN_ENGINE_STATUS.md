# Campaign Engine — Status

Last updated: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Status: **ACTIVE PRE-SCALE ENGINEERING TRACK / CE4.5 ACCEPTED / CE5 MANAGE MARKETING + PREVIEW ACCEPTED / TG4 IMPLEMENTED — VERIFICATION PENDING**

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
  Structured Manage Marketing UX     -> FOUNDER-LOCAL ACCEPTED 2026-09-15
  Draft Preview                      -> FOUNDER-LOCAL ACCEPTED 2026-09-15
  TG4 Campaign Telegram adapter      -> IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING
  CE5 aggregate verification         -> AFTER TG4 ACCEPTANCE
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
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
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

CE1-CE4 must not be reopened without a concrete regression.

---

## CE4.5 Shared Telegram Publishing — DONE / ACCEPTED

TG1, TG2 and TG3 are accepted. Shared Telegram publishing is the only Telegram publication authority used by TG4.

Canonical records:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Do not redesign TG1-TG3 or Archive management while implementing TG4 unless a concrete regression is found.

---

## CE5 Manage Marketing — IN PROGRESS

Canonical current checkpoint:

```text
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
```

### Manage Marketing operator UX — ACCEPTED 2026-09-15

Founder-local verification covers the structured editor, scheduling, localized content, SEO behavior, validation, lifecycle controls, responsive mobile/tablet treatment and the final compact action-toolbar/three-dot-menu cleanup.

### Draft Preview — ACCEPTED 2026-09-15

Draft Preview reuses the existing Campaign renderer from current local form state while remaining isolated from participation, attempts, rewards, Goin issuance and reward budgets.

### TG4 Campaign Telegram adapter — IMPLEMENTED / VERIFICATION PENDING

Canonical TG4 record:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
```

Implemented path:

```text
/manage/marketing
  -> CampaignTelegramAdapter
  -> TelegramPostComposer
  -> TG1 shared publisher
  -> telegram_publications
```

TG4 prefill reads only the immutable current `publishedVersion.definition`.

Shared source identity:

```text
source.type    = campaign
source.id      = Campaign UUID
source.version = published version number
```

Mini App Campaign CTA:

```text
campaign_<slug>
```

Telegram entry attribution:

```text
source = telegram
medium = campaign_channel
campaign = <slug>
metadata.placement = telegram_channel
```

The query/attribution handoff is metadata only. Server Campaign runtime remains authoritative.

Current CE5 completion order:

```text
Manage Marketing operator surface -> FOUNDER-LOCAL ACCEPTED 2026-09-15
Draft Preview                     -> FOUNDER-LOCAL ACCEPTED 2026-09-15
TG4 Campaign Telegram adapter     -> IMPLEMENTED / VERIFY NEXT
CE5 aggregate verification        -> AFTER TG4 ACCEPTANCE
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
5. keep Manage Marketing and Draft Preview accepted unless a concrete regression exists
6. founder-local verify TG4 through the shared Telegram publisher
7. after TG4 acceptance, complete CE5 aggregate verification before CE6
8. keep NUXT_PUBLIC_NOINDEX=true and SEO launch deferred
9. do not start Domain Expansion implementation before its scale gate
10. do not create parallel wallet, analytics, authorization, Campaign or Telegram authorities
```

TG4 implementation changes are frontend-only. Local runtime verification scope:

```powershell
pnpm frontend
```
