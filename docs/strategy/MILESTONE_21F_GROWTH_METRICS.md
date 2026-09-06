# Milestone 21F — Growth Metrics in Manage

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Predecessor:

```text
21E3 Economy UX & Manage -> DONE / LOCALLY VERIFIED / USER ACCEPTED
```

Canonical local verification:

```text
docs/strategy/MILESTONE_21F_VERIFICATION.md
```

## Goal

Turn the Growth Foundation's already-persisted signals into decision-quality administrative read models without creating another analytics warehouse or dashboard shell.

21F reuses:

```text
product_analytics_events
referrals
users
user_economy_events
user_content_unlocks
prompt_archive_items
prompt_archive_item_tags
prompt_archive_tags
existing /manage shell
system.metrics.view permission
```

No new schema is required.

Current migration ceiling remains:

```text
024_prompt_archive_unlocks.sql
```

Next future schema migration remains:

```text
025_*.sql
```

## Capability audit

The original Milestone 21F candidate list included:

```text
active/returning users
prompt views/copies/shares
referral landing/signup conversion
Wizard completion
internal units earned/spent
economy circulation
popular content categories
```

Current persisted capability supports only a subset honestly.

### Supported now

```text
Prompt Archive views
Prompt Archive successful copies
referral-link opens
persisted referral signups
new accounts
Goin issuance/spending
Prompt durable unlocks
Prompt tags
```

### Not instrumented strongly enough yet

```text
whole-product DAU/MAU
Wizard completion analytics
share intent analytics beyond referral-link open
whole-product retention
strict per-click referral attribution
```

21F therefore does not invent those metrics.

## Measurement honesty rule

Audience metrics on the Growth page are explicitly labelled as activity on **currently instrumented growth surfaces**.

They must not be presented as whole-product DAU/MAU.

Current behavioral event coverage is:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Other metrics come from authoritative relational/economy tables rather than analytics events.

## Backend API

New route:

```text
GET /api/admin/growth/summary?days=7
GET /api/admin/growth/summary?days=30
```

Only these windows are accepted:

```text
7
30
```

Invalid windows return:

```text
400 GROWTH_WINDOW_INVALID
```

Authorization:

```text
Authentication required
system.metrics.view required
```

Current role map means both ordinary admin and Super Admin can use Growth metrics, while ordinary users cannot.

Implementation:

```text
backend/src/adminGrowth.mjs
```

Registered through the existing Node API router.

## Summary metrics

### Measured audience

```text
trackedVisitors
  distinct anonymous_id values in product_analytics_events

trackedSessions
  distinct analytics session_id values

trackedAuthenticatedUsers
  distinct non-null backend-canonical user_id values in analytics

returningAuthenticatedUsers
  authenticated users with measured activity on 2+ distinct UTC days

newAccounts
  users.created_at in selected window
```

The returning metric is intentionally a measured-surface return signal, not platform-wide retention.

### Prompt Archive

```text
views
  prompt_archive_view event count

copies
  prompt_archive_copy event count

viewSessions
  sessions containing a Prompt view

copySessions
  sessions containing a successful Prompt copy

copySessionRate
  copySessions / viewSessions

unlocks
  new durable prompt_archive_item rows in user_content_unlocks
```

Copy-session rate is preferable to raw copies/views because repeated copies after durable unlock are intentionally free and can produce multiple Copy events.

### Referral growth

```text
linkOpens
  referral_link_open event count

signups
  referrals.created_at count

shareOfNewAccounts
  referral signups / all new accounts

openToSignupRatio
  referral signups / tracked referral-link opens
```

`openToSignupRatio` is explicitly directional aggregate evidence, not strict attribution. A referral can be entered manually and multiple opens can precede one signup. The UI helper explicitly states that this aggregate can exceed 100% when signups do not have a tracked open.

### Goin circulation

```text
issued
  positive user_economy_events.unit_delta in window

spent
  absolute value of negative unit_delta in window

netFlow
  issued - spent

outstanding
  current platform-wide SUM(unit_delta)

holders
  users whose current ledger balance > 0

activeSpenders
  distinct users with a debit in selected window
```

Economy metrics come directly from the authoritative economy ledger rather than analytics.

## Daily series

The response includes one UTC calendar-day row for every day in the selected window, including zero-activity days:

```text
day
promptViews
promptCopies
referralOpens
referralSignups
goinIssued
goinSpent
promptUnlocks
```

This provides a stable lightweight trend read model without storing duplicated aggregate tables.

## Popular Prompt categories

The response also contains the top eight Archive tags in the window.

Source path:

```text
Prompt analytics resource_id
-> prompt_archive_items.public_id
-> prompt_archive_item_tags
-> prompt_archive_tags.slug
```

Each tag returns:

```text
slug
views
copies
```

Ranking:

```text
copies DESC
views DESC
slug ASC
```

No Prompt body or sellable prompt text enters the metrics response.

## Manage UI

New section:

```text
/manage/growth
```

Registered inside the existing Manage shell with:

```text
system.metrics.view
```

No new dashboard shell is created.

Frontend files:

```text
app/types/adminGrowthApi.ts
app/pages/manage/growth.vue
app/composables/usePromptDraftApi.ts
app/config/manage.ts
i18n/locales/manage-growth.en.ts
i18n/locales/manage-growth.fa.ts
i18n/i18n.config.ts
```

The page includes:

```text
7-day / 30-day window switch
measurement-scope warning
Measured audience cards
Prompt Archive cards
Referral growth cards
Goin circulation cards
daily UTC signal table
popular Prompt tag list
```

The UI uses the existing Manage metric-card component and normal theme-aware design tokens/components.

## Local verification — PASS

Build/runtime:

```text
git pull
docker compose up -d --build api
pnpm generate
```

Result:

```text
PASS
```

Authorization:

```text
anonymous -> 401
ordinary user -> 403
admin / super_admin with system.metrics.view -> 200
```

Query validation:

```text
days=7  -> 200
days=30 -> 200
days=8  -> 400 GROWTH_WINDOW_INVALID
```

Final independent SQL-vs-API verification passed for both 7-day and 30-day windows:

```text
audience summary exactly matches DB
Prompt summary exactly matches DB
referral summary exactly matches DB
economy summary exactly matches DB
tracked event count exactly matches DB
daily series exactly matches DB
Top Tags exactly match DB
measurement scope and event allowlist correct
```

Visual smoke testing also passed in EN/FA and Light/Dark.

Representative 7-day closure values included:

```text
Prompt views 11
Prompt copies 9
Prompt unlocks 3
Referral opens 2
Referral signups 5
Goin issued 320
Goin spent 15
Goin outstanding 305
```

See the canonical verification document for the full evidence.

## Hard rules

```text
DO NOT call measured-surface users whole-product DAU/MAU.
DO NOT infer Wizard completion without Wizard analytics events.
DO NOT claim strict referral attribution from aggregate opens/signups.
DO NOT duplicate authoritative economy values into analytics events.
DO NOT expose Prompt text or variants in Growth metrics.
DO NOT build another dashboard shell.
DO NOT add an aggregate schema until query volume/performance proves it is needed.
DO NOT use admin_audit_log as behavioral analytics.
```

## Closure

21F is closed as:

```text
DONE / LOCALLY VERIFIED / USER ACCEPTED
```

The only remaining Milestone 21 work is the presentation-only UI polish pass documented in:

```text
docs/strategy/MILESTONE_21_UI_POLISH.md
```
