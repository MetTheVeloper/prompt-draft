# Milestone 12 — Manage Dashboard Summary

Status: IMPLEMENTED — AWAITING USER VERIFICATION

## Goal

Replace the temporary authorization-proof Dashboard with a real permission-gated system summary built only from trustworthy data already persisted by Prompt Draft.

The first Dashboard version deliberately avoids fake or inferred analytics.

## Route

```text
/manage/dashboard
```

The Manage section remains protected by:

```text
dashboard.view
```

The metrics API is independently protected by:

```text
system.metrics.view
```

Backend authorization remains authoritative.

## API

```text
GET /api/admin/dashboard/summary
```

Successful response:

```json
{
  "ok": true,
  "summary": {
    "accounts": {
      "total": 0,
      "active": 0,
      "suspended": 0,
      "newToday": 0
    },
    "sessions": {
      "active": 0
    },
    "cloudDrafts": {
      "total": 0,
      "updatedToday": 0
    },
    "adminActions": {
      "today": 0
    }
  },
  "period": {
    "dayStartUtc": "2026-09-04T00:00:00.000Z",
    "generatedAt": "2026-09-04T...Z"
  }
}
```

## Metric semantics

### Accounts

```text
total
  -> total rows in users

active
  -> users.status = active

suspended
  -> users.status = suspended

newToday
  -> users.created_at since 00:00 UTC
```

`active` means account status, not behavioral activity.

### Sessions

```text
active
  -> unexpired auth_sessions belonging to active accounts
```

### Cloud Drafts

```text
total
  -> total rows in prompt_drafts

updatedToday
  -> prompt_drafts.server_updated_at since 00:00 UTC
```

The Dashboard intentionally uses `updatedToday` instead of `newDraftsToday`. `prompt_drafts.created_at` is client-owned data and therefore is not a sufficiently authoritative server metric for new server-side draft creation.

### Admin actions

```text
today
  -> rows in admin_audit_log since 00:00 UTC
```

## Time boundary

Milestone 12 v1 defines `Today` as:

```text
00:00 UTC -> generatedAt
```

The API returns the exact UTC boundary so the UI does not imply a hidden local-time interpretation.

Timezone-aware reporting is deferred until analytics requirements are defined.

## Dashboard UI

The old account/role/backend-proof panel is replaced by live summary cards:

```text
Total users
Active accounts
Suspended accounts
New users today
Active sessions
Cloud drafts
Drafts updated today
Admin actions today
```

The page includes manual Refresh and a generated-at timestamp.

New Dashboard UI uses the project EL component system and no page-specific CSS.

Reusable card:

```text
app/components/manage/ManageMetricCard.vue
```

## Explicitly not included

These values are not currently persisted and therefore are not exposed yet:

```text
site visits
page views
daily active users by behavioral activity
translation request count
translation success/failure count
```

They require a separate analytics/event-tracking foundation. Dashboard cards can be extended later without changing the current summary semantics.

## Implementation files

```text
backend/src/adminDashboard.mjs
backend/src/auth.mjs
app/types/adminDashboardApi.ts
app/composables/usePromptDraftApi.ts
app/components/manage/ManageMetricCard.vue
app/pages/manage/dashboard.vue
app/config/manage.ts
```

No database migration is required for this milestone.

## Verification requirements

Do not mark Milestone 12 COMPLETE until the user verifies locally:

```text
GET /api/admin/dashboard/summary -> 200 for authorized account
summary values match direct database counts
normal user cannot access the summary API
/manage/dashboard renders all eight live cards
Refresh retrieves a new generatedAt value
Users and other Manage routes remain unaffected
pnpm generate succeeds
/manage/dashboard remains prerendered
```
