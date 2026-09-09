# Campaign Engine V1 — API & Runtime Contract

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

Database companion:

```text
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
```

---

## 1. API goals

Campaign API V1 must provide four clean boundaries:

```text
Public Campaign Read
  -> safe campaign projection for SSR/browser

Authenticated Runtime
  -> participation, attempts, actions and caller state

Promotion Runtime
  -> eligible site placements and authenticated dismissal state

Manage Marketing
  -> draft authoring, validation, publish, lifecycle and reporting
```

The API must preserve existing Prompt Draft conventions:

```text
JSON responses
{ ok: true, ... } success shape
{ ok: false, code?, message } error shape
backend-resolved authenticated user
explicit backend permission checks
bounded JSON bodies
no client-authoritative financial/security identity
```

---

## 2. Route families

### Public / caller-aware

```text
GET  /api/campaigns/:slug
GET  /api/campaigns/:slug/state
POST /api/campaigns/:slug/participation
POST /api/campaigns/:slug/mechanics/:mechanicId/attempts
POST /api/campaigns/:slug/actions
```

### Promotion

```text
GET    /api/campaign-promotions?slot=:slot
PUT    /api/campaign-promotions/:slug/:promotionId/dismiss
DELETE /api/campaign-promotions/:slug/:promotionId/dismiss
```

### Admin / Manage Marketing

```text
GET  /api/admin/campaigns
POST /api/admin/campaigns
GET  /api/admin/campaigns/:id
PUT  /api/admin/campaigns/:id/draft
POST /api/admin/campaigns/:id/validate
POST /api/admin/campaigns/:id/publish
POST /api/admin/campaigns/:id/pause
POST /api/admin/campaigns/:id/resume
POST /api/admin/campaigns/:id/end
POST /api/admin/campaigns/:id/archive

GET  /api/admin/campaigns/:id/summary
GET  /api/admin/campaigns/:id/participants
GET  /api/admin/campaigns/:id/rewards
GET  /api/admin/campaigns/:id/versions
```

Deferred-settlement admin endpoints are not required in the first implementation slice.

---

## 3. Public page vs API route

Frontend canonical campaign pages remain:

```text
/campaign/:slug
/fa/campaign/:slug
```

The Nuxt page fetches:

```text
GET /api/campaigns/:slug
```

SSR can call the public API without authentication to render campaign-safe content.

When browser auth is available, the same endpoint may enrich the response with caller eligibility/participation state. It must never expose private canonical definition fields.

---

## 4. `GET /api/campaigns/:slug`

Purpose:

```text
public Campaign Projection
current effective lifecycle
optional caller eligibility/participation summary
```

Authentication:

```text
optional
```

Anonymous users may view a public campaign landing page unless the campaign definition explicitly makes the experience itself private in a future extension. V1 reward participation still requires authenticated user identity.

Successful conceptual response:

```json
{
  "ok": true,
  "campaign": {
    "id": "uuid",
    "slug": "payiz",
    "version": 2,
    "schemaVersion": "campaign.v1",
    "status": "active",
    "lifecycle": {
      "startsAt": "2026-09-23T00:00:00.000Z",
      "endsAt": "2026-12-21T23:59:59.000Z",
      "timezone": "Asia/Tehran"
    },
    "experience": {
      "renderer": {
        "kind": "custom",
        "key": "payiz-2026-page"
      },
      "locales": ["en", "fa"],
      "defaultLocale": "fa",
      "content": {
        "fa": {
          "title": "جشنواره پاییزه"
        }
      },
      "seo": {
        "indexing": "noindex"
      }
    },
    "mechanics": [],
    "completion": {},
    "rewards": [
      {
        "id": "completion-100",
        "type": "goin",
        "amount": 100,
        "trigger": {
          "type": "campaign_completion"
        }
      }
    ]
  },
  "viewer": {
    "authenticated": true,
    "eligibility": {
      "eligible": true,
      "reasonCodes": []
    },
    "participation": {
      "id": "uuid",
      "status": "in_progress",
      "progress": {}
    }
  }
}
```

