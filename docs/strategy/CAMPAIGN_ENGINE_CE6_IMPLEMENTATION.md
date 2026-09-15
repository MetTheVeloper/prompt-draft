# Campaign Engine — CE6 Measurement & Reconciliation

Status: **IN PROGRESS / CE6.1 IMPLEMENTED / VERIFICATION PENDING**

Date: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Starting HEAD verified before CE6 implementation:

```text
1636db02e069916cc872109a467688e42e897273
```

Parent track:

```text
Campaign Engine V1
CE6 — Measurement & Reconciliation
```

Canonical companions:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

---

## 1. CE6 objective

CE6 adds an operator measurement and reconciliation read layer over existing Campaign authorities.

Required V1 outcomes:

```text
funnel summary
participant inspection
reward inspection
reward budget remaining
Campaign reward -> user_economy_events trace
placement / mechanic / completion / reward reconciliation
```

CE6 is not a new analytics warehouse and is not a second Economy or reward system.

---

## 2. Authority boundaries

CE6 must read from the existing authorities rather than creating parallel state:

```text
product_analytics_events
  -> observational promotion evidence only

campaign_participations
campaign_events
campaign_attempts
campaign_mechanic_states
  -> authoritative Campaign execution facts

campaign_reward_budgets
campaign_reward_grants
  -> authoritative Campaign reward/budget facts

user_economy_events
  -> authoritative Goin ledger

existing admin authorization
admin_audit_log
  -> existing operator authorization/audit system
```

Telegram is distribution/entry attribution only. CE6 must not create a Telegram-specific Campaign analytics authority.

Browser-originated analytics or attribution must never become authority for completion, qualification, reward, budget or Economy reconciliation.

---

## 3. Measurement honesty

CE6 follows the existing measurement-honesty rule:

```text
unknown != zero
observational != authoritative
```

Current instrumentation records Campaign promotion impressions/clicks/dismissals in `product_analytics_events`.

There is not yet a dedicated Campaign landing-page view event. Therefore CE6.1 returns:

```text
funnel.landingViews = null
analytics.landingViewsInstrumented = false
```

It must not substitute promotion impressions for landing-page views.

Promotion impressions/clicks may be exposed separately and explicitly labelled observational.

Authoritative funnel stages are derived from durable Campaign participation timestamps:

```text
participants -> participation row exists for the selected Campaign version
completed    -> completed_at IS NOT NULL
qualified    -> qualified_at IS NOT NULL
rewarded     -> rewarded_at IS NOT NULL
```

This avoids undercounting users whose current status advanced beyond an earlier funnel stage.

---

## 4. CE6.1 scope — Measurement Summary

First slice:

```text
GET /api/admin/campaigns/:id/summary
permission: marketing.metrics.view
```

The summary is scoped to the Campaign's current immutable published version so funnel, reward and budget values reconcile against the same version.

Response shape:

```json
{
  "ok": true,
  "campaign": {
    "id": "uuid",
    "slug": "autumn-game",
    "version": 3,
    "status": "active"
  },
  "scope": {
    "kind": "current_published_version",
    "campaignVersionId": "uuid"
  },
  "funnel": {
    "landingViews": null,
    "participants": 120,
    "completed": 80,
    "qualified": 70,
    "rewarded": 65
  },
  "rewards": {
    "goinGranted": 6500,
    "grantCount": 65,
    "failedGrantCount": 5,
    "budgetMax": 10000,
    "budgetCommitted": 7000,
    "budgetGranted": 6500,
    "budgetRemaining": 3000
  },
  "analytics": {
    "authority": "observational",
    "promotionImpressions": 900,
    "promotionClicks": 240,
    "landingViewsInstrumented": false
  }
}
```

Budget semantics:

```text
budgetRemaining = budgetMax - budgetCommitted
```

Committed budget is no longer available for another grant even if Economy settlement has not yet reached the granted total.

If the published version has no configured reward budget, budget fields remain `null` rather than pretending that a missing budget is a zero-sized budget.

Reward grant counts are read from `campaign_reward_grants`; budget totals are independently read from `campaign_reward_budgets`. Later CE6 reconciliation must compare these authorities rather than hiding disagreement by deriving both values from one table.

---

## 5. CE6 slicing

```text
CE6.1 Measurement Summary
  -> current-version funnel
  -> reward summary
  -> budget summary
  -> observational promotion counts

CE6.2 Participant + Reward Inspection
  -> paginated participant inspection
  -> paginated reward grants
  -> failure reasons
  -> exact economy_event_id trace

CE6.3 Reconciliation
  -> placement evidence
  -> participation / attempt / mechanic evidence
  -> completion / qualification evidence
  -> reward grant evidence
  -> Economy event consistency checks

CE6.4 Manage Marketing UI
  -> reuse existing /manage shell/components/theme
  -> surface measurement and inspection without a second dashboard shell

CE6 acceptance
  -> founder-local verification
  -> advance to CE7 only after acceptance
```

---

## 6. Schema decision

CE6.1 requires **no SQL migration**.

Existing schema already provides:

```text
version-locked participations
trusted Campaign events
attempt/mechanic state
reward budget max/committed/granted
reward grant status/failure metadata
direct campaign_reward_grants.economy_event_id link
user_economy_events authoritative ledger
promotion observational analytics
```

Indexes should be added only if real query-plan evidence later shows a performance gap.

---

## 7. CE5 route-registration regression found during CE6 audit

The accepted CE5 Campaign admin route implementation exists in:

```text
backend/src/adminCampaignRoute.mjs
```

but the authoritative starting HEAD does not register it from the Docker API entrypoint:

```text
backend/src/index.mjs
```

`compose.yaml` builds the API from `backend/`, and `backend/Dockerfile` runs `node src/index.mjs`, while the browser-visible API base points at that API service.

Therefore this is a concrete integration regression rather than a reason to redesign CE5.

CE6.1 may repair only the missing Campaign admin route registration while preserving the accepted CE5 implementation unchanged.

---

## 8. Production invariants

CE6 must preserve:

```text
NUXT_PUBLIC_NOINDEX=true until separate SEO-launch approval
no production DNS changes
no Tunnel changes
no Worker changes
no indexability cutover
no Domain Expansion
no second wallet
no second reward ledger
no second analytics pipeline
no parallel authorization/audit system
```

---

## 9. Verification scope

CE6.1 changes backend code plus documentation only.

Required rebuild scope after pulling the implementation:

```text
pnpm api
```

Do not run `pnpm frontend` or `pnpm stack` for CE6.1 unless later changes actually touch those scopes.
