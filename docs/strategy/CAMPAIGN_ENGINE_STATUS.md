# Campaign Engine — Status

Last updated: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Track status:

```text
Founder direction / scenarios         -> APPROVED
Campaign Engine V1 source of truth    -> DOCUMENTED
Database schema V1                    -> DESIGNED
API / Runtime Contract V1             -> DESIGNED
Runtime implementation                -> NOT STARTED
Migration 029                         -> RESERVED BY DESIGN / NOT CREATED
/manage/marketing                     -> NOT STARTED
Public /campaign/[slug] runtime       -> NOT STARTED
Local verification                    -> NOT STARTED
```

Parallel project state:

```text
Milestone 21.5 Rendering & Organic Acquisition -> IN PROGRESS
Phase 21.5.4A -> ACCEPTED
Phase 21.5.4B -> ACCEPTED
Phase 21.5.4C -> ACCEPTED
Phase 21.5.4D -> NEXT

Campaign Engine is a parallel commercialization/marketing platform track.
It does not replace or reorder the accepted 21.5 execution chain.
```

---

## Canonical Campaign Engine sources

Read in this order before implementation:

```text
1. docs/strategy/CAMPAIGN_ENGINE_V1.md
2. docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
3. docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
4. docs/strategy/CAMPAIGN_ENGINE_STATUS.md
```

Inherited contracts that remain authoritative:

```text
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
backend/src/economy.mjs
backend/src/authorization.mjs
app/config/manage.ts
```

---

## Founder scenarios the contract must preserve

### Scenario A — custom game

```text
real game component
  -> emits bounded action/evidence
  -> server validates outcome
  -> validated winner can receive Goin
```

Custom UI is not reward authority.

### Scenario B — Payiz seasonal festival

```text
/campaign/payiz

season-long campaign
countdown/title/content
ANY:
  4 referrals
  OR 5 Prompt unlocks
  OR 10 public Drafts

promotion surfaces:
  header
  floating dismissible block
  custom modal

successful qualification -> Goin reward
```

Promotion is separate from the Campaign Page/Experience.

### Scenario C — daily chance wheel

```text
one valid spin per authenticated user per configured calendar day
server reserves attempt
server RNG resolves/persists outcome
browser only animates returned result
outcome-specific Goin reward when applicable
```

---

## Accepted architectural decisions

```text
Campaign is a domain object, not a page type.

Canonical public route:
  /campaign/:slug
  /fa/campaign/:slug

Published slug is durable/immutable in V1.

Campaign Definition is versioned data.
Published versions are immutable.
Participation locks to the exact version it started under.

Mutable config lives as campaign draft definition.
Published polymorphic config is stored as canonical JSONB.
Runtime authority is normalized relational state.

Mechanics are registry-driven and composable.
Metric conditions use a trusted Metric Registry.
Completion uses a recursive RuleExpression tree.

Client Actions are untrusted.
Server Domain Events are trusted.

Attempts are first-class runtime objects.
Daily attempt periods require explicit timezone.
Chance/random reward outcome is server-authoritative.

Promotion Surfaces are separate from Campaign Experience.
App shell should expose generic campaign placement hosts.

Product Analytics remains observational only.
Campaign domain state/reward facts remain authoritative separately.

Campaign Reward Grant reconciles to the existing user_economy_events ledger.
No campaign wallet or parallel Goin balance is allowed.

Global reward budget is transactionally guarded.
Reward qualification and Goin issuance are idempotent.

/manage/marketing reuses the existing Manage shell.
New marketing permissions are preferred over reusing system.settings.manage.
```

---

## Current schema decision

Current SQL migration ceiling on the branch:

```text
028_seed_profile_skill_taxonomy.sql
```

Reserved first Campaign migration:

```text
029_campaign_engine_v1.sql
```

It is not created yet.

Proposed V1 runtime tables:

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

Existing tables reused:

```text
users
user_economy_events
product_analytics_events
admin_audit_log
referrals
user_content_unlocks
other canonical product resources behind Metric Registry resolvers
```

---

## Important implementation finding — Economy transaction boundary

Current:

```text
backend/src/economy.mjs
recordUserEconomyEvent()
```

opens its own transaction.

Campaign reward correctness requires one transaction covering:

```text
reward qualification
budget reservation
campaign_reward_grant
user_economy_events credit
reward reconciliation/state/events
```

Therefore CE2 must first refactor/extract an internal transaction-aware Economy primitive while preserving current exported Economy behavior.

Required conceptual direction:

```text
recordUserEconomyEventInTransaction(client, input)
```

or equivalent executor-aware internal function.