Anonymous viewer shape:

```json
{
  "authenticated": false,
  "eligibility": {
    "eligible": false,
    "reasonCodes": ["AUTHENTICATION_REQUIRED"]
  },
  "participation": null
}
```

### Public projection rules

Never include:

```text
mechanic config.private
chance weights
fraud rules
internal objective/KPI notes unless explicitly public
reward budget internals
committed/granted budget counters
operator IDs/notes
raw Campaign Definition JSON
private attempt context
client evidence from prior actions
```

### Not found / unavailable

```text
404 CAMPAIGN_NOT_FOUND
```

An archived/gone campaign may follow its published SEO end behavior. The API must distinguish a deliberate ended/archive projection from a missing slug when the product policy requires it.

---

## 5. `GET /api/campaigns/:slug/state`

Purpose:

```text
refresh authenticated caller runtime state without re-fetching all public campaign content
```

Authentication:

```text
required
```

Response direction:

```json
{
  "ok": true,
  "campaign": {
    "id": "uuid",
    "slug": "payiz",
    "version": 2,
    "status": "active"
  },
  "eligibility": {
    "eligible": true,
    "reasonCodes": []
  },
  "participation": {
    "id": "uuid",
    "status": "in_progress",
    "startedAt": "...",
    "completedAt": null,
    "qualifiedAt": null,
    "rewardedAt": null,
    "progress": {}
  },
  "mechanics": [
    {
      "id": "goal-set",
      "state": {}
    }
  ],
  "attemptAvailability": []
}
```

This endpoint may evaluate fresh metric-backed progress before returning, but evaluation must use registered authoritative metrics and the participation's locked campaign version.

---

## 6. `POST /api/campaigns/:slug/participation`

Purpose:

```text
start the authenticated user's single V1 participation
```

Authentication:

```text
required
```

Body:

```json
{
  "idempotencyKey": "participation:start:client-uuid",
  "attribution": {
    "source": "onsite",
    "medium": "campaign_promotion",
    "placement": "site_header"
  }
}
```

The API does **not** accept `userId`.

Server sequence:

```text
resolve user
resolve campaign/current published version
compute effective status
validate campaign participation window
validate eligibility
find existing participation
if absent, create participation locked to current version
append campaign_started trusted event once
return current state
```

V1 duplicate semantics:

```text
same campaign + same user already started
  -> 200 success
  -> existing participation
  -> duplicate = true
```

Do not return 409 merely because a network retry discovered the already-created logical participation.

Response:

```json
{
  "ok": true,
  "duplicate": false,
  "participation": {
    "id": "uuid",
    "campaignVersion": 2,
    "status": "started"
  }
}
```

Possible business errors:

```text
409 CAMPAIGN_NOT_ACTIVE
403 CAMPAIGN_NOT_ELIGIBLE
409 CAMPAIGN_PARTICIPATION_CLOSED
```

---

## 7. Attempt creation endpoint

```text
POST /api/campaigns/:slug/mechanics/:mechanicId/attempts
```

Purpose:

```text
obtain/reserve a server-authoritative attempt before a game/wheel/repeatable mechanic begins
```

Authentication:

```text
required
```

Participation:

```text
required; endpoint may return CAMPAIGN_PARTICIPATION_REQUIRED instead of implicitly starting
```

Explicit start keeps marketing attribution and participation intent unambiguous.

Request:

```json
{
  "idempotencyKey": "attempt:start:client-uuid"
}
```

The client does **not** submit:

```text
periodKey
attemptIndex
allowedAttempts
random outcome
reward amount
```

Server computes these values.

Generic response:

```json
{
  "ok": true,
  "duplicate": false,
  "attempt": {
    "id": "uuid",
    "mechanicId": "daily-wheel",
    "status": "reserved",
    "period": {
      "type": "calendar_day",
      "nextEligibleAt": "2026-09-10T00:00:00+03:30"
    },
    "expiresAt": null,
    "publicContext": {}
  }
}
```

For a game, `publicContext` may contain a server-issued challenge/seed/session descriptor that is safe to expose.

