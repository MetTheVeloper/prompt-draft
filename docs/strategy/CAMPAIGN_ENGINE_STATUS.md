# Campaign Engine — Status

Last updated: 2026-09-14

Branch:

```text
feature/growth-foundation
```

Status: **ACTIVE PRE-SCALE ENGINEERING TRACK / CE4 ACCEPTED / CE4.5 TG3 FINAL ACCEPTANCE NEXT**

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
CE4.5 Shared Telegram Publishing      -> IN PROGRESS
  TG1 Shared Backend Foundation       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
  TG2 Composer + /manage/telegram     -> DONE / FOUNDER-LOCAL BUILD + VISUAL VERIFIED / ACCEPTED 2026-09-13
  TG3 Prompt Archive Adapter          -> IMPLEMENTED + HARDENED / FINAL TG3 ACCEPTANCE PENDING
  Archive management/image workflow  -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
CE5 /manage/marketing + TG4           -> NEXT AFTER TG3 ACCEPTANCE
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

Campaign architecture:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
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
/manage/marketing must reuse the existing Manage shell and authorization system.
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

CE4 founder-local acceptance remains dated 2026-09-13. Do not restart CE1-CE4 audits without a concrete regression.

---

## CE4.5 Shared Telegram Publishing — CURRENT

### TG1 — ACCEPTED

Shared backend publisher + persistence + exact super-admin authorization + audit + idempotent/retry-safe publication state are accepted.

### TG2 — ACCEPTED

Shared `TelegramPostComposer` + `/manage/telegram` operator surface are accepted in EN/FA and Light/Dark.

### TG3 — IMPLEMENTED + HARDENED / FINAL ACCEPTANCE PENDING

Current TG3 path:

```text
/manage/archive
  -> ArchiveTelegramAdapter
  -> TelegramPostComposer
  -> TG1 shared publisher
  -> telegram_publications
```

The current Prompt prefill is documented in `TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md` and includes bilingual public Prompt copy, persisted public images, Prompt Mini App CTA, fixed community direct-HTTPS CTA, tags and model metadata.

The underlying Archive management/image workflow exposed during TG3 work is now separately accepted:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
Status -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
```

Accepted Archive hardening includes:

```text
published-item metadata/media edits preserve status
Update changes vs Save as draft semantics are correct
status transitions remain explicit
persisted image reorder/delete preserves publication state
multi-image browser preparation no longer leaves stale Preparing state
```

Archive acceptance is complete and should not be reopened absent a regression.

TG3 itself still needs the explicitly recorded Telegram-specific founder acceptance gate from its canonical TG3 document. Archive image verification alone must not be treated as synthetic proof of Telegram-specific behavior.

---

# NEXT — TG3 final acceptance, then CE5 /manage/marketing + TG4

Immediate next gate:

```text
complete the Telegram-specific TG3 founder-local visual/behavior checklist
-> record TG3 ACCEPTED
-> mark CE4.5 COMPLETE
```

The remaining TG3 gate is presentation/behavior verification of the current Archive adapter contract. It does not require another Archive management redesign.

Once TG3 is accepted, start:

```text
CE5 — /manage/marketing
```

CE5 target scope:

```text
Manage section registration
Campaign list/editor
Campaign Definition editing/validation
preview / publish
pause / resume / end / archive
existing marketing permissions
EN/FA management copy under existing Manage conventions
TG4 Campaign adapter using the already-built TelegramPostComposer + TG1 publisher
Campaign Telegram CTA attribution aligned with accepted Campaign attribution semantics
```

CE5 must not create a temporary Campaign-specific Telegram modal, Bot API client, publication ledger or retry system.

Before CE5 implementation, re-audit the then-current branch and read at minimum:

```text
DEVELOPMENT_WORKFLOW.md
UI_IMPLEMENTATION_GUIDELINES.md
CAMPAIGN_ENGINE_STATUS.md
CAMPAIGN_ENGINE_V1.md
CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

Select verification commands only after identifying the exact CE5 files/services changed.

---

## CE6 — Measurement & Reconciliation

Status:

```text
NOT STARTED
```

Expected direction remains Campaign funnel/placement/mechanic/reward reconciliation using existing Product Analytics + Campaign runtime + Economy authorities. Telegram acquisition must feed those existing systems rather than create a second analytics pipeline.

## CE7 — Final Verification

Status:

```text
NOT STARTED
```

CE7 is the aggregate Campaign/Telegram integration acceptance boundary after CE5/CE6 and any required pre-CE7 Telegram retry/reconciliation hardening.

---

## Resume instruction

```text
1. inspect latest feature/growth-foundation HEAD before every decision/write
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read this CAMPAIGN_ENGINE_STATUS.md
4. keep CE1-CE4 accepted unless a concrete regression exists
5. keep Archive management/image workflow accepted unless a concrete regression exists
6. finish the TG3 Telegram-specific acceptance gate
7. after TG3 acceptance, CE5 /manage/marketing + TG4 is the next implementation slice
8. preserve the shared Telegram publisher/composer/ledger architecture
9. keep NUXT_PUBLIC_NOINDEX=true and SEO launch deferred
10. do not start Domain Expansion implementation before its scale gate
11. do not create parallel wallet, analytics, authorization, Campaign or Telegram authorities
```