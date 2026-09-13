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
Database schema V1                    -> DESIGNED + CE1 FOUNDATION IMPLEMENTED
API / Runtime Contract V1             -> DESIGNED
CE1 Foundation implementation         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
Migration 029                         -> CREATED / LOCALLY APPLIED / VERIFIED
Expiring / Promotional Goin V1        -> IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION
/manage/marketing                     -> NOT STARTED
Public /campaign/[slug] runtime       -> NOT STARTED
Next Campaign slice                   -> CE2 AFTER EXPIRING GOIN VERIFICATION
```

Current project transition:

```text
Milestone 21.5 production runtime     -> ACTIVE / FOUNDER VERIFIED
Milestone 21.5 SEO/indexability       -> DEFERRED / NUXT_PUBLIC_NOINDEX=true
Domain Expansion implementation       -> SCALE-GATED / NOT NEXT IMMEDIATE EXECUTION
Campaign Engine V1                    -> ACTIVE PRE-SCALE ENGINEERING TRACK
Economy prerequisite before CE2       -> EXPIRING / PROMOTIONAL GOIN V1
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
5. docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
6. docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
7. docs/strategy/MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
8. docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
9. docs/strategy/STATUS.md
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
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
backend/src/economy.mjs
backend/src/economyCore.mjs
backend/src/authorization.mjs
app/config/manage.ts
```

For spendable-balance semantics, `EXPIRING_PROMOTIONAL_GOIN_V1.md` amends the older plain-`SUM(unit_delta)` shorthand when expiring credits exist.

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

Campaign reward credits may deliberately be expiring/promotional.
Expiring credits remain in the same Economy ledger.
Debits consume active expiring Goin FEFO before permanent Goin.

Global reward budget is transactionally guarded.
Reward qualification and Goin issuance are idempotent.

/manage/marketing reuses the existing Manage shell.
Campaign permissions extend the existing authorization system.
```

Founder scenarios remain authoritative in `CAMPAIGN_ENGINE_V1.md`, including custom game, Payiz seasonal campaign and daily chance wheel trust-boundary examples.

---

## CE1 — Foundation

Status:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

Implementation commit:

```text
1f8c35ee9041e600ba6d99d37c595f446842d000
feat: add Campaign Engine CE1 foundation
```

Implemented files:

```text
backend/sql/029_campaign_engine_v1.sql
backend/src/authorization.mjs
backend/src/campaignDefinition.mjs
backend/src/campaignFoundation.test.mjs
backend/src/campaignRegistry.mjs
backend/src/campaignRules.mjs
backend/src/campaigns.mjs
```

Implemented CE1 scope:

```text
Campaign migration 029
marketing permissions
Campaign Definition validator
Campaign head/draft persistence
optimistic draft revisions
immutable publish versions
publish idempotency under Campaign row lock
admin_audit_log writes for Campaign create/update/publish
Renderer Registry skeleton
Mechanic Registry skeleton
Metric Registry skeleton
RuleExpression validator/evaluator
deterministic canonical definition hashing
```

Authorization currently implements:

```text
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view

user        -> none
admin       -> campaign view + marketing metrics
super_admin -> all via existing wildcard
```

Admin mutation/publish remains intentionally restricted until broadened deliberately.

---

## CE1 founder-local evidence

Canonical evidence record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE1_VERIFICATION.md
```

Verified on 2026-09-13:

```text
pnpm api
  -> PASS / API image rebuilt and started

docker compose exec api node --test src/campaignFoundation.test.mjs
  -> PASS 9/9

docker compose exec api npm run db:schema
  -> PASS / 001 through 029 applied

docker compose exec db psql -U prompt_draft -d prompt_draft -c "\dt campaign*"
  -> PASS / 10 expected Campaign tables present