For chance wheel, V1 may combine attempt reservation + outcome resolution into one server action if no separate gameplay is needed. The route contract still treats the spin as an Attempt and returns a persisted outcome.

Limit response:

```text
429 CAMPAIGN_ATTEMPT_LIMIT_REACHED
```

with safe detail:

```json
{
  "ok": false,
  "code": "CAMPAIGN_ATTEMPT_LIMIT_REACHED",
  "message": "No campaign attempt is currently available",
  "nextEligibleAt": "..."
}
```

Do not reveal private anti-fraud/rate configuration in error details.

---

## 8. `POST /api/campaigns/:slug/actions`

Purpose:

```text
submit one bounded untrusted mechanic action/evidence packet
```

Authentication:

```text
required
```

Request:

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

Hard request rules:

```text
known participation for authenticated caller
participation locked campaign version
known mechanic instance
known action for mechanic type
bounded JSON body
strict action schema validation
unknown top-level/action fields rejected unless schema explicitly permits them
attempt belongs to caller participation when required
```

Do not accept authoritative fields such as:

```text
userId
campaignVersionId
won
qualified
rewardAmount
rewardGranted
economyEventId
```

from browser input.

### Processing contract

Conceptual transaction/application flow:

```text
resolve caller + participation + exact version
check idempotency key
persist/identify action
validate mechanic/action/attempt
reduce mechanic state
resolve trusted outcome if any
evaluate completion expression
create trusted domain events
if reward qualification occurs:
  execute atomic Campaign Reward + Economy transaction
return accepted state/effects
```

A rejected action may still be persisted as an `accepted=false` action audit row when safe/useful, but must produce no success business effects.

---

## 9. Action idempotency response

Repeated same logical request:

```text
same participation + same idempotencyKey
```

must not replay mechanic/reward effects.

Recommended response:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": true,
  "result": {
    "participation": {},
    "mechanicState": {},
    "effects": []
  }
}
```

The backend may reconstruct the original result from authoritative state rather than storing a giant response blob. Semantically, duplicate retry returns the already-established outcome.

If the same idempotency key is reused with a materially different payload, reject:

```text
409 CAMPAIGN_IDEMPOTENCY_CONFLICT
```

Implementation should store a normalized request hash if necessary to enforce this cleanly. This is a recommended hardening; if deferred, at minimum do not execute a second effect.

---

## 10. Runtime success response

General direction:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": false,
  "result": {
    "participation": {
      "status": "qualified",
      "progress": {},
      "completedAt": "...",
      "qualifiedAt": "..."
    },
    "mechanicState": {
      "mechanicId": "autumn-game",
      "state": {}
    },
    "attempt": {
      "id": "uuid",
      "status": "resolved",
      "outcome": {
        "key": "win"
      }
    },
    "effects": [
      {
        "type": "campaign_completed"
      },
      {
        "type": "reward_granted",
        "reward": {
          "type": "goin",
          "amount": 100,
          "grantId": "uuid",
          "economyEventId": "uuid"
        }
      }
    ],
    "economy": {
      "balance": 185
    }
  }
}
```

`economy` may use the same authoritative caller-owned state shape already used by the Economy subsystem so frontend shared Goin state can update immediately.

---

## 11. Chance-wheel contract

A wheel spin must never be implemented as:

```text
browser calculates random segment
browser sends chosen outcome
server grants reward based on submitted segment
```

Correct V1 flow:

```text
POST attempt/spin request
  -> server reserves valid daily attempt atomically
  -> server loads private wheel weights
  -> cryptographically appropriate server RNG selects outcome
  -> server persists attempt outcome
  -> server executes reward grant if mapped outcome has reward
  -> response returns persisted outcome + reward state
  -> UI animates toward the returned outcome
```

Example response:

```json
{
  "ok": true,
  "attempt": {
    "id": "uuid",
    "status": "resolved",
    "outcome": {
      "key": "goin_20"
    },
    "nextEligibleAt": "2026-09-10T00:00:00+03:30"
  },
  "reward": {
    "status": "granted",
    "type": "goin",
    "amount": 20
  }
}
```

