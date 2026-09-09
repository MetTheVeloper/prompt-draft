# Campaign Engine V1 — Source of Truth

Status: **FOUNDER-DIRECTION APPROVED / CONTRACT V1 DOCUMENTED / IMPLEMENTATION NOT STARTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Parallel strategic context:

```text
Milestone 21.5 Rendering & Organic Acquisition -> IN PROGRESS
Phase 21.5.4D Sitemap / Robots / Discovery Migration -> NEXT
Campaign Engine V1 -> PARALLEL PRODUCT/COMMERCIALIZATION TRACK
```

Companion sources:

```text
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
```

Inherited platform sources:

```text
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_GROWTH_METRICS.md
backend/src/economy.mjs
backend/src/authorization.mjs
```

---

## 1. Purpose

Campaign Engine is a reusable marketing/incentive platform for Grassic / Prompt Draft.

It must allow operators to define campaigns as data, publish immutable campaign versions, run generic or fully custom experiences, measure participation, and safely grant rewards through the existing Goin economy.

The target operator surface is:

```text
/manage/marketing
```

The canonical public campaign route is:

```text
/campaign/:slug
/fa/campaign/:slug
```

The engine must support, without campaign-specific backend forks:

1. a real custom game whose validated winners receive Goin;
2. a seasonal festival such as `/campaign/payiz` with countdown, multi-condition goals and site-wide promotion placements;
3. a daily chance wheel where each authenticated user receives at most one valid spin per configured calendar day.

The architecture must also remain extensible to task lists, quizzes, referral challenges, check-ins, leaderboards, deferred winner selection and future custom mechanics.

---

## 2. Product boundary

Campaign Engine is **not**:

```text
a second wallet
a second analytics warehouse
a generic CMS
a client-side reward system
a hardcoded collection of campaign pages
a raw SQL rule builder
a replacement for Product Analytics
a replacement for admin_audit_log
```

Campaign Engine owns:

```text
campaign definition/versioning
campaign lifecycle
eligibility
participation
mechanic runtime state
attempts
completion/qualification evaluation
campaign-side reward entitlement/grant reconciliation
promotion configuration
campaign-specific trusted domain events
campaign reporting read models
```

Existing systems keep their authority:

```text
user_economy_events
  -> authoritative spendable Goin ledger

product_analytics_events
  -> observational behavioral analytics

admin_audit_log
  -> privileged operator mutation audit

referrals / user_content_unlocks / other product resources
  -> authoritative product facts used by registered campaign metrics
```

---

## 3. Core architecture

```text
Campaign Head
    |
    +-- mutable Draft Definition
    |
    +-- Published Version 1 (immutable)
    +-- Published Version 2 (immutable)
    +-- Published Version N (immutable)
             |
             +-- Experience
             +-- Promotions
             +-- Mechanics
             +-- Completion Rules
             +-- Rewards
             +-- Limits
             +-- Analytics policy
                    |
                    v
             Campaign Runtime
               /    |     \
              /     |      \
       Metric Registry   Mechanic Registry
              \     |      /
               \    |     /
                Completion / Qualification
                         |
                         v
                 Campaign Reward Grant
                         |
                         v
                  Economy Adapter
                         |
                         v
                user_economy_events
```

The campaign is the domain object.

The page, game, wheel, modal and floating banner are renderers/consumers of that domain contract.

---

## 4. Architectural invariants

These rules are frozen for V1 and must not be bypassed by a custom campaign.

### Invariant 1 — Client is never reward authority

The browser may send:

```text
action
intent
evidence
telemetry
```

The backend alone decides:

```text
eligible
accepted
completed
qualified
won
reward amount
reward granted
disqualified
```

### Invariant 2 — Campaign Engine never owns a second Goin balance

All Goin issuance ultimately becomes one append-only `user_economy_events` row through the existing Economy service/ledger contract.

### Invariant 3 — Published versions are immutable

Changing a live/published campaign creates a new version. Historical participation remains attached to the exact version under which it started.

### Invariant 4 — Participation locks to one campaign version

V1 policy:

```text
participationVersionPolicy = lock_on_start
```

### Invariant 5 — Promotion is separate from campaign experience

Header CTA, floating card, modal and dashboard banner are promotion surfaces. They are not the campaign page itself.

### Invariant 6 — Metrics come only from a trusted registry

Admin configuration never stores arbitrary SQL, table names or executable expressions.

