# Campaign Engine V1 — Database Schema Design

Status: **DESIGN CONTRACT / IMPLEMENTATION NOT STARTED**

Date: 2026-09-09

Branch:

```text
feature/growth-foundation
```

Primary source:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
```

API/runtime companion:

```text
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
```

Current branch migration ceiling:

```text
028_seed_profile_skill_taxonomy.sql
```

Reserved implementation direction:

```text
029_campaign_engine_v1.sql
```

This document designs the migration. It does **not** claim migration 029 currently exists.

---

## 1. Schema strategy

Campaign Engine has two very different data shapes and should not force both into the same persistence style.

### Configuration is polymorphic and versioned

Use an immutable canonical JSONB document for each published campaign version:

```text
campaign_versions.definition JSONB
```

Reason:

```text
mechanics differ by type
rules are recursive expression trees
promotions are polymorphic
custom renderer config evolves
private/public mechanic config varies
```

Normalizing every configuration node into many relational tables would make V1 brittle and require schema migrations for ordinary mechanic evolution.

### Runtime authority is transactional

Normalize state that participates in concurrency, idempotency, audit or reconciliation:

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

This is the core persistence rule:

> Flexible immutable definition in JSONB; explicit relational runtime facts for anything that can grant value, race, be retried, or require audit.

---

## 2. Existing tables to reuse

Campaign Engine must integrate with, not duplicate:

```text
users
user_economy_events
product_analytics_events
admin_audit_log
referrals
user_content_unlocks
prompt_drafts / public Prompt resources as applicable
```

No schema should introduce:

```text
campaign_goin_balance
campaign_wallet
campaign_analytics_events_duplicate_of_product_analytics
```

---

## 3. `campaigns`

Purpose:

```text
stable campaign identity
mutable working draft
pointer to current published version
manual lifecycle overrides
operator provenance
```

Proposed shape:

```sql
campaigns
  id UUID PRIMARY KEY
  slug TEXT NOT NULL UNIQUE
  internal_name TEXT NOT NULL
  draft_definition JSONB NOT NULL DEFAULT '{}'::jsonb
  draft_revision BIGINT NOT NULL DEFAULT 1
  current_published_version_id UUID NULL
  paused_at TIMESTAMPTZ NULL
  manually_ended_at TIMESTAMPTZ NULL
  archived_at TIMESTAMPTZ NULL
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
  updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Recommended constraints:

```text
slug normalized lowercase URL-safe token
internal_name non-empty and bounded
draft_revision >= 1
```

Recommended slug contract:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Suggested maximum:

```text
slug <= 100 chars
internal_name <= 160 chars
```

`current_published_version_id` is added as a foreign key after `campaign_versions` exists to avoid migration-order circularity.

Recommended FK:

```sql
FOREIGN KEY (current_published_version_id)
REFERENCES campaign_versions(id)
ON DELETE RESTRICT
```

### Why no stored `status` column?

`SCHEDULED`, `ACTIVE` and schedule-derived `ENDED` are time-dependent projections. Storing them requires cron reconciliation and invites drift.

Effective state is derived from:

```text
published version existence
version lifecycle.startsAt
version lifecycle.endsAt
paused_at
manually_ended_at
archived_at
```

Manual override timestamps are durable facts; effective status is a read model.

### Slug immutability

Before first publish:

```text
slug may change
```

After first publish:

```text
slug is immutable in V1
```

Enforce in application validation initially. A future DB trigger may harden this if needed.

---

## 4. `campaign_versions`

Purpose:

```text
immutable published Campaign Definition snapshots
historical contract for each participation
```

Proposed shape:

```sql
campaign_versions
  id UUID PRIMARY KEY
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT
  version_number INTEGER NOT NULL CHECK (version_number > 0)
  schema_version TEXT NOT NULL
  definition JSONB NOT NULL
  definition_hash TEXT NOT NULL
  published_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  UNIQUE (campaign_id, version_number)
```

Required schema version in V1:

```text
campaign.v1
```

`definition_hash` should be SHA-256 over a deterministic/canonical JSON serialization used by backend validation/publish code.

Use:

```text
64 lowercase hexadecimal characters
```

for the persisted hash representation.

Recommended indexes:

```sql
(campaign_id, version_number DESC)
(published_at DESC)
```

### Immutability

No normal update/delete path exists for a published row.

V1 must enforce immutability in service code. Stronger DB hardening is recommended either in migration 029 or a follow-up once local verification proves operational compatibility:

```text
reject UPDATE of definition/schema_version/version_number
reject DELETE of published version
```

The safest eventual DB rule is an immutable-row trigger with no application bypass outside migrations/maintenance.

---

## 5. Publish transaction

Publishing must be one database transaction.

Conceptual sequence:

```text
BEGIN
  lock campaigns row FOR UPDATE
  verify draft_revision / optimistic concurrency token
  validate complete Campaign Definition
  enforce slug immutability
  calculate next version_number
  calculate definition_hash
  INSERT campaign_versions
  UPDATE campaigns.current_published_version_id
  clear manual end/archive only when explicitly valid for publish flow
  write admin audit event through existing audit mechanism
COMMIT
```

A publish retry must not create accidental duplicate versions. The admin API should use an idempotency/revision contract described in the API source.

---

## 6. `campaign_participations`

Purpose:

```text
one authenticated user's V1 participation in one campaign
version lock
campaign progress summary
qualification/reward lifecycle
first attribution
```

Proposed shape:

```sql
campaign_participations
  id UUID PRIMARY KEY
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  status TEXT NOT NULL
  attribution JSONB NOT NULL DEFAULT '{}'::jsonb
  state JSONB NOT NULL DEFAULT '{}'::jsonb
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  last_progress_at TIMESTAMPTZ NULL
  completed_at TIMESTAMPTZ NULL
  qualified_at TIMESTAMPTZ NULL
  rewarded_at TIMESTAMPTZ NULL
  disqualified_at TIMESTAMPTZ NULL
  expired_at TIMESTAMPTZ NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  UNIQUE (campaign_id, user_id)
```

V1 statuses:

```text
started
in_progress
completed
qualified
rewarded
disqualified
expired
reward_failed
```

`eligible` is primarily a computed pre-participation state and does not need a participation row before the user starts.

Recommended status CHECK uses the exact allowlist above.

### Why `UNIQUE(campaign_id, user_id)`?

V1 models one participation per campaign. Repeated play/spin happens through `campaign_attempts`, not by creating a new participation every time.

If a future campaign requires multiple independent entries/participations, it needs an explicit participation policy and a schema evolution rather than silently weakening the V1 invariant.

### Version consistency

Service validation must guarantee:

```text
campaign_version_id belongs to campaign_id
```

For stronger DB integrity, add a unique composite key on `campaign_versions (campaign_id, id)` and use a composite FK from participation if desired. A single UUID FK plus service assertion is acceptable for initial implementation, but composite FK hardening is preferred if migration complexity remains low.

### `state` JSONB

`state` is a materialized campaign-level progress summary for efficient reads, not the sole audit source.

Trusted historical transitions remain reconstructable from relational rows/domain events where required.

Do not put secrets or unbounded client evidence in this field.

Recommended indexes:

```sql
(campaign_id, started_at DESC)
(campaign_id, status, updated_at DESC)
(user_id, started_at DESC)
(campaign_version_id, status)
```

---

## 7. `campaign_actions`

Purpose:

```text
bounded audit/deduplication record for untrusted client runtime actions
```

Proposed shape:

```sql
campaign_actions
  id UUID PRIMARY KEY
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE
  mechanic_id TEXT NOT NULL
  action_name TEXT NOT NULL
  idempotency_key TEXT NOT NULL
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb
  accepted BOOLEAN NOT NULL
  rejection_code TEXT NULL
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  UNIQUE (participation_id, idempotency_key)
```

Recommended bounds in application validation:

```text
mechanic_id <= 100 chars
action_name <= 100 chars
idempotency_key <= 240 chars
payload/evidence request-body ceilings
allowlisted fields per mechanic/action schema
```

Do not persist arbitrary browser blobs, Prompt bodies, credentials, tokens, raw device fingerprints or unrelated PII.

A duplicate `idempotency_key` returns the existing logical result rather than replaying business effects.

Recommended indexes:

```sql
(participation_id, received_at DESC)
(action_name, received_at DESC)
```

---

## 8. `campaign_events`

Purpose:

```text
append-only trusted Campaign Domain Events
server-confirmed runtime/audit facts
```

Proposed shape:

```sql
campaign_events
  id UUID PRIMARY KEY
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT
  participation_id UUID NULL REFERENCES campaign_participations(id) ON DELETE CASCADE
  mechanic_id TEXT NULL
  event_name TEXT NOT NULL
  source_action_id UUID NULL REFERENCES campaign_actions(id) ON DELETE SET NULL
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Initial trusted event taxonomy:

```text
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

Do not blindly mirror every Product Analytics event here.

Anonymous impressions/clicks remain observational Product Analytics; trusted campaign events exist because they drive/reconcile state.

Recommended indexes:

```sql
(campaign_id, event_name, created_at DESC)
(campaign_version_id, created_at DESC)
(participation_id, created_at DESC)
(source_action_id) WHERE source_action_id IS NOT NULL
```

Campaign events should be append-only. Corrections occur through new events/state transitions, not rewriting historical event meaning.

---

## 9. `campaign_mechanic_states`

Purpose:

```text
materialized state for one mechanic instance inside one participation
```

Proposed shape:

```sql
campaign_mechanic_states
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE
  mechanic_id TEXT NOT NULL
  state JSONB NOT NULL DEFAULT '{}'::jsonb
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  PRIMARY KEY (participation_id, mechanic_id)
```

This row is a convenient concurrency boundary for mechanic-specific state.

Runtime may use:

```text
SELECT ... FOR UPDATE
```

on this row when reducing mechanic state.

`revision` supports optimistic UI/read conflict handling and helps prevent stale writes.

Do not persist private reusable mechanic secrets here unless unavoidable; store only runtime-private state needed for validation, and never expose the row generically through public APIs.

---

## 10. `campaign_attempts`

Purpose:

```text
server-authoritative attempt allocation for game/wheel/repeatable mechanics
period limit enforcement
outcome persistence
```

Proposed shape:

```sql
campaign_attempts
  id UUID PRIMARY KEY
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE
  mechanic_id TEXT NOT NULL
  period_key TEXT NOT NULL
  attempt_index INTEGER NOT NULL CHECK (attempt_index > 0)
  status TEXT NOT NULL
  idempotency_key TEXT NOT NULL
  private_context JSONB NOT NULL DEFAULT '{}'::jsonb
  outcome JSONB NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  started_at TIMESTAMPTZ NULL
  submitted_at TIMESTAMPTZ NULL
  resolved_at TIMESTAMPTZ NULL
  expires_at TIMESTAMPTZ NULL

  UNIQUE (participation_id, mechanic_id, idempotency_key)
  UNIQUE (participation_id, mechanic_id, period_key, attempt_index)
```

V1 attempt statuses:

```text
reserved
started
submitted
resolved
expired
rejected
```

### Period key

Examples:

```text
campaign
calendar:Asia/Tehran:2026-09-09
rolling:<server-defined-window-id>
session:<server/session-bound-id>
```

The exact serialized format is internal and versioned by implementation. It must be server-generated, not client-authoritative.

### Concurrent allocation

To allocate attempt N safely:

```text
BEGIN
  lock participation or mechanic-state row FOR UPDATE
  derive server period_key
  count/read existing valid attempts for period
  reject when maxAttempts reached
  choose next attempt_index
  INSERT attempt
COMMIT
```

The unique constraint is the final race backstop; the lock is the normal serialization contract.

For `maxAttempts = 1`, the only allowed `attempt_index` is 1 for the period.

### Chance-wheel outcome

For a wheel:

```text
server selects outcome
outcome persisted in campaign_attempts.outcome
reward transaction performed as required
the response returns persisted outcome
browser animates to it
```

Do not store plaintext secrets merely to prove randomness. If a future verifiable-random protocol is introduced, define a dedicated cryptographic contract rather than improvising inside JSON.

Recommended indexes:

```sql
(participation_id, mechanic_id, created_at DESC)
(participation_id, mechanic_id, period_key)
(status, expires_at) WHERE status IN ('reserved', 'started', 'submitted')
```

---