Public segment label/order can be fetched in Campaign Projection. Weight values remain private.

---

## 12. Custom-game contract

Custom Vue component integration direction:

```vue
<CustomGame
  :campaign="campaign"
  :mechanic="mechanic"
  :state="mechanicState"
  :attempt="attempt"
  @action="campaignRuntime.submit"
/>
```

The component knows only public campaign/mechanic data and server-issued attempt context.

It emits actions, not direct rewards.

For `server_verifiable` games, action evidence must be sufficient for backend validation under the mechanic-specific contract.

For `server_authoritative` games, gameplay-critical outcome state is maintained/decided server-side.

`client_reported` mechanic outcome cannot grant meaningful Goin by default. Publish validation should reject a reward-bearing `client_reported` mechanic unless a separately approved exception policy exists.

---

## 13. Metric refresh behavior

Metric-backed campaigns such as Payiz may progress because the user performs product actions elsewhere on the site, not through the campaign page.

Therefore progress cannot depend only on Campaign Actions.

Runtime must support authoritative re-evaluation on:

```text
GET campaign state
landing read for authenticated user
participation reads
selected product domain hooks/events in future if immediate push is useful
```

V1 can begin with read-time evaluation plus explicit refresh after known product actions.

Example:

```text
user unlocks Prompt elsewhere
  -> existing user_content_unlocks becomes authoritative fact
  -> next Campaign state read resolves prompts.unlocked.count
  -> completion transition is persisted once
  -> reward is granted once idempotently
```

### Important race rule

If multiple concurrent state reads discover the same new completion, they must converge on one completion/reward result through participation locking + reward qualification uniqueness.

---

## 14. Promotion selection endpoint

```text
GET /api/campaign-promotions?slot=site_header
```

Allowed slots V1:

```text
site_header
floating_corner
modal
dashboard_banner
```

Authentication:

```text
optional
```

Server selects only campaigns/promotions that are currently eligible at the campaign/schedule level and safe to display.

Authenticated caller state may additionally suppress a `persistence=user` dismissed promotion.

Response:

```json
{
  "ok": true,
  "slot": "site_header",
  "promotions": [
    {
      "campaignSlug": "payiz",
      "campaignVersion": 2,
      "promotionId": "payiz-header",
      "renderer": {
        "kind": "builtin",
        "key": "header-campaign-cta-v1"
      },
      "content": {
        "title": "..."
      },
      "targetPath": "/campaign/payiz",
      "priority": 100,
      "dismiss": {
        "enabled": false
      }
    }
  ]
}
```

Response may return multiple eligible promotions; the frontend placement policy can choose the highest priority or render according to slot capacity. V1 should define deterministic server ordering:

```text
priority DESC
campaign start DESC or stable tie-break
campaign id/slug stable tie-break
```

Do not return private Campaign Definition data.

---

## 15. Promotion dismissal

Authenticated user dismissal:

```text
PUT /api/campaign-promotions/:slug/:promotionId/dismiss
```

Body:

```json
{}
```

Server resolves current campaign version/promotion and stores user-scoped dismissal according to the published promotion config.

Response:

```json
{
  "ok": true,
  "dismissed": true,
  "dismissUntil": null
}
```

Remove/reset user dismissal:

```text
DELETE /api/campaign-promotions/:slug/:promotionId/dismiss
```

This is useful for operator testing/debug UI later; ordinary UX does not need to expose reset necessarily.

For `session` and `device` persistence, V1 may keep dismissal locally and not call the server.

Do not create anonymous device fingerprinting for dismiss state.

---

## 16. Observational campaign analytics

When Product Analytics instrumentation is added, likely events:

```text
campaign_promotion_impression
campaign_promotion_click
campaign_promotion_dismiss
campaign_landing_view
```

These go through the existing analytics endpoint/allowlist contract rather than a new public campaign-analytics ingestion endpoint.

No analytics request success/failure can mutate:

```text
participation
attempt
completion
qualification
reward
budget
```

---

