# Milestone 12 — Manage Dashboard Summary

Status: COMPLETE

## Goal

Replace the temporary authorization-proof Dashboard with a real permission-gated system summary built only from trustworthy data already persisted by Prompt Draft.

The first Dashboard version deliberately avoids fake or inferred analytics.

## Route

```text
/manage/dashboard
```

The Manage section is protected by:

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

Successful response shape:

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
    "dayStartUtc": "ISO timestamp",
    "generatedAt": "ISO timestamp"
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

The Dashboard intentionally uses `updatedToday` instead of `newDraftsToday`. `prompt_drafts.created_at` is client-owned data and is not a sufficiently authoritative server metric for new server-side draft creation.

### Admin actions

```text
today
  -> rows in admin_audit_log since 00:00 UTC
```

## Time boundary

Dashboard v1 defines `Today` as:

```text
00:00 UTC -> generatedAt
```

The API returns the exact UTC boundary so the UI does not imply a hidden local-time interpretation.

Timezone-aware reporting remains deferred until analytics requirements are defined.

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

The UI uses the project EL component system and no page-specific CSS.

Reusable card:

```text
app/components/manage/ManageMetricCard.vue
```

The metric card formats numeric values according to the active UI locale.

## Localization closure

All current Dashboard user-facing copy is centralized under:

```text
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

Covered Dashboard surfaces include:

```text
section label/description
live summary text
last-updated text
Refresh
loading/error fallback
all eight card labels
all eight card helper descriptions
```

The shell resolves the Dashboard section copy through `manage.sections.dashboard.*`; `app/config/manage.ts` contains no display copy.

## Explicitly not included

These values are not currently persisted and therefore are not exposed:

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
i18n/locales/manage.en.ts
i18n/locales/manage.fa.ts
```

No database migration was required for this milestone.

## Local verification

The user locally verified the Dashboard implementation and later confirmed the final Manage localization pass worked correctly.

Verified behavior includes:

```text
authorized Dashboard access
live summary API behavior
all eight Dashboard cards
Refresh/generatedAt behavior
Users/other Manage behavior remains intact
English Manage Dashboard copy
Persian Manage Dashboard copy
```

## Final static-generation verification

On 2026-09-04 the user ran:

```text
pnpm generate
```

and confirmed success.

Result:

```text
16 initial routes prerendered
/manage present
/manage/dashboard present
/manage/users present
.output/public generated
offline manifest generated
225 files / 62.8 MB
```

Known duplicated-import, sourcemap, Nitro cache-driver, and large-chunk warnings remained non-blocking.

## Milestone 12 phases — ALL DONE

```text
contract/documentation: DONE
backend summary API: DONE
typed frontend boundary: DONE
Dashboard live cards: DONE
local runtime verification: DONE
authorization regression: DONE
final EN/FA localization follow-up: DONE
static generation: DONE
```

Milestone 12 is complete.

Future Dashboard extensions should follow:

```text
docs/backend/MANAGE_GUIDE.md
```

and must continue the rule of reporting only persisted metrics with explicit semantics.