## 11. `campaign_reward_budgets`

Purpose:

```text
transactional global reward-budget guard per published version/reward definition
```

Proposed shape:

```sql
campaign_reward_budgets
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT
  reward_definition_id TEXT NOT NULL
  max_amount BIGINT NOT NULL CHECK (max_amount >= 0)
  committed_amount BIGINT NOT NULL DEFAULT 0 CHECK (committed_amount >= 0)
  granted_amount BIGINT NOT NULL DEFAULT 0 CHECK (granted_amount >= 0)
  grant_count BIGINT NOT NULL DEFAULT 0 CHECK (grant_count >= 0)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  PRIMARY KEY (campaign_version_id, reward_definition_id)
```

Required invariant:

```sql
granted_amount <= committed_amount
AND committed_amount <= max_amount
```

Implement as CHECK constraints where supported by the row values:

```sql
CHECK (granted_amount <= committed_amount)
CHECK (committed_amount <= max_amount)
```

Semantics:

```text
committed_amount
  = capacity currently reserved by pending grants + capacity already granted

granted_amount
  = successfully issued amount
```

Qualification transaction:

```text
lock budget row FOR UPDATE
ensure committed_amount + reward <= max_amount
increment committed_amount
create pending reward grant
```

Successful grant:

```text
increment granted_amount
increment grant_count
committed_amount remains unchanged
```

Released failed/cancelled pending grant:

```text
decrement committed_amount
```

A non-budgeted reward does not require a budget row. If V1 wants every Goin reward explicitly budgeted, publish validation may require this row for all Goin rewards; that product policy can be tightened without changing schema.

---

## 12. `campaign_reward_grants`

Purpose:

```text
campaign-side authoritative reward entitlement/grant record
economy reconciliation
retry-safe qualification identity
```

Proposed shape:

```sql
campaign_reward_grants
  id UUID PRIMARY KEY
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT
  participation_id UUID NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  reward_definition_id TEXT NOT NULL
  qualification_key TEXT NOT NULL
  reward_type TEXT NOT NULL
  amount BIGINT NOT NULL CHECK (amount > 0)
  status TEXT NOT NULL
  economy_event_id UUID NULL REFERENCES user_economy_events(id) ON DELETE SET NULL
  qualification JSONB NOT NULL DEFAULT '{}'::jsonb
  failure_code TEXT NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  granted_at TIMESTAMPTZ NULL
  failed_at TIMESTAMPTZ NULL
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  UNIQUE (participation_id, reward_definition_id, qualification_key)
```

V1 reward type:

```text
goin
```

V1 statuses:

```text
pending
granted
failed
cancelled
exhausted
disqualified
```

Recommended unique partial index:

```sql
UNIQUE (economy_event_id)
WHERE economy_event_id IS NOT NULL
```

Recommended indexes:

```sql
(campaign_id, status, created_at DESC)
(campaign_version_id, reward_definition_id, status)
(user_id, created_at DESC)
(economy_event_id) WHERE economy_event_id IS NOT NULL
```

### Qualification key

The qualification key distinguishes legitimate repeated rewards under one definition while preserving idempotency.

Examples:

```text
campaign_completion
wheel:calendar:Asia/Tehran:2026-09-09:attempt:1
game:attempt:<attempt-id>:win
```

It is server-generated.

The matching Economy idempotency key should deterministically include the grant identity or the same stable qualification tuple.

---

## 13. Atomic Goin reward transaction

For local Goin, all relevant tables are in the same PostgreSQL database. V1 should exploit that and make one logical reward one database transaction.

Required transaction shape:

```text
BEGIN
  lock canonical users row using Economy's existing serialization contract
  lock campaign_reward_budgets row if budgeted
  find existing campaign_reward_grant qualification

  if already granted
    return existing result

  if new qualification
    reserve budget capacity
    insert pending campaign_reward_grant

  insert/reuse idempotent user_economy_events credit
  link campaign_reward_grant.economy_event_id
  mark reward grant granted
  update budget granted_amount/grant_count
  update participation reward state when applicable
  append reward_granted campaign event
COMMIT
```

### Required Economy refactor

Current `recordUserEconomyEvent()` owns its transaction internally.