## 17. Admin permissions

Proposed backend permission constants:

```text
marketing.campaigns.view
marketing.campaigns.manage
marketing.campaigns.publish
marketing.metrics.view
```

Recommended V1 role mapping:

```text
user
  -> none

admin
  -> marketing.campaigns.view
  -> marketing.metrics.view

super_admin
  -> all through existing wildcard
```

Mutations require:

```text
marketing.campaigns.manage
```

Publish/lifecycle authority requires:

```text
marketing.campaigns.publish
```

This avoids abusing `system.settings.manage` or implicitly granting campaign publishing to every current admin.

---

## 18. `GET /api/admin/campaigns`

Permission:

```text
marketing.campaigns.view
```

Query direction:

```text
status=draft|scheduled|active|paused|ended|archived
limit=1..100
cursor=<opaque>
```

Response summary item:

```json
{
  "id": "uuid",
  "slug": "payiz",
  "internalName": "autumn-festival-2026",
  "status": "active",
  "currentVersion": 2,
  "draftRevision": 7,
  "startsAt": "...",
  "endsAt": "...",
  "participants": 1200,
  "completed": 430,
  "goinGranted": 43000,
  "rewardBudgetRemaining": 57000,
  "updatedAt": "..."
}
```

Expensive metrics may be omitted from the list initially and loaded in detail summary if query cost is significant. Do not create duplicated aggregate tables merely to satisfy a decorative list card.

---

## 19. `POST /api/admin/campaigns`

Permission:

```text
marketing.campaigns.manage
```

Request:

```json
{
  "slug": "payiz",
  "internalName": "autumn-festival-2026",
  "definition": {
    "schemaVersion": "campaign.v1"
  }
}
```

The initial definition may be incomplete as a Draft.

Draft save validation is structural/basic; publish validation is strict/full.

Response:

```json
{
  "ok": true,
  "campaign": {
    "id": "uuid",
    "slug": "payiz",
    "draftRevision": 1,
    "publishedVersion": null,
    "status": "draft"
  }
}
```

Admin audit:

```text
marketing.campaign_created
```

---

## 20. `GET /api/admin/campaigns/:id`

Permission:

```text
marketing.campaigns.view
```

Returns internal management projection, including:

```text
campaign head
draft definition
draft revision
current published definition/version
validation warnings/errors
lifecycle override state
safe summary counts
```

Unlike public API, this may include canonical private mechanic config when caller has campaign view permission. Sensitive secrets should still not be stored casually in campaign config if a dedicated secret store is more appropriate in the future.

---

## 21. `PUT /api/admin/campaigns/:id/draft`

Permission:

```text
marketing.campaigns.manage
```

V1 uses full draft replacement rather than arbitrary JSON Patch.

Request:

```json
{
  "expectedRevision": 7,
  "definition": {
    "schemaVersion": "campaign.v1"
  }
}
```

Optimistic concurrency:

```text
expectedRevision must equal campaigns.draft_revision
```

Successful save:

```text
draft_revision += 1
```

Conflict:

```text
409 CAMPAIGN_DRAFT_REVISION_CONFLICT
```

Response:

```json
{
  "ok": true,
  "changed": true,
  "draftRevision": 8,
  "validation": {
    "publishable": false,
    "errors": [],
    "warnings": []
  }
}
```

No-op saves may return `changed=false` without incrementing revision if canonical definitions are equal after normalization.

Admin audit:

```text
marketing.campaign_draft_updated
```

Do not dump an entire private definition into audit metadata if a compact safe change summary is sufficient.

---

## 22. `POST /api/admin/campaigns/:id/validate`

Permission:

```text
marketing.campaigns.manage
```

Body:

```json
{
  "expectedRevision": 8
}
```

Response:

```json
{
  "ok": true,
  "publishable": false,
  "errors": [
    {
      "path": "mechanics[0].attemptPolicy.timezone",
      "code": "CAMPAIGN_TIMEZONE_REQUIRED",
      "message": "calendar_day attempt policy requires a timezone"
    }
  ],
  "warnings": []
}
```