### Invariant 7 — Random outcomes are server-authoritative

For a chance wheel or meaningful random reward, the server resolves and persists the outcome before the browser animates it.

### Invariant 8 — Attempts are first-class runtime objects

Games, wheels and other repeatable mechanics use server-created/reserved attempts with explicit period and limit semantics.

### Invariant 9 — Reward issuance is idempotent and budget-safe

Retry or parallel requests cannot create duplicate Goin issuance or overspend a campaign reward budget.

### Invariant 10 — Custom UI uses the same runtime protocol

A custom Vue renderer cannot bypass eligibility, attempt validation, completion, reward, budget or audit rules.

### Invariant 11 — Observational analytics is not campaign authority

`product_analytics_events` may record impressions/clicks/funnel behavior, but cannot prove completion or authorize Goin.

### Invariant 12 — Published slug is durable

A campaign slug may be edited while the campaign has never been published. After first publish, V1 treats the slug as immutable. Future slug migration, if needed, must use an explicit redirect/alias design rather than silently changing the permalink.

---

## 5. Campaign identity and public routing

Canonical identity:

```ts
interface CampaignIdentityV1 {
  slug: string
  internalName: string
}
```

Example:

```text
slug         = payiz
internalName = autumn-festival-2026
```

Public routes:

```text
/campaign/payiz
/fa/campaign/payiz
```

The route is always generic:

```text
/campaign/[slug]
```

Do not implement permalink-specific page files such as:

```text
app/pages/campaign/payiz.vue
```

Custom experience selection occurs through a renderer registry.

---

## 6. Canonical Campaign Definition V1

A published version stores one canonical definition document.

Conceptual TypeScript shape:

```ts
interface CampaignDefinitionV1 {
  schemaVersion: 'campaign.v1'

  identity: {
    slug: string
    internalName: string
  }

  objective: CampaignObjectiveConfig
  lifecycle: CampaignLifecycleConfig
  eligibility: CampaignEligibilityConfig
  experience: CampaignExperienceConfig
  promotions: CampaignPromotionConfig[]
  mechanics: CampaignMechanicInstance[]
  completion: RuleExpression | null
  rewards: CampaignRewardDefinition[]
  limits: CampaignLimits
  analytics: CampaignAnalyticsConfig
  compliance?: CampaignComplianceConfig
}
```

The canonical definition is internal data. It may contain private configuration and must never be returned directly to the browser.

---

## 7. Objective contract

Every campaign records why it exists, even if the public UI never displays this metadata.

```ts
type CampaignObjective =
  | 'acquisition'
  | 'activation'
  | 'education'
  | 'engagement'
  | 'retention'
  | 'reactivation'
  | 'referral'
  | 'conversion'
  | 'monetization'
  | 'other'

interface CampaignObjectiveConfig {
  type: CampaignObjective
  primaryKpi: string
  secondaryKpis?: string[]
  tags?: string[]
}
```

This is marketing metadata, not executable reward logic.

---

## 8. Lifecycle contract

Configured lifecycle:

```ts
interface CampaignLifecycleConfig {
  startsAt: string
  endsAt?: string
  timezone: string
  participationAfterEnd: 'deny' | 'allow_existing_only'
  rewardSettlement: 'immediate' | 'deferred'
}
```

Effective lifecycle states:

```text
DRAFT
SCHEDULED
ACTIVE
PAUSED
ENDED
ARCHIVED
```

V1 should not require a cron job merely to change `SCHEDULED -> ACTIVE -> ENDED`.

Effective state should be derived from:

```text
whether a published version exists
startsAt / endsAt
manual pause
manual end
archive state
```

Priority:

```text
ARCHIVED
  > manually ENDED
  > PAUSED
  > schedule-derived SCHEDULED / ACTIVE / ENDED
  > DRAFT when never published
```

Timezone is mandatory because concepts such as "daily", "end of day" and seasonal deadlines are otherwise ambiguous.

---

## 9. Versioning contract

The campaign head owns a mutable draft.

Publishing creates:

```text
Campaign Version N
```

with:

```text
schemaVersion
definition
definitionHash
versionNumber
publishedAt
publishedBy
```

A published version is immutable.

A campaign may remain active on Version 2 while an operator edits the draft that may later become Version 3.

A participation stores both:

```text
campaignId
campaignVersionId
```

V1 does not migrate an already-started participation to a newer version.

---