Campaign implementation must first extract or expose an internal primitive that accepts the existing transaction client/executor while preserving current behavior:

```text
validate economy event
lock user
check economy idempotency key
validate source provenance where relevant
calculate balance
insert append-only event
return mapped economy state
```

The existing exported behavior should continue to work by wrapping that internal primitive in `withDatabaseTransaction(...)`.

Campaign Runtime then calls the transaction-aware primitive from its already-open reward transaction.

Do not attempt to coordinate two independent transactions and call the result atomic.

---

## 14. Economy event contract for campaign rewards

Proposed existing-ledger row:

```text
user_economy_events.event_type      = campaign_reward_issued
user_economy_events.unit_delta      = positive integer
user_economy_events.source_type     = campaign_reward
user_economy_events.source_id       = campaign_reward_grants.id
user_economy_events.idempotency_key = deterministic campaign reward key
```

Suggested metadata:

```json
{
  "campaignId": "...",
  "campaignVersionId": "...",
  "participationId": "...",
  "rewardDefinitionId": "completion-100",
  "qualificationKey": "campaign_completion",
  "schemaVersion": "campaign.v1"
}
```

Do not place canonical Campaign Definition, client evidence, private mechanic config or sensitive PII in Economy metadata.

`campaign_reward_grants.economy_event_id` creates direct reconciliation in both directions.

---

## 15. `campaign_promotion_user_states`

Purpose:

```text
authenticated user-level durable promotion dismissal state
```

Proposed shape:

```sql
campaign_promotion_user_states
  campaign_version_id UUID NOT NULL REFERENCES campaign_versions(id) ON DELETE RESTRICT
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  promotion_id TEXT NOT NULL
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  dismiss_until TIMESTAMPTZ NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

  PRIMARY KEY (campaign_version_id, user_id, promotion_id)
```

Why version-scoped?

A promotion with stable ID `autumn-floating` may materially change in a later published campaign version. V1 chooses explicit version scoping rather than silently applying a dismissal to a new offer/version.

If product testing later shows dismissal should survive versions, introduce an explicit persistence policy rather than overloading the primary key semantics.

Session/device dismissal:

```text
client local/session persistence in V1
```

Do not build an anonymous server fingerprint/dismissal identity merely for this feature.

Promotion impressions/clicks are not stored here. They belong in observational Product Analytics when instrumented.

---

## 16. Admin audit reuse

Campaign operator mutations should use existing `admin_audit_log` rather than invent a campaign admin-audit table.

Candidate audit actions:

```text
marketing.campaign_created
marketing.campaign_draft_updated
marketing.campaign_published
marketing.campaign_paused
marketing.campaign_resumed
marketing.campaign_ended
marketing.campaign_archived
```

Audit metadata should contain identifiers and safe before/after summaries, not full private Campaign Definitions when unnecessary.

---

## 17. Product Analytics reuse

Observational events may be added to existing `product_analytics_events` allowlist:

```text
campaign_promotion_impression
campaign_promotion_click
campaign_promotion_dismiss
campaign_landing_view
```

Resource concept:

```text
resource_type = campaign
resource_id   = stable campaign slug or id according to the final analytics convention
```

Campaign implementation must pick one stable convention and document it before instrumentation.

These rows are never used to authorize Goin.

---

## 18. Definition JSONB indexing

Do **not** add a broad GIN index to `campaign_versions.definition` in V1 by default.

Primary runtime lookup should use normalized columns:

```text
campaigns.slug
campaigns.current_published_version_id
campaign_versions.campaign_id/version_number
```

Campaign Definition JSON is loaded by ID and validated in application code.

Only add JSONB indexes later if a real admin/query use case demonstrates need.

---

## 19. Referential deletion policy

V1 normal product behavior is archive, not hard-delete, for published campaigns.

Recommended policy:

```text
campaigns              -> never hard-delete once published through normal API
campaign_versions      -> RESTRICT from campaign deletion
participations         -> CASCADE on user hard delete, RESTRICT campaign/version deletion
runtime child rows     -> CASCADE with participation when appropriate
reward economy link    -> SET NULL if referenced economy row is removed through user cascade
```

This aligns campaign cleanup with existing user-owned data behavior while preventing accidental destruction of published campaign contracts.