Validation is deterministic and side-effect free.

It must validate registry references without granting reward, creating attempts or writing participation state.

---

## 23. Preview contract

`/manage/marketing` needs Preview, but Preview must not be a reward-capable runtime.

Recommended frontend direction:

```text
preview uses current draft definition from admin endpoint/local editor state
renders through the same renderer registry in preview mode
```

If a backend preview endpoint is later needed, it must produce a public-projection-like response with:

```text
preview = true
no real participation
no real attempts
no real Goin reward
no real budget consumption
```

Do not reuse production action endpoints with a hidden `preview=true` query flag that risks value issuance.

---

## 24. `POST /api/admin/campaigns/:id/publish`

Permission:

```text
marketing.campaigns.publish
```

Request:

```json
{
  "expectedDraftRevision": 8,
  "idempotencyKey": "publish:client-uuid"
}
```

Publish sequence:

```text
lock campaign
verify draft revision
run full definition validation
verify slug publication rules
assign next version number
persist immutable version + hash
seed campaign_reward_budgets for configured reward budgets
update current_published_version_id
write admin audit
commit
```

Response:

```json
{
  "ok": true,
  "published": true,
  "campaign": {
    "id": "uuid",
    "slug": "payiz",
    "version": 2,
    "status": "scheduled"
  }
}
```

Publish must be retry-safe. A repeated identical publish request must not create Version 3 after Version 2 was already successfully created by the first request.

Implementation options include a small admin-operation idempotency record or a publish request key stored in audit/version metadata with a unique constraint. The exact persistence detail can be selected in CE1, but retry safety is mandatory.

---

## 25. Lifecycle mutation endpoints

### Pause

```text
POST /api/admin/campaigns/:id/pause
```

Permission:

```text
marketing.campaigns.publish
```

Sets manual pause state/timestamp.

### Resume

```text
POST /api/admin/campaigns/:id/resume
```

Clears pause state. Effective status then returns to schedule-derived status.

Resume cannot resurrect:

```text
manually ended
archived
naturally ended past endsAt
```

without an explicit newer version/schedule decision.

### End

```text
POST /api/admin/campaigns/:id/end
```

Creates durable manual end state.

Existing participants follow published `participationAfterEnd` / settlement rules; new participation is denied.

### Archive

```text
POST /api/admin/campaigns/:id/archive
```

Archive is administrative retirement and affects public end behavior/indexability policy.

All lifecycle mutations create existing admin audit records.

---

## 26. Campaign summary endpoint

```text
GET /api/admin/campaigns/:id/summary
```

Permission:

```text
marketing.metrics.view
```

Initial read model should derive honestly from runtime facts.

Recommended summary:

```json
{
  "ok": true,
  "campaign": {
    "id": "uuid",
    "slug": "payiz",
    "version": 2,
    "status": "active"
  },
  "funnel": {
    "landingViews": 10000,
    "participants": 2200,
    "completed": 900,
    "qualified": 880,
    "rewarded": 870
  },
  "rewards": {
    "goinGranted": 87000,
    "grantCount": 870,
    "failedGrantCount": 10,
    "budgetMax": 150000,
    "budgetCommitted": 88000,
    "budgetGranted": 87000,
    "budgetRemaining": 62000
  }
}
```

Measurement labels must distinguish:

```text
observational Product Analytics top-of-funnel
vs
authoritative participation/reward counts
```

Do not call an uninstrumented value zero when it is actually unknown.

---

## 27. Participants endpoint

```text
GET /api/admin/campaigns/:id/participants?status=&limit=&cursor=
```

Permission:

```text
marketing.campaigns.view
```

Returns bounded operational data needed for support/reconciliation:

```text
participation id
user identifier suitable for admin UI
version
status
started/completed/qualified/rewarded timestamps
safe progress summary
reward summary
```

Do not expose unnecessary private profile data or arbitrary client evidence in the list.

A deeper support view can be introduced later with explicit permissions if needed.

---

## 28. Rewards endpoint

```text
GET /api/admin/campaigns/:id/rewards?status=&limit=&cursor=
```

