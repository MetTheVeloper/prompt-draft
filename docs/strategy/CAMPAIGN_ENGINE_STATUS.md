# Campaign Engine — Status

Last updated: 2026-09-13

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
Migration 029                         -> AVAILABLE AT HANDOFF / NOT CREATED / RE-AUDIT BEFORE WRITE
/manage/marketing                     -> NOT STARTED
Public /campaign/[slug] runtime       -> NOT STARTED
Local verification                    -> NOT STARTED
Selected next implementation slice    -> CE1 FOUNDATION
```

Current project transition:

```text
Milestone 21.5 production runtime     -> ACTIVE / FOUNDER VERIFIED
Milestone 21.5 SEO/indexability       -> DEFERRED / NUXT_PUBLIC_NOINDEX=true
Domain Expansion implementation       -> SCALE-GATED / NOT NEXT IMMEDIATE EXECUTION
Campaign Engine V1                    -> SELECTED NEXT PRE-SCALE ENGINEERING TRACK
```

Authoritative transition record:

```text
docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
```

Campaign Engine is a pre-scale commercialization/marketing platform track. It may proceed while 21.5 SEO launch remains deferred. It does not turn SEO on, and it does not start Domain Expansion.

---

## Canonical Campaign Engine sources

Read in this order before implementation:

```text
1. docs/strategy/CAMPAIGN_ENGINE_V1.md
2. docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
3. docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
4. docs/strategy/CAMPAIGN_ENGINE_STATUS.md
5. docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
6. docs/strategy/STATUS.md
```

Mandatory project workflow sources:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
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

Latest branch audit at the pre-scale handoff found the SQL migration ceiling is still:

```text
028_seed_profile_skill_taxonomy.sql
```

Therefore the first Campaign migration is currently available as:

```text
029_campaign_engine_v1.sql
```

It is not created yet.

This number is **not a permanent reservation**. Re-audit `backend/sql` from the latest branch HEAD immediately before creating the first Campaign migration because parallel work may consume `029`.

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
NEXT / SELECTED IMPLEMENTATION SLICE
```

Scope:

```text
first available Campaign migration number (029 only if still free at implementation time)
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

CE1 should begin with a branch-exact capability and migration audit before code writes. Reuse existing authorization/database patterns where semantics match.

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

All CE5 UI work must follow `UI_IMPLEMENTATION_GUIDELINES.md` and reuse the current Manage design system rather than inventing a separate admin shell.

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
global NUXT_PUBLIC_NOINDEX=true still wins during current pre-scale development mode
smallest-scope build/runtime verification passes
```

Do not use the historical `pnpm generate` requirement as the default Campaign acceptance command now that the accepted runtime is Nuxt/Nitro SSR/hybrid. Select verification according to `DEVELOPMENT_WORKFLOW.md` and the actual files/services changed.

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
Domain Expansion implementation
production SEO/indexability launch
```

---

## Resume prompt for a future chat

Use this context:

```text
Continue Campaign Engine V1 on branch feature/growth-foundation.

Before any decision or write:
1. re-read the latest branch HEAD; parallel work may have landed
2. read docs/strategy/DEVELOPMENT_WORKFLOW.md
3. read docs/strategy/CAMPAIGN_ENGINE_V1.md
4. read docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
5. read docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
6. read docs/strategy/CAMPAIGN_ENGINE_STATUS.md
7. read docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
8. read docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
9. read docs/strategy/STATUS.md

Current intended state at handoff:
- Campaign Engine implementation has NOT started
- CE1 Foundation is the selected next implementation slice
- Domain Expansion implementation is scale-gated and must NOT be started
- production runtime is active on prompt-draft.ir / api.prompt-draft.ir
- SEO launch is intentionally deferred; NUXT_PUBLIC_NOINDEX=true must remain in force
- current audited migration ceiling was 028, so 029 was available, but re-audit backend/sql before creating any migration

Start with a branch-exact CE1 capability audit. Determine what already exists in database helpers, authorization, economy, analytics and Manage infrastructure. Then write the smallest CE1 implementation plan and proceed without duplicating existing systems.
```

---

## Hard rules

```text
DO NOT assume migration 029 is still free without a fresh audit.
DO NOT create campaign-specific Economy or Analytics systems.
DO NOT let custom campaign UI bypass runtime contracts.
DO NOT change accepted 21.5 runtime/indexability contracts as a side effect of Campaign work.
DO NOT enable production SEO/indexing during Campaign implementation.
DO NOT start Domain Expansion implementation during this pre-scale track.
DO NOT mark implementation VERIFIED before explicit local evidence and founder acceptance.
DO NOT default to pnpm stack; follow the smallest-scope verification workflow.
```