```

The API build emitted an unrelated orphan `prompt-draft-cloudflared-1` warning. No orphan removal or production topology change was performed.

Because only backend/SQL changed, frontend rebuild, `pnpm generate` and `pnpm stack` were correctly not used.

The founder clarified the project convention that a clean-log response of "ظاهرا اوکیه" means no issue is seen and the supplied logs are being handed to engineering for hidden-problem review. The supplied CE1 logs were clean and no hidden blocker was found. CE1 is therefore accepted.

A separate persistence round-trip / direct immutable-version mutation rejection probe remains useful optional hardening evidence, but is not a CE1 acceptance blocker.

---

## Current schema foundation

The first Campaign migration is:

```text
029_campaign_engine_v1.sql
```

Founder-local schema application verified migration 029.

Campaign tables:

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

The next migration number was re-audited before Economy work and became:

```text
030_expiring_promotional_goin.sql
```

Migration 030 is an Economy extension, not a Campaign-owned wallet/schema fork.

Existing systems reused rather than duplicated:

```text
users
user_economy_events
product_analytics_events
admin_audit_log
referrals
user_content_unlocks
other canonical product resources behind Metric Registry resolvers
```

Published `campaign_versions` have DB-level UPDATE/DELETE rejection triggers in migration 029.

---

## Economy prerequisite before CE2

Founder-approved sequencing on 2026-09-13:

```text
CE1 accepted
-> implement Expiring / Promotional Goin V1
-> verify/accept Economy extension locally
-> resume CE2 Runtime Core
```

Implementation commit:

```text
ddff7f0458281ba8abcd57c6a23ff614d5fb3ef5
feat: add expiring promotional Goin
```

Canonical contract:

```text
docs/strategy/EXPIRING_PROMOTIONAL_GOIN_V1.md
```

The Economy work implements the transaction boundary CE2 already required:

```text
backend/src/economyCore.mjs
recordUserEconomyEventInTransaction(client, input, options)
```

Campaign reward correctness still requires one transaction covering:

```text
reward qualification
budget reservation
campaign_reward_grant
user_economy_events credit
reward reconciliation/state/events
```

CE2 must call the transaction-aware Economy primitive inside the Campaign settlement transaction. It must not open a nested independent Economy transaction.

For expiring Campaign rewards, CE2 may issue the same Goin credit with an authoritative server-selected `expiresAt`. Campaign budgets limit how much can be issued; expiry limits how long promotional supply remains spendable.

Do not start CE2 implementation until the Expiring / Promotional Goin V1 local verification is clean.

---

## V1 mechanic target

```text
metric_goal
task_list
custom_game
chance_wheel
custom
```

The registry contract exists in CE1. Individual runtime mechanics are not implied complete by that skeleton.

---

## Remaining implementation roadmap

### CE2 — Runtime Core

Status:

```text
NOT STARTED / BLOCKED ON EXPIRING GOIN LOCAL VERIFICATION
```

Scope:

```text
public campaign projection
optional caller-aware campaign read
participation start/state
metric re-evaluation
client Action protocol
trusted Domain Events
use transaction-aware Economy primitive
Campaign Reward Grant
optional authoritative Campaign reward expiry
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
promotional Goin issued / spent / expired / outstanding reconciliation
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
browser cannot choose reward expiry
browser cannot choose wheel result
browser cannot assert another user identity
one user cannot obtain duplicate V1 participation
same Action retry cannot duplicate effects
parallel completion cannot duplicate reward
parallel daily wheel cannot allocate > configured attempts
reward budget cannot overspend under race
campaign reward maps to exactly one Economy event
expiring campaign reward cannot burn permanent Goin
Product Analytics outage cannot break reward correctness
admin permission boundaries work
preview cannot grant reward
published version remains immutable
published slug remains stable
SSR/public campaign route works EN/FA
global NUXT_PUBLIC_NOINDEX=true still wins during current pre-scale development mode
smallest-scope build/runtime verification passes
```

Do not use historical `pnpm generate` as the default Campaign acceptance command. Select verification from `DEVELOPMENT_WORKFLOW.md` according to actual changed files/services.

---

## Deferred / explicitly out of current slice

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

## Resume instruction

Before any new Campaign implementation:

```text
1. read latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md
3. read CAMPAIGN_ENGINE_V1.md
4. read CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
5. read CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
6. read CAMPAIGN_ENGINE_STATUS.md
7. read CAMPAIGN_ENGINE_CE1_VERIFICATION.md
8. read EXPIRING_PROMOTIONAL_GOIN_V1.md
9. read MILESTONE_21_5_PRE_SCALE_EXECUTION_HANDOFF.md
10. read MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
11. read STATUS.md
```

Current intended state:

```text
CE1 Foundation                -> DONE / VERIFIED / ACCEPTED
Expiring Promotional Goin V1  -> IMPLEMENTED / AWAITING LOCAL VERIFICATION
CE2 Runtime Core              -> NEXT AFTER ECONOMY VERIFICATION
Domain Expansion              -> SCALE-GATED
production runtime            -> ACTIVE
production SEO/indexability   -> DEFERRED
NUXT_PUBLIC_NOINDEX           -> true / KEEP
```

Re-audit database helpers, Economy internals, authorization, Product Analytics and Manage shell again before CE2 because parallel work may change them.

---

## Hard rules

```text
DO NOT create campaign-specific Economy or Analytics systems.
DO NOT create a promotional wallet or second Goin balance.
DO NOT let custom campaign UI bypass runtime contracts.
DO NOT let browser input decide reward amount, reward expiry, winner/result or authoritative user identity.
DO NOT mutate published Campaign Versions.
DO NOT change accepted 21.5 runtime/indexability contracts as a side effect of Campaign work.
DO NOT enable production SEO/indexing during Campaign implementation.
DO NOT change production DNS/Tunnel/Worker/indexability without explicit founder approval.
DO NOT start Domain Expansion implementation during this pre-scale track.
DO NOT start CE2 until Expiring / Promotional Goin V1 local verification is clean.
DO NOT default to pnpm stack; follow the smallest-scope verification workflow.
```
