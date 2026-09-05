# Milestone 21A — Behavioral Analytics Implementation Handoff

Status: **IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Branch:

```text
feature/growth-foundation
```

Design source:

```text
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
```

## Implemented slice

The first Behavioral Analytics Foundation slice now exists as a dedicated product primitive.

Implemented files:

```text
backend/sql/020_product_analytics_events.sql
backend/src/productAnalytics.mjs
backend/src/index.mjs
app/composables/useProductAnalytics.ts
app/components/prompts/PromptDetail.vue
```

No existing XP, referral, admin-audit or Archive persistence system was repurposed.

## Database

Migration:

```text
020_product_analytics_events.sql
```

New table:

```text
product_analytics_events
```

Persisted fields:

```text
id                event UUID / delivery dedupe identity
event_name        allowlisted product event
user_id           nullable canonical authenticated user UUID
anonymous_id      client-generated anonymous continuity UUID
session_id        client-generated per-tab/session UUID
resource_type     current V1: prompt_archive_item
resource_id       current V1: Archive public ID as string
path              bounded product route
locale            en | fa
metadata          bounded JSON object
occurred_at       client observation timestamp
received_at       authoritative server receipt timestamp
```

Important ownership behavior:

```text
user_id REFERENCES users(id) ON DELETE SET NULL
```

Historical product analytics is platform-retained if a user row is later removed.

## Indexes

The migration adds focused indexes for:

```text
event name + received time
user + received time
resource + event + received time
anonymous identity + received time
session + received time
```

No generic metadata JSON index is introduced.

## Backend API

Endpoint:

```text
POST /api/analytics/events
```

Characteristics:

```text
public endpoint
optional Authorization header
canonical user_id resolved only by backend
8 KiB request-body ceiling
strict JSON body contract
unknown top-level fields rejected
event allowlist
per-event metadata allowlist
resource validation
locale/path bounds
UUID validation
ON CONFLICT(event id) delivery dedupe
```

Current accepted event names:

```text
prompt_archive_view
prompt_archive_copy
```

Current metadata contract:

```text
prompt_archive_view
  source?: api | fallback

prompt_archive_copy
  variantKey: required bounded string
```

Prompt text, variants, titles, emails, tokens and arbitrary nested objects are not accepted as analytics metadata.

The response for a first delivery is:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": false
}
```

Retrying the exact same `eventId` succeeds without a second row:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": true
}
```

Analytics rows are observational only. They are not permission, payout, credit, purchase or reputation authority.

## Frontend analytics primitive

Composable:

```text
app/composables/useProductAnalytics.ts
```

Responsibilities:

```text
persistent anonymous UUID -> localStorage
per-tab/session UUID       -> sessionStorage
new UUID per event
current path
current locale
optional current auth header
best-effort API delivery
```

Hard product rule implemented:

> analytics failure never throws into or blocks the primary product action.

## First instrumentation

Component:

```text
app/components/prompts/PromptDetail.vue
```

### Prompt Archive detail view

`prompt_archive_view` is emitted when a valid Prompt detail component is mounted and when navigation changes it to another Archive item.

Resource:

```text
prompt_archive_item:<publicId>
```

When available, the existing Archive read source is recorded as:

```text
api
fallback
```

No prompt text is sent.

### Prompt Archive copy

`prompt_archive_copy` is emitted only after the existing clipboard/fallback copy action reports success.

Metadata:

```text
variantKey
```

A failed copy does not emit the analytics event.

Repeated successful copies intentionally create separate behavioral events because repeat usage is analytically meaningful. Network retry dedupe applies only when the same event UUID is retried.

## Current access limitation carried forward

Phase 21A does not change the existing Archive access contract.

Currently:

```text
/prompts UI -> login + email required
/api/archive -> login + email required
```

Therefore the current product UI normally emits authenticated Prompt view/copy events.

The analytics endpoint itself already supports anonymous events for later public-discovery/referral flows. Removing the Archive access gate belongs to later Growth/Public Discovery design, not this implementation slice.

## Local verification sequence

### 1. Pull branch