## 10. Public/private projection boundary

The canonical definition may contain data that must remain server-only:

```text
reward budget internals
internal KPI metadata
fraud rules
chance weights
private mechanic validation config
server-only renderer/mechanic parameters
internal operator notes
```

Therefore runtime reads use:

```text
Canonical Campaign Definition
           |
           v
Public Projection Builder
           |
           v
Browser-safe Campaign Projection
```

Mechanic config follows the same pattern:

```ts
config: {
  public: Record<string, unknown>
  private?: Record<string, unknown>
}
```

No generic JSON serialization of the canonical definition is allowed in a public endpoint.

---

## 11. Localized experience contract

Campaign copy is versioned data and should support the product's EN/FA public routing model.

```ts
interface CampaignExperienceConfig {
  renderer: RendererRef
  defaultLocale: 'en' | 'fa'
  locales: Array<'en' | 'fa'>
  content: {
    en?: CampaignLocalizedContent
    fa?: CampaignLocalizedContent
  }
  seo?: CampaignSeoConfig
}

interface CampaignLocalizedContent {
  title: string
  subtitle?: string
  description?: string
  body?: string
  ctaLabel?: string
  rewardLabel?: string
  countdownLabel?: string
}
```

Publish validation must require content for every declared locale.

Renderer reference:

```ts
type RendererRef =
  | { kind: 'builtin'; key: string }
  | { kind: 'custom'; key: string }
```

Example:

```json
{
  "kind": "custom",
  "key": "payiz-2026-page"
}
```

Code registry concept:

```ts
campaignRenderers = {
  'payiz-2026-page': PayizCampaignPage,
  'autumn-game-v1': AutumnGameCampaign,
  'wheel-v1': DailyWheelCampaign,
}
```

The persisted definition stores registry keys, never source file paths.

---

## 12. Campaign SEO/indexability policy

A permalink does not automatically imply search indexing.

V1 default:

```text
seo.indexing = noindex
```

Reason: many incentive campaigns are temporary and can create stale/low-value acquisition pages after expiration.

The definition may explicitly select:

```ts
interface CampaignSeoConfig {
  indexing: 'noindex' | 'index'
  canonicalPath?: string
  endBehavior?: 'archive' | 'gone' | 'redirect'
  redirectPath?: string
}
```

An `index` campaign should require explicit operator intent and appropriate content/expiry behavior. Campaign SEO must later integrate with the accepted 21.5 sitemap/robots/indexability policy rather than creating a parallel SEO system.

---

## 13. Eligibility contract

Eligibility answers:

> Is this caller allowed to participate at all?

It is different from completion.

V1 baseline:

```ts
interface CampaignEligibilityConfig {
  authenticated: boolean
  rules?: RuleExpression
}
```

Reward-bearing V1 campaigns should require authenticated participation even when the landing page itself is public.

Identity must always be backend-resolved from the authenticated session/token. Client-supplied `userId` is not accepted as campaign ownership evidence.

---

## 14. Rule expression contract

Completion and eligible advanced rules use a declarative expression tree.

```ts
type RuleExpression =
  | {
      type: 'all'
      rules: RuleExpression[]
    }
  | {
      type: 'any'
      rules: RuleExpression[]
    }
  | {
      type: 'not'
      rule: RuleExpression
    }
  | {
      type: 'condition'
      condition: CampaignCondition
    }
```

V1 condition families:

```ts
type CampaignCondition =
  | MetricCondition
  | MechanicOutcomeCondition

interface MetricCondition {
  source: 'metric'
  metricKey: string
  operator: 'eq' | 'gte' | 'gt' | 'lte' | 'lt'
  value: number
  window: 'lifetime' | 'campaign' | 'since_participation'
}

interface MechanicOutcomeCondition {
  source: 'mechanic_outcome'
  mechanicId: string
  outcome: string
}
```

Nested example:

```text
4 referrals
AND
(
  5 prompt unlocks
  OR
  10 public drafts
)
```

is represented as nested `all` / `any`, not custom code.

---

## 15. Metric Registry

Definitions may reference only stable registry keys.

Conceptual interface:

```ts
interface CampaignMetricDefinition {
  key: string
  valueType: 'count' | 'number' | 'boolean'
  supportedWindows: Array<'lifetime' | 'campaign' | 'since_participation'>
  resolve(context): Promise<number | boolean>
}
```

Candidate V1 registry keys:

```text
referrals.completed.count
prompts.unlocked.count
drafts.public.count
prompts.created.count
```

Known authoritative sources include:

```text
referrals
user_content_unlocks
canonical Draft/Public Prompt resources
```

Exact resolver semantics must be audited before each metric is activated. In particular, `drafts.public.count` must bind to the canonical public-Draft/Prompt publication state that exists at implementation time; the admin must never configure a raw table or SQL fragment.

Window semantics are part of the condition, not an implicit assumption.

Example:

```json
{
  "source": "metric",
  "metricKey": "referrals.completed.count",
  "operator": "gte",
  "value": 4,
  "window": "campaign"
}
```

means referrals completed inside the campaign's version-defined measurement window, not lifetime referrals.

---

## 16. Mechanic Registry

A campaign is a container of one or more mechanic instances.

V1 definition shape:

```ts
interface CampaignMechanicInstance {
  id: string
  type: string
  renderer?: RendererRef
  trustModel?: 'server_authoritative' | 'server_verifiable' | 'client_reported'
  config: {
    public: Record<string, unknown>
    private?: Record<string, unknown>
  }
  attemptPolicy?: AttemptPolicy
}
```

Code-level registry concept:

```ts
interface CampaignMechanicDefinition {
  key: string
  configSchema: unknown
  actionSchemas: Record<string, unknown>
  publicProjection(config): unknown
  validateAction(context): Promise<ValidationResult>
  reduceState(context): Promise<MechanicState>
  evaluateOutcome(context): Promise<MechanicOutcome | null>
}
```

Initial implementation targets:

```text
metric_goal
task_list
custom_game
chance_wheel
custom
```

Future mechanics may include:

```text
quiz
daily_checkin
referral_challenge
leaderboard
random_draw
streak
code_redemption
```

Adding a mechanic must not require changing the Campaign Definition top-level schema.

---

## 17. Action vs trusted domain event

These are deliberately different concepts.

### Client Action

Untrusted input from a browser/custom component:

```text
game_finished
spin_requested
answer_submitted
task_clicked
```

### Trusted Domain Event

Server-confirmed state transition or fact:

```text
participation_started
attempt_created
game_won
wheel_resolved
campaign_completed
campaign_qualified
reward_granted
reward_failed
campaign_disqualified
```

A client action may be rejected and therefore produce no success domain event.

---

## 18. Runtime action contract

Conceptual request:

```ts
interface CampaignActionInput {
  mechanicId: string
  action: string
  idempotencyKey: string
  payload?: Record<string, unknown>
  evidence?: Record<string, unknown>
}
```

Example:

```json
{
  "mechanicId": "autumn-game",
  "action": "game_finished",
  "idempotencyKey": "game-finish:attempt_xyz",
  "payload": {
    "score": 840
  },
  "evidence": {
    "attemptId": "attempt_xyz"
  }
}
```

The server resolves campaign, version, participation and authenticated user. The client does not select reward amount or trusted outcome.

---

## 19. Attempt contract

Repeatable mechanics use attempts.

```ts
interface AttemptPolicy {
  maxAttempts: number
  period: 'campaign' | 'calendar_day' | 'rolling_24h' | 'session'
  timezone?: string
}
```

If `period = calendar_day`, timezone is required.

Example daily wheel:

```json
{
  "maxAttempts": 1,
  "period": "calendar_day",
  "timezone": "Asia/Tehran"
}
```

Attempt reservation must be atomic. Parallel browser requests cannot obtain two attempt slots for the same period.

---

## 20. Reward contract

V1 implements only Goin rewards, while keeping a typed extension point.

```ts
interface CampaignRewardDefinition {
  id: string
  type: 'goin'
  amount: number
  trigger: RewardTrigger
  perUserLimit?: number
  budget?: {
    maxAmount: number
  }
}

type RewardTrigger =
  | { type: 'campaign_completion' }
  | {
      type: 'mechanic_outcome'
      mechanicId: string
      outcome: string
    }
```

Example wheel may define multiple outcome-specific reward definitions:

```text
outcome goin_10  -> reward 10 Goin
outcome goin_20  -> reward 20 Goin
outcome jackpot  -> reward 100 Goin
outcome retry    -> no reward definition
```

The browser never sends `amount` as authoritative runtime input.

---

## 21. Reward settlement and Economy integration

Required flow:

