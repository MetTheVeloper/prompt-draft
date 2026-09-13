# Campaign Engine — Status

Last updated: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Status: **ACTIVE PRE-SCALE ENGINEERING TRACK / CE3 ACCEPTED / CE4 NEXT**

## Current execution state

```text
Founder direction / scenarios         -> APPROVED
Campaign Engine V1 contract           -> DOCUMENTED
CE1 Foundation                        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
Expiring / Promotional Goin V1        -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE2.1 Runtime Core                    -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE2.2 Actions / Attempts              -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE3 Promotion Surfaces                -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
CE4 Custom Game + Chance Wheel        -> NEXT
CE4.5 Shared Telegram Publishing      -> SCHEDULED AFTER CE4 / BEFORE CE5
CE5 /manage/marketing                 -> NOT STARTED
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

Campaign Engine work must not alter production DNS/Tunnel/Worker/indexability as a side effect.

---

## Canonical sources — read before any new Campaign implementation

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

Accepted implementation/verification records:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE2_1_VERIFICATION.md
docs/strategy/CAMPAIGN_ENGINE_CE2_2_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
```

Scheduled Telegram bridge:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md
```

Production/pre-scale context:

```text
docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
docs/strategy/STATUS.md
```

Inherited platform contracts remain authoritative:

```text
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
backend/src/economy.mjs
backend/src/economyCore.mjs
backend/src/authorization.mjs
app/config/manage.ts
```

---

## Accepted architectural invariants

```text
Campaign is a domain object, not a page type.

Canonical public route:
  /campaign/:slug
  /fa/campaign/:slug

Published slug is durable/immutable in V1.
Published Campaign Versions are immutable.
Participation locks to the exact published version it started under.

Canonical Campaign Definition is versioned data.
Browser receives only safe public projections.
Private mechanic/reward/operator configuration never leaks through generic serialization.

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
Custom UI must use the same Campaign runtime contracts.

Campaign Reward Grant reconciles to the existing user_economy_events ledger.
No Campaign wallet or second Goin balance is allowed.
Promotional Goin may expire inside the same Economy ledger.
Debits consume active expiring Goin FEFO before permanent Goin.
Campaign reward budgets are transactionally guarded.
Reward qualification + issuance are idempotent.

Product Analytics is observational only.
admin_audit_log remains the privileged mutation audit.

Promotion Surfaces are separate from Campaign Experience.
App shell uses generic Campaign placement hosts.

/manage/marketing must reuse the existing Manage shell and authorization system.
```

---

## Database state

Verified Campaign/Economy migrations through this track:

```text
029_campaign_engine_v1.sql
030_expiring_promotional_goin.sql
031_campaign_reward_grant_contract.sql
```

Campaign foundation tables from 029:

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

Existing systems reused instead of duplicated:

```text
users
user_economy_events
product_analytics_events
admin_audit_log
referrals
user_content_unlocks
prompt_drafts / canonical product resources behind Metric Registry resolvers
```

Published `campaign_versions` have DB-level UPDATE/DELETE rejection. CE3 visual verification independently exercised the UPDATE rejection and received:

```text
ERROR: published campaign versions are immutable
```

---

## CE1 — Foundation — ACCEPTED

Accepted scope:

```text
Campaign schema foundation
marketing permissions
Campaign Definition validation
Campaign head/draft persistence
optimistic draft revisions
immutable publish versions
publish idempotency under Campaign row lock
admin_audit_log writes for privileged Campaign mutations
Renderer / Mechanic / Metric Registry foundations
RuleExpression validation/evaluation
deterministic definition hashing
```

Authorization baseline:

```text
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view

user        -> none
admin       -> campaign view + marketing metrics
super_admin -> all via existing wildcard
```

Canonical verification record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
```

---

## Expiring / Promotional Goin V1 — ACCEPTED

Accepted Economy extension:

```text
positive credits may have nullable expires_at
per-debit provenance allocations
FEFO consumption of active expiring credits
permanent Goin never expires
no promotional wallet / no second balance
dynamic spendable balance excludes expired unspent remainder
Campaign budget limits issued volume
expiry limits outstanding duration
no promo-to-permanent laundering
```

Campaign runtime uses the transaction-aware Economy primitive so reward qualification, budget reservation, grant creation and Economy issuance can share one transaction.

Canonical contract/verification record:

```text
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
```