If future privacy/compliance policy requires stronger retention/anonymization semantics, treat that as a deliberate policy migration.

---

## 20. Transaction/concurrency boundaries

### Start participation

```text
lock campaign head/current version as needed
resolve effective campaign status
check eligibility
check existing participation
insert once under UNIQUE(campaign_id,user_id)
```

### Reduce mechanic state

```text
lock campaign_mechanic_states row or participation row
validate action against exact campaign version
reduce state
append trusted event(s)
update materialized state
```

### Allocate attempt

```text
lock participation/mechanic state
compute server period key
count existing valid attempts
insert next attempt index
```

### Grant reward

```text
lock user
lock budget row
upsert/find grant qualification
record economy event through same DB transaction
link/reconcile
```

Lock acquisition order should be standardized to minimize deadlocks.

Recommended order when all are needed:

```text
1. campaign/participation logical row
2. mechanic/attempt allocation row
3. canonical user row
4. reward budget row
5. reward grant/economy inserts
```

Before implementation, review Economy's existing user-lock ordering and choose one canonical cross-module order. Do not casually mix lock orders between Campaign and Economy paths.

---

## 21. Idempotency matrix

| Operation | Idempotency boundary |
| --- | --- |
| Start participation | `UNIQUE(campaign_id, user_id)` |
| Client action | `UNIQUE(participation_id, idempotency_key)` |
| Attempt creation | action idempotency + attempt unique period/index |
| Reward qualification | `UNIQUE(participation_id, reward_definition_id, qualification_key)` |
| Goin issuance | existing `UNIQUE(user_id, idempotency_key)` in `user_economy_events` |
| Publish | campaign row lock + expected draft revision + publish request idempotency in service/API contract |

The same logical retry should return the previous successful result rather than create a second business fact.

---

## 22. Read-model guidance

Do not create aggregate campaign summary tables in migration 029 unless runtime verification proves query performance requires them.

Initial `/manage/marketing` summaries can derive from:

```text
campaign_participations
campaign_events
campaign_attempts
campaign_reward_grants
campaign_reward_budgets
product_analytics_events for observational top-of-funnel signals
```

This follows the existing Growth Metrics principle: derive from authoritative facts first; materialize only when evidence demands it.

---

## 23. Migration 029 acceptance requirements

When implementation begins, migration 029 is not accepted until local verification proves:

```text
all tables/constraints/indexes created rerunnably
current 001..028 migrations remain unaffected
one user cannot create two V1 participations in one campaign
published version rows cannot be casually rewritten through service path
same action idempotency key cannot duplicate effects
parallel daily-attempt allocation cannot exceed configured maxAttempts
reward budget cannot be overspent under parallel grants
same reward qualification cannot create two campaign reward grants
same logical reward cannot create two economy events
campaign reward grant points to its economy event
user deletion behavior respects selected FK policy
no Product Analytics row is needed for financial correctness
```

And the existing project release invariant must still pass:

```text
pnpm generate
```

---

## 24. Hard rules

```text
DO NOT normalize polymorphic definition data into dozens of config tables in V1.
DO NOT store mutable campaign runtime authority only inside JSONB.
DO NOT add a campaign wallet/balance.
DO NOT rely on SUM-without-lock for global reward-budget enforcement.
DO NOT use Product Analytics as reward evidence.
DO NOT accept client-generated period keys as attempt authority.
DO NOT create duplicate reward grants on retry.
DO NOT open a second Economy transaction inside one logical campaign reward transaction.
DO NOT hard-delete published campaign versions through normal product APIs.
DO NOT add broad JSONB indexes without a measured query need.
DO NOT store secrets, tokens or arbitrary unbounded evidence in campaign action/state JSON.
```

---

## 25. Schema result

The proposed V1 schema intentionally separates three concerns:

```text
campaigns + campaign_versions
  -> stable identity + immutable configuration contract

participations/actions/events/states/attempts
  -> runtime truth and audit

reward_budgets + reward_grants + existing user_economy_events
  -> transactional value issuance and reconciliation
```

This shape directly supports the approved custom game, Payiz festival and daily chance-wheel scenarios while preserving room for new mechanics without constant relational schema churn.