```text
validated campaign state
        |
        v
reward qualification
        |
        v
lock campaign reward budget
        |
        v
create/reserve Campaign Reward Grant
        |
        v
record Goin economy event
        |
        v
link economy event to Reward Grant
        |
        v
append trusted reward_granted event
```

Campaign Engine must reuse `user_economy_events`.

Proposed economy event semantics:

```text
event_type  = campaign_reward_issued
source_type = campaign_reward
source_id   = <campaign_reward_grant.id>
unit_delta  = positive reward amount
```

Stable Economy idempotency key concept:

```text
campaign:reward:v1:<campaignVersionId>:<participationId>:<rewardDefinitionId>:<qualificationKey>
```

### Existing Economy refactor requirement

The current `recordUserEconomyEvent()` opens its own database transaction.

Before Campaign reward issuance can be fully atomic with budget reservation and `campaign_reward_grants`, Economy must expose/refactor an **internal transaction-aware primitive** that can use an existing transaction executor/client while preserving all current validation, user locking, balance and idempotency semantics.

Required direction:

```text
recordUserEconomyEventInTransaction(client, input)
```

or an equivalent executor-aware internal API.

The existing public/service behavior must remain backward compatible.

Do not implement nested independent transactions for one logical campaign reward grant.

---

## 22. Campaign budget contract

Global reward budgets are security/business constraints, not analytics counters.

For each budgeted reward definition, runtime maintains a transactional budget guard.

Conceptual state:

```text
maxAmount
committedAmount
actuallyGrantedAmount
```

Invariant:

```text
0 <= actuallyGrantedAmount <= committedAmount <= maxAmount
```

Qualification first reserves/commits capacity under a row lock. A failed/cancelled grant releases capacity when appropriate.

A `SUM()` query without a lock is not sufficient for concurrent budget enforcement.

---

## 23. Promotion Surface contract

Promotion answers:

> How does the user discover/enter the campaign?

A campaign may have zero or many promotions.

```ts
interface CampaignPromotionConfig {
  id: string
  slot:
    | 'site_header'
    | 'floating_corner'
    | 'modal'
    | 'dashboard_banner'

  renderer: RendererRef

  schedule?: {
    startsAt?: string
    endsAt?: string
  }

  dismiss?: {
    enabled: boolean
    persistence: 'session' | 'device' | 'user'
    ttlSeconds?: number
  }

  frequencyCap?: {
    maxImpressions: number
    period: 'session' | 'day' | 'campaign'
  }

  priority?: number
}
```

App shell integration direction:

```vue
<CampaignPlacement slot="site_header" />
<CampaignPlacement slot="dashboard_banner" />
<CampaignOverlayHost />
```

`CampaignOverlayHost` may render floating cards/modals without campaign-specific conditionals in global layout code.

Dismissing a promotion does not end or cancel campaign participation.

For V1:

```text
session/device dismissal -> local client persistence is acceptable
user dismissal           -> authenticated server-backed state
```

Promotion frequency caps are presentation controls, not financial/security authority.

---

## 24. Attribution contract

When a campaign landing/start is attributable to a promotion/source, preserve first participation attribution:

```ts
interface CampaignAttribution {
  source?: string
  medium?: string
  campaign?: string
  placement?: string
  referrer?: string
}
```

Example placements:

```text
site_header
floating_corner
modal
email
social
```

Attribution data must be bounded and allowlisted; do not persist arbitrary sensitive URL/query payloads.

---

## 25. Analytics and authoritative facts

Two layers intentionally coexist.

### Observational Product Analytics

Suitable for:

```text
promotion_impression
promotion_clicked
promotion_dismissed
campaign_landing_view
```

These may be added to the existing Product Analytics allowlist when implemented.

Analytics delivery failure must never affect participation or reward state.

### Campaign Domain Events

Authoritative server-confirmed facts:

```text
campaign_eligible
campaign_started
campaign_progressed
campaign_completed
campaign_qualified
campaign_disqualified
attempt_created
attempt_resolved
game_won
wheel_resolved
reward_granted
reward_failed
```

These are persisted by Campaign Engine and may be used for campaign audit/reconciliation/read models.

Campaign metrics should prefer authoritative relational/domain facts whenever they exist, following the same measurement-honesty principle established by Growth Metrics.

---

## 26. Admin management model

Target route:

```text
/manage/marketing
```

This must reuse the existing `/manage` shell.

Recommended campaign list states:

```text
Draft
Scheduled
Active
Paused
Ended
Archived
```

Recommended editor sections:

```text
1. Basics
2. Objective
3. Schedule
4. Eligibility
5. Experience
6. Promotions
7. Mechanics
8. Completion Rules
9. Rewards
10. Limits & Budget
11. Analytics
12. Terms / Compliance
13. Preview
14. Publish
```

Recommended campaign detail tabs:

```text
Overview
Funnel
Participants
Mechanics
Rewards
Promotions
Versions
Audit
```

No second dashboard shell should be introduced.

---

## 27. Authorization direction

Do not reuse `system.settings.manage` merely because Campaigns live under `/manage`.

Proposed permissions:

```text
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view
```

Safe initial role direction:

```text
user        -> none
admin       -> view + marketing metrics only
super_admin -> all via existing wildcard
```

Campaign mutation/publish access can be broadened later explicitly. Navigation visibility is not the security boundary; every API mutation checks backend permission.

---

## 28. Publish validation

Publish must fail when the definition violates its contracts.

Examples:

```text
unknown schemaVersion
invalid/changed published slug
missing declared locale content
unknown renderer key
unknown mechanic key
invalid mechanic config
unknown metric key
unsupported metric window
invalid rule expression
reward references missing mechanic/outcome
Goin reward amount <= 0
budget smaller than already committed grants
daily attempt policy without timezone
chance mechanic exposes private weights in public projection
indexable campaign lacks valid end/indexability behavior
```

Preview may operate on an unpublished draft but must never grant real reward or consume real attempts.

---

## 29. Custom game scenario

Example:

```text
/campaign/autumn-game
```

Flow:

```text
Landing
  -> authenticated participation
  -> server creates/reserves game attempt
  -> custom game renderer starts
  -> renderer emits game_finished action + evidence
  -> server mechanic validates attempt/result
  -> server derives outcome WIN / LOSS
  -> WIN satisfies mechanic outcome condition
  -> reward qualification
  -> atomic budget + Goin grant
```

The game may emit:

```json
{
  "action": "game_finished",
  "payload": { "score": 920 },
  "evidence": { "attemptId": "..." }
}
```

It may not authoritatively emit:

```text
won = true
reward = 500
```

and expect the server to trust those values.

Reward-bearing games should use:

```text
server_authoritative
or
server_verifiable
```

trust models.

`client_reported` is not sufficient for a meaningful financial-like reward without additional server verification.

---

## 30. Payiz seasonal festival scenario

Public page:

```text
/campaign/payiz
/fa/campaign/payiz
```

Experience may display:

```text
title
description
remaining-time countdown
reward information
per-goal progress
```

Completion:

```text
ANY
  referrals.completed.count >= 4 during campaign
  prompts.unlocked.count >= 5 during campaign
  drafts.public.count >= 10 during campaign
```

Conceptual definition fragment:

```json
{
  "type": "any",
  "rules": [
    {
      "type": "condition",
      "condition": {
        "source": "metric",
        "metricKey": "referrals.completed.count",
        "operator": "gte",
        "value": 4,
        "window": "campaign"
      }
    },
    {
      "type": "condition",
      "condition": {
        "source": "metric",
        "metricKey": "prompts.unlocked.count",
        "operator": "gte",
        "value": 5,
        "window": "campaign"
      }
    },
    {
      "type": "condition",
      "condition": {
        "source": "metric",
        "metricKey": "drafts.public.count",
        "operator": "gte",
        "value": 10,
        "window": "campaign"
      }
    }
  ]
}
```

The same campaign may simultaneously configure:

```text
site_header CTA
floating dismissible autumn card
custom modal
```

without adding Payiz-specific branches to the app shell.

---

## 31. Daily chance-wheel scenario

Mechanic:

```text
chance_wheel
```

Attempt policy:

```text
1 attempt / calendar day / authenticated user / configured timezone
```

Correct flow:

```text
user requests spin
  -> backend locks participation/attempt allocation boundary
  -> backend atomically reserves today's attempt
  -> server RNG selects outcome using private config
  -> outcome is persisted
  -> reward is atomically qualified/granted when applicable
  -> API returns already-resolved outcome
  -> browser animates wheel to that outcome
```

The animation never chooses the winner.

Public mechanic config may include:

```text
segment keys
labels
visual order
animation hints
```

Private config may include:

```text
weights
inventory limits
fraud controls
server validation parameters
```