---

## CE2.1 — Runtime Core — ACCEPTED

Accepted runtime:

```text
public Campaign projection
caller-aware state read
participation creation/version lock
trusted Metric Registry refresh
completion evaluation
atomic Campaign completion reward settlement
publish-time reward budget seeding
expiring Campaign Goin rewards
reward/budget/economy reconciliation
retry idempotency
```

Public runtime routes include:

```text
GET  /api/campaigns/:slug
GET  /api/campaigns/:slug/state
POST /api/campaigns/:slug/participation
```

Authoritative V1 metrics activated:

```text
referrals.completed.count
prompts.unlocked.count
drafts.public.count
prompts.created.count
```

Canonical verification record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE2_1_VERIFICATION.md
```

---

## CE2.2 — Actions / Attempts — ACCEPTED

Accepted runtime:

```text
server-side attempt reservation
campaign/calendar_day/rolling_24h/session periods
server IANA timezone handling
attempt limits
idempotent reservations
Action audit + request-hash conflict protection
mechanic-state revision/serialization
trusted action/event linkage
safe generic attempt_started action
unsupported browser-reported game_finished/outcome rejected
```

Routes include:

```text
POST /api/campaigns/:slug/mechanics/:mechanicId/attempts
POST /api/campaigns/:slug/actions
```

Authentication is checked before Campaign existence on protected mutation paths so unauthenticated probing returns 401 rather than leaking Campaign existence.

Canonical implementation/verification record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE2_2_IMPLEMENTATION.md
```

---

## CE3 — Promotion Surfaces — ACCEPTED

Accepted backend:

```text
promotion selection API
four V1 slot contracts
schedule/lifecycle filtering
deterministic ordering
safe localized projection
authenticated user dismissal state
session/device browser-local dismissal
frequency caps as presentation controls
publish-time renderer/slot/config validation
```

Accepted frontend:

```text
site_header host inside existing Header
floating_corner shared overlay host
modal through existing global modal system
generic dashboard_banner renderer contract without misusing admin /manage/dashboard
EN/FA localized rendering
Light/Dark rendering
bounded on-site Campaign attribution handoff for CE4
```

Product Analytics observational events:

```text
campaign_promotion_impression
campaign_promotion_click
campaign_promotion_dismiss
```

Founder-local evidence:

```text
CE3.1 aggregate backend regression -> 18/18 PASS
CE3.2 focused backend regression   -> 13/13 PASS
pnpm frontend                      -> Nuxt client/SSR/Nitro PASS
controlled visual fixture          -> header/floating/modal + Light/Dark + FA/RTL PASS
Founder acceptance                 -> 2026-09-13
```

Canonical implementation/verification record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE3_IMPLEMENTATION.md
```

---

# NEXT — CE4 Custom Game + Chance Wheel

CE4 must build on CE2.2 Attempts rather than inventing another attempt system.

Target scope:

```text
generic Nuxt /campaign/[slug] entry experience
EN + /fa Campaign route behavior
consume bounded pending attribution from CE3
stable Campaign entry target for later Telegram integration

custom_game mechanic runtime contract
server-verifiable / server-authoritative completion boundary
game-specific accepted actions/evidence
trusted mechanic outcome persistence
mechanic_outcome qualification/reward integration

chance_wheel public/private config split
server-side RNG / persisted authoritative result
configured calendar-day timezone limit using CE2.2 attempts
parallel spin/race verification
browser animation consumes already-decided server outcome

no browser-authoritative winner, reward amount or reward expiry
```

Before implementation, re-audit the current renderer registry, Campaign public projection, CE2.2 action/attempt runtime, reward settlement, locale routing and UI system. Do not assume the old pre-CE2 roadmap implementation details are still correct.

Smallest-scope verification must be selected only after identifying actual CE4 changed files/services.

---

## CE4.5 — Shared Telegram Publishing Foundation — SCHEDULED

Founder-approved direction:

```text
Telegram = Preview + CTA
Mini App = Entry point
Prompt Draft = all business logic
```

Timing:

```text
CE4 ACCEPTED
-> CE4.5 shared Telegram foundation
-> CE5 /manage/marketing consumes the shared Telegram subsystem
```

CE4.5 is **not part of CE4 implementation** and must not interrupt CE4 prerequisites.

Canonical scheduling decision:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md
```

Required shared architecture later:

```text
/manage/archive ----\
/manage/marketing ----> TelegramPostComposer -> shared backend TelegramPublisher
/manage/telegram ----/
```

Prompt and Campaign must never grow separate Telegram publishers or Telegram-side business logic.

---

## CE5 — /manage/marketing

Status:

```text
NOT STARTED
```

Target scope:

```text
Manage section registration
campaign list/editor
preview/validate/publish
pause/resume/end/archive
permissions
EN/FA management copy under existing Manage conventions
TG4 Campaign adapter to the already-built shared Telegram subsystem
```

All UI must follow `UI_IMPLEMENTATION_GUIDELINES.md` and reuse the current Manage design system.

---

## CE6 — Measurement & Reconciliation

Status:

```text
NOT STARTED
```

Target scope:

```text
funnel summary
participants
rewards
budget remaining
failed reward inspection
Campaign grant -> Economy event reconciliation
promotion top-of-funnel measurement
Telegram attribution measurement through existing analytics contracts
promotional Goin issued/spent/expired/outstanding reconciliation
```

No second analytics warehouse.

---

## CE7 — Final Verification / Acceptance

Status:

```text
NOT STARTED
```

Aggregate proof must include at least:

```text
private config cannot leak
browser cannot choose user identity
browser cannot choose reward amount/expiry
browser cannot choose wheel result
one user cannot obtain duplicate V1 participation
Action retries cannot duplicate effects
parallel completion cannot duplicate reward
parallel daily wheel cannot exceed configured attempts
reward budget cannot overspend under race
Campaign reward maps to exactly one Economy event
expiring Campaign reward cannot burn permanent Goin
Product Analytics outage cannot break reward correctness
admin permission boundaries work
preview cannot grant reward
published version remains immutable
published slug remains stable
public Campaign EN/FA route works
Campaign + Telegram integration respects shared publisher boundary if CE4.5/CE5 are in accepted V1 surface
global NUXT_PUBLIC_NOINDEX=true still wins
smallest-scope build/runtime verification passes
```

---

## Deferred / out of current slice

```text
advanced segment builder
A/B testing platform
external social-task verification
creator-funded campaign economy
cash/fiat rewards
coupon inventory integrations
leaderboard UI
random-draw settlement UI
cross-campaign workflow automation
anonymous server device fingerprinting
separate Campaign analytics warehouse
Domain Expansion implementation
production SEO/indexability launch
Telegram automatic Prompt publishing TG5 unless separately promoted by founder
```

---

## Resume instruction

Before the next Campaign write:

```text
1. re-read latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md
3. read UI_IMPLEMENTATION_GUIDELINES.md for UI work
4. read CAMPAIGN_ENGINE_V1.md
5. read CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
6. read CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
7. read CAMPAIGN_ENGINE_STATUS.md
8. read CE2.1 / CE2.2 / CE3 accepted records relevant to the change
9. inspect the actual current code touched by CE4
10. choose the smallest verification scope
```

Current intended execution order:

```text
CE1        -> ACCEPTED
Expiring Goin -> ACCEPTED
CE2.1      -> ACCEPTED
CE2.2      -> ACCEPTED
CE3        -> ACCEPTED
CE4        -> NEXT
CE4.5      -> AFTER CE4
CE5        -> AFTER CE4.5
CE6        -> LATER
CE7        -> FINAL
```

---

## Hard rules

```text
DO NOT create Campaign-specific Economy or Analytics systems.
DO NOT create a promotional wallet or second Goin balance.
DO NOT let custom Campaign UI bypass runtime contracts.
DO NOT let browser input decide reward amount, reward expiry, winner/result or authoritative user identity.
DO NOT mutate published Campaign Versions.
DO NOT create a second attempt system in CE4; reuse CE2.2 Attempts.
DO NOT treat Product Analytics as completion/reward authority.
DO NOT change accepted production runtime/indexability contracts as a Campaign side effect.
DO NOT enable production SEO/indexing during Campaign implementation.
DO NOT change production DNS/Tunnel/Worker/indexability without explicit founder approval.
DO NOT start Domain Expansion during this pre-scale track.
DO NOT implement Telegram inside CE4; CE4.5 timing is already scheduled.
DO NOT create separate Prompt/Campaign Telegram publishers later.
DO NOT default to pnpm stack; follow DEVELOPMENT_WORKFLOW.md.
```
