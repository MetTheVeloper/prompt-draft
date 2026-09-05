# Milestone 21A — Behavioral Analytics Design

Status: **DESIGN COMPLETE / IMPLEMENTED / AWAITING LOCAL VERIFICATION**

Parent:

```text
Milestone 21 — Growth Foundation
```

Implementation handoff:

```text
docs/strategy/MILESTONE_21A_IMPLEMENTATION.md
```

---

# 1. Audit result

Prompt Draft currently has durable data for several product/business events, but no general behavioral analytics system.

Existing systems must keep their current responsibilities:

```text
user_score_events
  -> authoritative idempotent score/reward ledger

admin_audit_log
  -> privileged admin mutation audit

wizard_runs
  -> durable completed Wizard run history

prompt_drafts
  -> durable user Draft resources

referrals
  -> authoritative referrer/referred relationship
```

Behavioral analytics is a **new primitive**, not a rename of those tables.

---

# 2. Important public-content audit finding

Current `/prompts` frontend requires:

```text
logged in + email present
```

before loading Archive content.

Backend `/api/archive` also currently requires authenticated user + email.

Current Archive contracts differ by projection:

```text
list response
  -> metadata/images/tags/model
  -> no full prompt text

detail response
  -> includes full prompt + variants
```

Strategic implication:

> Growth/SEO should eventually separate **public discovery metadata** from **protected/unlocked knowledge content**.

Do not simply make the full current detail endpoint public if future first-copy/unlock economics need content protection.

---

# 3. Static snapshot audit finding

Current fallback:

```text
/data/prompts.json
```

contains complete Prompt Archive items including prompt text/variants.

This remains valid for the current non-commercial Archive fallback model.

It must **not** become the future protected Marketplace content source if paid/unlocked products are introduced.

Future commercial architecture should distinguish:

```text
public/indexable discovery data
vs
protected/unlocked sellable knowledge content
```

No snapshot redesign is required in Phase 21A itself unless public-discovery work explicitly selects it.

---

# 4. Analytics design goals

The first analytics system must answer founder/product questions, not capture every click.

Primary goals:

- count meaningful Prompt/product usage;
- distinguish views from value-extraction actions;
- support referral funnel analysis;
- support anonymous and authenticated journeys;
- allow later personalization/retention analysis;
- create an accelerator/investor-quality factual metrics layer;
- remain separate from economic/reputation authority.

---

# 5. Non-goals

Phase 21A does not build:

- an external analytics vendor integration;
- a full warehouse/lake;
- real-time streaming infrastructure;
- cross-site ad tracking;
- fingerprinting;
- economic debit/credit authority;
- Creator reputation authority;
- full funnel dashboard on day one.

---

# 6. Identity model

Analytics events may be anonymous or authenticated.

## `user_id`

Nullable.

If a valid bearer session is supplied, backend resolves the canonical user UUID.

Client must never be allowed to assert arbitrary `user_id`.

## `anonymous_id`

Client-generated random UUID persisted locally for product analytics continuity before/without login.

Properties:

- not derived from IP/device fingerprint;
- not a secret;
- not trusted for financial/security decisions;
- may be associated with events before and after login;
- useful for anonymous-to-account funnel analysis.

## `session_id`

Client-generated ephemeral UUID representing a browser/app analytics session.

The implemented V1 uses per-tab `sessionStorage`, giving a simple ephemeral browser-session boundary without fingerprinting.

Analytics identity is observational only.

---

# 7. Event identity and retry safety

Each client event receives a random UUID `event_id`.

Database primary/unique identity prevents a network retry from inserting the exact same event twice.

This is **delivery dedupe**, not business idempotency.

Do not reuse analytics `event_id` as an economic transaction id.

---

# 8. Implemented schema

Migration:

```text
020_product_analytics_events.sql
```

Table:

```text
product_analytics_events
  id UUID PRIMARY KEY
  event_name TEXT NOT NULL
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL
  anonymous_id UUID NOT NULL
  session_id UUID NOT NULL
  resource_type TEXT NULL
  resource_id TEXT NULL
  path TEXT NULL
  locale TEXT NULL
  metadata JSONB NOT NULL DEFAULT '{}'
  occurred_at TIMESTAMPTZ NULL
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Implemented indexes:

```text
(event_name, received_at DESC)
(user_id, received_at DESC) WHERE user_id IS NOT NULL
(resource_type, resource_id, event_name, received_at DESC)
(anonymous_id, received_at DESC)
(session_id, received_at DESC)
```

No high-cardinality metadata index is present.

---

# 9. API contract

Implemented endpoint:

```text
POST /api/analytics/events
```

Public endpoint with optional Authorization header.

Example request:

```json
{
  "eventId": "uuid",
  "eventName": "prompt_archive_copy",
  "anonymousId": "uuid",
  "sessionId": "uuid",
  "resource": {
    "type": "prompt_archive_item",
    "id": "511"
  },
  "path": "/prompts?id=511",
  "locale": "en",
  "occurredAt": "2026-09-06T00:00:00.000Z",
  "metadata": {
    "variantKey": "main"
  }
}
```

First delivery response:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": false
}
```