Private values never enter public projection.

---

## 32. Deferred settlement

The contract must support future campaigns where the winner is selected after participation closes.

Example:

```text
accept game scores for one week
  -> close entries
  -> select top 10 valid scores
  -> settle winners
  -> grant rewards
```

This uses:

```text
rewardSettlement = deferred
```

V1 implementation may initially ship only immediate settlement, but the persistence/API design must not make deferred settlement impossible.

---

## 33. Compliance metadata

Chance/reward campaigns may have jurisdiction-specific requirements. The engine must have a place for campaign policy metadata without pretending to decide legal compliance itself.

```ts
interface CampaignComplianceConfig {
  termsUrl?: string
  minimumAge?: number
  countries?: string[]
  disclosure?: string
}
```

A future legal/compliance review may impose stronger requirements for random-chance promotions depending on jurisdiction and reward characteristics.

---

## 34. V1 implementation scope

First implementation should deliberately avoid a schema-monster.

### Required V1 foundation

```text
Campaign CRUD draft head
immutable publish versions
schema validation
public/private projection
canonical /campaign/[slug] + /fa/campaign/[slug]
participation lock-on-start
Metric Registry
Mechanic Registry
RuleExpression evaluator
trusted campaign actions/events
attempt primitive
Goin reward adapter
atomic reward budget guard
basic promotion selection
authenticated user promotion dismissal
basic /manage/marketing
basic funnel/reward reconciliation reads
```

### First mechanics

```text
metric_goal
task_list
custom_game
chance_wheel
custom
```

### Explicitly deferred until evidence requires them

```text
A/B experimentation engine
advanced segmentation builder
external social-platform verification
leaderboard product UI
random draw settlement UI
cross-campaign orchestration
coupon/fiat rewards
creator-funded campaigns
external ad network integrations
complex workflow designer
```

---

## 35. Recommended implementation slices

```text
CE1 — Foundation
  migration 029
  campaign head/version persistence
  definition validator
  permissions
  registries

CE2 — Runtime Core
  public projection
  participation
  rules/metrics
  actions/domain events
  Goin reward adapter
  reward budget atomicity

CE3 — Promotion Surfaces
  promotion API
  app-shell placements
  dismiss state
  observational analytics

CE4 — Custom Mechanics
  custom game attempt contract
  chance wheel server RNG
  daily attempt enforcement

CE5 — Manage Marketing
  /manage/marketing list/editor
  preview/validate/publish
  lifecycle controls

CE6 — Measurement & Reconciliation
  funnel summary
  participant/reward inspection
  budget remaining
  economy transaction trace

CE7 — Verification
  concurrency/idempotency/security/local UI/build verification
```

Campaign work may proceed in parallel with 21.5 only when it does not silently change an accepted 21.5 public/SEO contract. Shared route/indexability changes must respect the active 21.5 source of truth.

---

## 36. Hard rules

```text
DO NOT create a second Goin wallet or balance.
DO NOT let the browser choose a Goin amount.
DO NOT let a custom renderer bypass Campaign Runtime.
DO NOT treat client Actions as trusted Domain Events.
DO NOT use product_analytics_events as completion/reward authority.
DO NOT store raw SQL in Campaign Definition.
DO NOT expose private mechanic config in public projection.
DO NOT mutate published Campaign Versions.
DO NOT silently move an existing participation to a new version.
DO NOT implement chance-wheel RNG in the browser.
DO NOT enforce a daily limit without an explicit timezone.
DO NOT enforce global reward budget with an unlocked read-then-write race.
DO NOT open an independent nested Economy transaction for one logical Campaign reward.
DO NOT hardcode campaign-specific conditions into the global app shell.
DO NOT change a published slug without a future explicit redirect/alias contract.
DO NOT create another /manage shell or another analytics warehouse.
```

---

## 37. Current result

The Campaign Engine V1 architecture is now defined as a platform contract rather than a collection of promotional pages.

The three founder examples are directly representable by the same model:

```text
Custom game
  -> custom_game mechanic + attempt + server-validated outcome + Goin reward

Payiz festival
  -> metric conditions + ANY expression + countdown experience + multiple promotion surfaces + Goin reward

Daily wheel
  -> chance_wheel mechanic + calendar-day attempt + server RNG + outcome-specific Goin reward
```

Implementation must start from the DB/API companion contracts and preserve the invariants in this document.