```powershell
git pull
```

The local modification in:

```text
public/data/prompts.json
```

is unrelated to 21A and should not be discarded or committed as part of these tests.

### 2. Rebuild backend image

Backend source and SQL are copied into the Docker image rather than bind-mounted, so rebuild API:

```powershell
docker compose up -d --build api
```

### 3. Apply schema

```powershell
docker compose exec api npm run db:schema
```

Expected final migration line includes:

```text
Database schema applied: 020_product_analytics_events.sql
```

### 4. Confirm table

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "\d product_analytics_events"
```

### 5. UI view + copy test

With a logged-in account that has email:

```text
open /prompts
open a Prompt detail
use Copy Prompt
optionally switch variant and Copy again
```

The detail page and copy behavior must remain unchanged from the user's perspective.

### 6. Inspect persisted events

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT event_name, user_id, anonymous_id, session_id, resource_type, resource_id, path, locale, metadata, occurred_at, received_at FROM product_analytics_events ORDER BY received_at DESC LIMIT 20;"
```

Expected product events:

```text
prompt_archive_view
prompt_archive_copy
```

Expected authenticated UI events have non-null `user_id`.

Expected metadata contains no Prompt text.

### 7. Verify delivery dedupe

Use one fixed valid UUID as `eventId` and send the same request twice:

```powershell
$eventId = [guid]::NewGuid().ToString()
$anonymousId = [guid]::NewGuid().ToString()
$sessionId = [guid]::NewGuid().ToString()
$body = @{
  eventId = $eventId
  eventName = "prompt_archive_view"
  anonymousId = $anonymousId
  sessionId = $sessionId
  resource = @{ type = "prompt_archive_item"; id = "511" }
  path = "/prompts?id=511"
  locale = "en"
  occurredAt = (Get-Date).ToUniversalTime().ToString("o")
  metadata = @{ source = "api" }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/analytics/events" -ContentType "application/json" -Body $body
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/analytics/events" -ContentType "application/json" -Body $body
```

Expected responses:

```text
first  -> duplicate = false
second -> duplicate = true
```

Then verify exactly one row for that UUID:

```powershell
docker compose exec db psql -U prompt_draft -d prompt_draft -c "SELECT id, event_name, user_id FROM product_analytics_events WHERE id='$eventId';"
```

### 8. Verify anonymous acceptance

The direct request above intentionally has no Authorization header. Its persisted `user_id` must be null.

This proves anonymous analytics identity without changing the current authenticated `/prompts` product gate.

### 9. Verify validation guard

Example unknown event must fail with HTTP 400:

```powershell
$badBody = @{
  eventId = [guid]::NewGuid().ToString()
  eventName = "made_up_event"
  anonymousId = [guid]::NewGuid().ToString()
  sessionId = [guid]::NewGuid().ToString()
  resource = @{ type = "prompt_archive_item"; id = "511" }
  metadata = @{}
} | ConvertTo-Json -Depth 5

try {
  Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/analytics/events" -ContentType "application/json" -Body $badBody
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Expected:

```text
400
```

### 10. Non-blocking failure behavior

Temporarily stopping/restarting the API while exercising a UI copy action must not make the local clipboard operation depend on analytics delivery.

The primary copy action runs first; analytics is fire-and-forget/best effort.

### 11. Release invariant

```powershell
pnpm generate
```

Must succeed before Phase 21A is marked DONE.

## Acceptance gate

Do not mark 21A complete until the user explicitly verifies:

```text
migration 020 applied
view event persists
copy event persists only after successful copy
authenticated event resolves canonical user_id
anonymous API event stores user_id = null
same eventId retry does not duplicate
invalid event is rejected
metadata contains no prompt text
analytics failure does not break primary action
XP/referral/admin audit behavior remains unchanged
pnpm generate succeeds
```

After acceptance, update:

```text
docs/strategy/STATUS.md
docs/strategy/MILESTONE_21A_ANALYTICS_DESIGN.md
```

from awaiting verification to `DONE / LOCALLY VERIFIED`, then select Phase 21B.