Do not implement nested independent Economy/Campaign transactions for one reward.

---

## Proposed authorization

New permission keys:

```text
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view
```

Safe initial role direction:

```text
user        -> none
admin       -> campaign view + marketing metrics
super_admin -> all via existing wildcard
```

Mutation/publish can be broadened later deliberately.

---

## V1 mechanic target

```text
metric_goal
task_list
custom_game
chance_wheel
custom
```

Not all mechanics need to ship in the first code commit. The registry contract must exist before campaign-specific implementation.

---

## Implementation roadmap

### CE1 — Foundation

Status:

```text
NEXT WHEN CAMPAIGN IMPLEMENTATION IS STARTED
```

Scope:

```text
029_campaign_engine_v1.sql
marketing permissions
Campaign Definition validator
Campaign head/draft persistence
immutable publish versions
Renderer Registry skeleton
Mechanic Registry skeleton
Metric Registry skeleton
RuleExpression validator/evaluator tests
```

Acceptance focus:

```text
schema rerunnable
published version immutable through service path
slug rules enforced
private/public projection validator established
no existing Economy/Analytics behavior changed
```

### CE2 — Runtime Core

Status:

```text
NOT STARTED
```

Scope:

```text
public campaign projection
optional caller-aware campaign read
participation start/state
metric re-evaluation
client Action protocol
trusted Domain Events
Economy transaction-aware refactor
Campaign Reward Grant
atomic reward budget
idempotency/concurrency tests
```

### CE3 — Promotion Surfaces

Status:

```text
NOT STARTED
```

Scope:

```text
campaign promotion selection API
site_header placement
floating/modal overlay host
authenticated user dismiss state
session/device local dismissal
Product Analytics allowlist/instrumentation for observational promotion events
```

### CE4 — Custom Game + Chance Wheel

Status:

```text
NOT STARTED
```

Scope:

```text
attempt creation/runtime
custom_game contract implementation
server-verifiable/server-authoritative trust enforcement
chance_wheel private/public config split
server RNG
calendar-day limit + timezone
parallel spin verification
```

### CE5 — `/manage/marketing`

Status:

```text
NOT STARTED
```

Scope:

```text
Manage section registration
campaign list
campaign editor
preview
validate
publish
pause/resume/end/archive
permissions
EN/FA management copy where required by existing Manage convention
```

### CE6 — Measurement & Reconciliation

Status:

```text
NOT STARTED
```

Scope:

```text
funnel summary
participants
rewards
budget remaining
failed reward inspection
campaign grant -> economy event reconciliation
promotion top-of-funnel measurement honesty
```

### CE7 — Verification / Acceptance

Status:

```text
NOT STARTED
```

Required proof includes:

```text
private config cannot leak
browser cannot choose reward amount
browser cannot choose wheel result
browser cannot assert another user identity
one user cannot obtain duplicate V1 participation
same Action retry cannot duplicate effects
parallel completion cannot duplicate reward
parallel daily wheel cannot allocate > configured attempts
reward budget cannot overspend under race
campaign reward maps to exactly one Economy event
Product Analytics outage cannot break reward correctness
admin permission boundaries work
preview cannot grant reward
published version remains immutable
published slug remains stable
SSR/public campaign route works EN/FA
pnpm generate passes
```

---

## Deferred / explicitly not part of first implementation

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
separate campaign analytics warehouse
```

---

## Resume prompt for a future chat

Use this context:

```text
Continue Campaign Engine V1 from docs/strategy/CAMPAIGN_ENGINE_STATUS.md on branch feature/growth-foundation.

Before any implementation read:
- docs/strategy/CAMPAIGN_ENGINE_V1.md
- docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
- docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
- docs/strategy/CAMPAIGN_ENGINE_STATUS.md
- docs/strategy/STATUS.md

Do not change the accepted Milestone 21.5 sequence. Campaign Engine is a parallel track.
Current Campaign implementation state should be IMPLEMENTATION NOT STARTED unless STATUS says otherwise.
First implementation slice is CE1 Foundation and the reserved migration number is 029, but verify the branch migration ceiling again before creating any SQL file.
```

The migration number must always be re-audited before implementation because other parallel work may consume `029` first.

---

## Hard rules

```text
DO NOT claim migration 029 exists before it is created.
DO NOT start from stale migration ceiling without re-auditing the branch.
DO NOT create campaign-specific Economy or Analytics systems.
DO NOT let custom campaign UI bypass runtime contracts.
DO NOT change accepted 21.5 contracts as a side effect of Campaign work.
DO NOT mark implementation VERIFIED before explicit local evidence and founder acceptance.
```