Repeated same `eventId` returns success without a second row:

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": true
}
```

---

# 10. Validation / abuse boundaries

Because the endpoint is public, it does not accept arbitrary unlimited payloads.

Implemented V1 boundaries:

- allowlisted event names;
- UUID validation;
- bounded path/resource strings;
- `en | fa` locale allowlist;
- 8 KiB request-body ceiling;
- per-event metadata allowlist;
- unknown top-level field rejection;
- no prompt text/output snapshots in the accepted metadata contract;
- no email/password/token fields;
- no arbitrary nested large objects;
- server-controlled `user_id` resolution.

Analytics is not trusted evidence for financial payouts or permissions.

---

# 11. Initial event taxonomy

V1 intentionally starts small.

## `prompt_archive_view`

Meaning:

A specific Archive detail item was successfully loaded into the detail experience.

Resource:

```text
prompt_archive_item:<publicId>
```

Metadata:

```text
source?: api | fallback
```

No prompt text/title is sent as event metadata.

## `prompt_archive_copy`

Meaning:

The clipboard operation for a Prompt Archive prompt/variant completed successfully.

Metadata:

```text
variantKey
```

This is behavioral usage, not yet a purchase/unlock transaction.

## `prompt_archive_link_copy`

Reserved for a later UI action. Not accepted by the first implemented API allowlist yet.

## `referral_link_open`

Reserved for Phase 21B. Not accepted by the first implemented API allowlist yet.

## `preferences_completed`

Reserved for Phase 21C once the onboarding/preferences resource exists.

---

# 12. Events intentionally derived from existing resources first

Do not duplicate durable business resources without need.

## Successful referral

Derive from:

```text
referrals
```

## Wizard completion count

Can initially derive from:

```text
wizard_runs
```

If funnel/session correlation later needs explicit analytics completion, add it deliberately.

## Cloud Draft creation

Can derive from:

```text
prompt_drafts
and/or draft_created score event
```

Do not emit duplicate generic analytics merely to increase event volume.

---

# 13. Frontend integration

Implemented composable:

```text
app/composables/useProductAnalytics.ts
```

Responsibilities:

- create/load anonymous UUID in localStorage;
- maintain session UUID in sessionStorage;
- construct event IDs;
- attach path/locale;
- include Auth header through existing Auth infrastructure;
- send best-effort event;
- never block the primary product action on analytics failure.

Product rule:

> analytics failure must never make Copy/View/Wizard/Draft functionality fail.

---

# 14. First instrumentation points

## Archive detail view

Implemented in:

```text
app/components/prompts/PromptDetail.vue
```

Emit after a valid detail item is mounted and when navigation changes to a different item.

## Prompt copy

Implemented in:

```text
app/components/prompts/PromptDetail.vue
```

Emit only after clipboard/fallback copy reports success.

Current `copyPrompt()` remains the single action boundary for both visible Copy buttons.

---

# 15. Backend integration

Implemented module:

```text
backend/src/productAnalytics.mjs
```

Responsibilities:

- route matching;
- optional authenticated-user resolution;
- input validation;
- event allowlist/metadata normalization;
- insert/dedupe;
- stable response.

Central API routing is wired through:

```text
backend/src/index.mjs
```

Analytics SQL is not placed inside unrelated Archive/UI handlers.

---

# 16. Privacy / ownership policy

Analytics rows are Prompt Draft-owned non-sellable ecosystem intelligence.

Creator product removal does not imply deletion of historical analytics rows under the founder-approved data model.

Long-term analysis/reporting should prefer aggregate/anonymized data.

V1 avoids storing unnecessary personal data in the first place.

No raw IP fingerprinting is required or implemented.

---

# 17. Retention

Founder direction says internal platform intelligence is retained even when commercial Creator content is removed.

Exact raw-event retention duration is not yet selected.

For V1/local growth experiments, retain events in PostgreSQL and design future aggregation/anonymization before scale demands archival policies.

Do not implement automatic deletion without a separately approved privacy/compliance requirement.

For timeline reporting, prefer server-controlled `received_at`; client `occurred_at` is observational and must not become financial/security authority.

---

# 18. Public discovery vs protected knowledge follow-up

The Archive access audit revealed a separate Phase 21D/Marketplace architecture issue.

Future target shape:

```text
public discovery projection
  title
  creator
  images/examples
  tags/category
  description/evidence
  pricing/access metadata
  SEO content

protected knowledge projection
  prompt text
  template internals
  workflow protected assets/steps
  unlocked execution data
```

Current Archive snapshot/detail contracts predate commerce and should not be treated as the final paid-content security model.

---

# 19. Implementation state

The first slice has been implemented in code.

Verification sequence and exact local commands are maintained in:

```text
docs/strategy/MILESTONE_21A_IMPLEMENTATION.md
```

No Growth dashboard is required before event persistence itself is verified.

---

# 20. Acceptance criteria

Phase 21A first slice is complete only when local verification proves:

- authenticated Prompt detail view creates the intended view event;
- the public analytics API accepts an anonymous event with `user_id = null`;
- authenticated events resolve canonical `user_id` server-side;
- successful Copy creates a copy event;
- failed Copy does not create a copy event;
- retry with same `eventId` does not duplicate;
- invalid/oversized/unapproved payload is rejected;
- analytics API failure does not break Copy/View;
- no prompt text is stored in analytics metadata;
- persisted events are queryable in PostgreSQL;
- existing XP/admin audit behavior is unchanged;
- `pnpm generate` succeeds.

Do not mark this document `DONE / LOCALLY VERIFIED` until explicit user acceptance.
