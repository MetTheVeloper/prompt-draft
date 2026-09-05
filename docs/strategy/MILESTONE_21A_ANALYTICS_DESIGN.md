# Milestone 21A — Behavioral Analytics Design

Status: **DESIGN COMPLETE / CODE NOT YET STARTED**

Parent:

```text
Milestone 21 — Growth Foundation
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

Initial session policy may use a simple inactivity/new-tab lifecycle; exact rotation behavior can be implemented in the frontend analytics composable.

Analytics identity is observational only.

---

# 7. Event identity and retry safety

Each client event receives a random UUID `event_id`.

Database primary/unique identity prevents a network retry from inserting the exact same event twice.

This is **delivery dedupe**, not business idempotency.

Do not reuse analytics `event_id` as an economic transaction id.

---

# 8. Proposed schema

Next migration must be numbered:

```text
020_product_analytics_events.sql
```

Proposed table:

```text
product_analytics_events
  id UUID PRIMARY KEY
  event_name TEXT NOT NULL
  user_id UUID NULL REFERENCES users(id)
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

Recommended constraints/limits should be enforced primarily at the API boundary, with DB checks for critical bounded vocabularies where stable.

Recommended indexes:

```text
(event_name, received_at DESC)
(user_id, received_at DESC) WHERE user_id IS NOT NULL
(resource_type, resource_id, event_name, received_at DESC)
(anonymous_id, received_at DESC)
(session_id, received_at DESC)
```

Do not add high-cardinality metadata indexes without a real query requirement.

---

# 9. API contract

Proposed endpoint:

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

Response:

```json
{
  "ok": true,
  "accepted": true
}
```

Repeated same `eventId` should return success/no duplicate rather than create another row.

---

# 10. Validation / abuse boundaries

Because the endpoint is public, it must not accept arbitrary unlimited payloads.

V1 requirements:

- allowlisted event names;
- UUID validation;
- bounded path/resource strings;
- bounded locale;
- small metadata object;
- per-event metadata allowlist;
- no prompt text/output snapshots;
- no email/password/token values;
- no arbitrary nested large objects;
- body-size limit appropriate for small events;
- server-controlled `user_id` resolution.

Analytics is not trusted evidence for financial payouts or permissions.

---

# 11. Initial event taxonomy

Keep V1 intentionally small.

## `prompt_archive_view`

Meaning:

A specific Archive detail item was successfully loaded into the detail experience.

Resource:

```text
prompt_archive_item:<publicId>
```

Suggested metadata:

```text
source: api | fallback
```

Do not send prompt text/title as event metadata.

## `prompt_archive_copy`

Meaning:

The clipboard operation for a Prompt Archive prompt/variant completed successfully.

Suggested metadata:

```text
variantKey
```

This is behavioral usage, not yet a purchase/unlock transaction.

## `prompt_archive_link_copy`

Meaning:

User intentionally copied/shared the canonical Prompt page link.

The current product does not yet expose this action; the event becomes active when the UI action is added.

## `referral_link_open`

Meaning:

A registration/landing session arrived with a valid-looking referral username/link parameter.

Do not treat this as a successful referral.

Authoritative success remains the existing `referrals` row.

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

# 13. Frontend integration proposal

Create a focused composable rather than scattering `$fetch` calls:

```text
app/composables/useProductAnalytics.ts
```

Responsibilities:

- create/load anonymous UUID;
- maintain session UUID;
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

Current integration area:

```text
app/pages/prompts.vue
```

Emit only after a valid detail item is loaded.

Avoid duplicate view emission from reactive rerenders.

## Prompt copy

Current integration area:

```text
app/components/prompts/PromptDetail.vue
```

Emit only after clipboard/fallback copy reports success.

Current `copyPrompt()` is the correct single action boundary for both visible Copy buttons.

---

# 15. Backend integration proposal

Create focused module:

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

Database boundary may use a focused function/module or existing database helper conventions.

Do not place analytics SQL directly in unrelated Archive/UI handlers.

---

# 16. Privacy / ownership policy

Analytics rows are Prompt Draft-owned non-sellable ecosystem intelligence.

Creator product removal does not imply deletion of historical analytics rows under the founder-approved data model.

Long-term analysis/reporting should prefer aggregate/anonymized data.

V1 should avoid storing unnecessary personal data in the first place.

No raw IP fingerprinting is required by this design.

---

# 17. Retention

Founder direction says internal platform intelligence is retained even when commercial Creator content is removed.

Exact raw-event retention duration is not yet selected.

For V1/local growth experiments, retain events in PostgreSQL and design future aggregation/anonymization before scale demands archival policies.

Do not implement automatic deletion without a separately approved privacy/compliance requirement.

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

# 19. Implementation sequence

After this design is accepted as branch baseline:

```text
A. add 020_product_analytics_events.sql
B. add backend analytics module + insert function
C. wire central API route
D. add frontend analytics composable
E. instrument Archive view
F. instrument successful Prompt copy
G. add local verification queries
H. pnpm generate
I. user verifies UI/network/database behavior
```

No Growth dashboard is required before event persistence itself is verified.

---

# 20. Acceptance criteria

Phase 21A first slice is complete when local verification proves:

- anonymous detail view creates one valid event per intended view emission;
- authenticated event resolves canonical `user_id` server-side;
- successful Copy creates a copy event;
- failed Copy does not create a copy event;
- retry with same `eventId` does not duplicate;
- invalid/oversized/unapproved payload is rejected;
- analytics API failure does not break Copy/View;
- no prompt text is stored in analytics metadata;
- persisted events are queryable in PostgreSQL;
- existing XP/admin audit behavior is unchanged;
- `pnpm generate` succeeds.