Permission:

```text
marketing.metrics.view
```

Returns reconciliation fields:

```text
reward grant id
participation id
user id/admin-safe user label
reward definition id
qualification key
amount
status
economy event id
created/granted/failed timestamps
failure code
```

This is the primary operator path for proving:

```text
campaign qualification
  -> campaign reward grant
  -> economy transaction
```

---

## 29. Versions endpoint

```text
GET /api/admin/campaigns/:id/versions
```

Permission:

```text
marketing.campaigns.view
```

Returns immutable version metadata and optionally definitions for authorized management UI.

At minimum:

```text
version number
schema version
definition hash
published by
published at
participant count
reward grant count
```

No endpoint modifies an existing published version.

---

## 30. Error taxonomy

Initial stable Campaign errors:

```text
CAMPAIGN_NOT_FOUND
CAMPAIGN_NOT_ACTIVE
CAMPAIGN_PAUSED
CAMPAIGN_ENDED
CAMPAIGN_PARTICIPATION_CLOSED
CAMPAIGN_NOT_ELIGIBLE
CAMPAIGN_PARTICIPATION_REQUIRED
CAMPAIGN_ACTION_INVALID
CAMPAIGN_ACTION_REJECTED
CAMPAIGN_IDEMPOTENCY_CONFLICT
CAMPAIGN_ATTEMPT_LIMIT_REACHED
CAMPAIGN_ATTEMPT_NOT_FOUND
CAMPAIGN_ATTEMPT_INVALID
CAMPAIGN_REWARD_EXHAUSTED
CAMPAIGN_REWARD_FAILED
CAMPAIGN_DEFINITION_INVALID
CAMPAIGN_DRAFT_REVISION_CONFLICT
CAMPAIGN_PUBLISH_CONFLICT
CAMPAIGN_RENDERER_UNKNOWN
CAMPAIGN_MECHANIC_UNKNOWN
CAMPAIGN_METRIC_UNKNOWN
CAMPAIGN_PERMISSION_DENIED
```

Use HTTP status according to semantics:

```text
400 malformed/validation
401 authentication required
403 authenticated but forbidden/ineligible where appropriate
404 missing campaign/attempt/resource
409 state/idempotency/version conflict
413 body too large
415 invalid Content-Type
429 attempt/rate/period limit where appropriate
500 unexpected server failure
```

Do not leak private anti-fraud or random-weight details in error messages.

---

## 31. Request-body and JSON validation

Campaign endpoints are flexible but not arbitrary JSON sinks.

Implementation must set explicit body ceilings.

Direction:

```text
runtime action bodies -> small/bounded; mechanic-specific schemas
admin definition bodies -> larger but bounded; schema validated
unknown top-level fields -> reject by default
```

Mechanic action schemas own allowed payload/evidence fields.

Never accept:

```text
password
auth token
full Prompt protected body unless mechanic explicitly and safely requires content in a future approved contract
raw browser fingerprint
unbounded files/base64 blobs
arbitrary executable code
raw SQL
```

Media/assets for campaigns should use the project's storage/media architecture, not base64 Campaign Definition payloads.

---

## 32. Authentication and ownership

Runtime identity always follows:

```text
Authorization/session
  -> backend getAuthenticatedUser-style resolution
  -> canonical users.id
```

The following must not establish ownership:

```text
body.userId
query.userId
payload.user_id
analytics anonymous_id
analytics session_id
```

Anonymous analytics identity is observational only.

---

## 33. Runtime transaction boundaries

A single action request may touch multiple Campaign tables and Economy.

The transaction boundary must match business atomicity.

### Non-reward action

```text
BEGIN
  lock participation/mechanic state
  dedupe action
  validate/reduce
  persist state/events
COMMIT
```

### Reward-producing action/evaluation

```text
BEGIN
  lock participation/mechanic state as needed
  establish completion/qualification once
  lock canonical user according to Economy contract
  lock reward budget row
  dedupe reward qualification
  create pending reward grant/reserve budget
  write Economy event through transaction-aware Economy primitive
  link grant -> economy event
  mark grant successful
  update participation
  append trusted events
COMMIT
```

Product Analytics dispatch happens after/best-effort and is outside financial correctness.

---

## 34. Runtime effects contract

Frontend should not need to reverse-engineer state changes.

Action/state responses may include a bounded `effects` array:

```text
progress_updated
campaign_completed
campaign_qualified
reward_granted
reward_failed
attempt_resolved
next_attempt_available_at
```

Effects are response hints derived from authoritative server state.

They are not a second persistence source.

---

## 35. Frontend composable direction

Recommended shared client abstraction:

```text
useCampaignRuntime()
```

Responsibilities:

```text
load public projection
load caller state
start participation
create attempt
submit action
apply returned state/effects
apply returned Economy state to existing useEconomy()
refresh progress
```

Custom renderers use this composable/adapter rather than calling ad-hoc reward endpoints.

Promotion runtime may use:

```text
useCampaignPromotions()
```

for slot selection/dismiss state.

Do not merge Campaign Runtime into `useProductAnalytics()`.

---

## 36. Renderer registry failure

A published definition that references an unknown renderer is a publish-validation bug and should be blocked.

If runtime nevertheless encounters one due to deployment/version skew:

```text
public API can still return campaign metadata
frontend renders a safe unavailable/fallback state
no participation/reward action should depend on a missing renderer
server logs configuration error
```

Do not expose import paths or stack traces.

Deployment sequencing should ensure code containing a newly referenced custom renderer is live before/with the campaign version that activates it.

---

## 37. Registry/schema compatibility

Published Campaign Definition can outlive one frontend/backend deployment.

Registry entries used by a published/active version are compatibility contracts.

Do not remove:

```text
renderer key
mechanic key
metric key
outcome semantics
```

while an active or historically inspectable published version still depends on them, unless backward-compatible handling is provided.

Version new behavior with new keys when semantics materially change:

```text
wheel-v1
wheel-v2
```

rather than silently changing old published meaning.

---

## 38. API verification requirements

Before API Runtime V1 is accepted, local verification must prove at minimum:

```text
anonymous public campaign read strips private config
authenticated state belongs only to caller
client-supplied userId cannot redirect ownership
start participation is retry-safe
participation stays on original version after later publish
invalid mechanic/action rejected
same action retry cannot duplicate state/reward
parallel state evaluation cannot double-complete/double-reward
daily wheel parallel calls cannot produce multiple daily attempts
chance outcome is selected/persisted server-side
private weights never appear in public response
campaign Goin grant creates exactly one economy event
budget exhaustion prevents extra grants atomically
failed Product Analytics cannot break reward transaction
admin without manage/publish permissions cannot mutate/publish
admin view does not imply publish permission
preview cannot issue real Goin
published version cannot be edited by API
published slug cannot silently change
/manage frontend still respects existing permission-driven shell
pnpm generate passes
```

---

## 39. Hard rules

```text
DO NOT expose canonical Campaign Definition directly from public API.
DO NOT accept userId as runtime ownership input.
DO NOT make participation creation non-idempotent.
DO NOT let action retries replay rewards.
DO NOT let browser choose chance outcome or reward amount.
DO NOT trust Product Analytics as completion evidence.
DO NOT perform campaign reward across independent DB transactions and call it atomic.
DO NOT use Preview against production reward endpoints.
DO NOT grant campaign publish authority merely because a user can view /manage.
DO NOT delete old registry semantics while published versions depend on them.
DO NOT hide unknown/unsupported measurement as a fake zero.
```

---

## 40. API contract result

The V1 API keeps one generic public campaign route while allowing radically different campaign UIs.

All custom experiences converge on the same trusted runtime path:

```text
Public Projection
  -> Participation
  -> Attempt when required
  -> Action / Evidence
  -> Server Validation
  -> Trusted Outcome
  -> Completion / Qualification
  -> Atomic Campaign Reward Grant
  -> Existing Goin Economy
```

This is the contract that prevents custom marketing creativity from creating parallel security, reward or analytics systems.