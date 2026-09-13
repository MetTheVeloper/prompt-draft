# Campaign Engine — CE3 Promotion Surfaces Implementation

Status: **CE3.1 BACKEND IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Inherited accepted state

```text
CE1 Foundation                 -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / VERIFIED / ACCEPTED
CE2.1 Runtime Core             -> DONE / VERIFIED / ACCEPTED
CE2.2 Actions / Attempts       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

Telegram scheduling remains separate:

```text
CE4.5 -> Shared Telegram Publishing Foundation
```

Telegram is not a CE3 on-site promotion slot.

## CE3 split

CE3 is intentionally divided into two verification slices:

```text
CE3.1 -> backend promotion selection + dismissal + publish validation
CE3.2 -> frontend placement hosts + local persistence/frequency + Product Analytics instrumentation
```

This split follows `DEVELOPMENT_WORKFLOW.md`: backend contracts are verified before adding frontend consumers.

## CE3.1 implemented scope

```text
GET /api/campaign-promotions?slot=<slot>
PUT /api/campaign-promotions/:slug/:promotionId/dismiss
DELETE /api/campaign-promotions/:slug/:promotionId/dismiss

allowed V1 slots:
  site_header
  floating_corner
  modal
  dashboard_banner

optional authentication on selection
required authentication for server-backed user dismissal
campaign lifecycle filtering
promotion-specific schedule filtering
deterministic priority ordering
current published campaign version only
version-scoped user dismissal
TTL-aware user dismissal
session/device dismissal rejected by server so it remains browser-local
safe localized promotion projection
private/unknown promotion fields never projected
runtime fail-closed handling for legacy malformed published promotion JSON
```

## Promotion renderer registry

CE3 introduces a dedicated promotion renderer registry rather than mixing placement renderers with Campaign page renderers.

V1 built-ins:

```text
header-campaign-cta-v1       -> site_header
floating-campaign-card-v1    -> floating_corner
campaign-modal-v1            -> modal
dashboard-campaign-banner-v1 -> dashboard_banner
```

Publish validation rejects unknown renderer keys and renderer/slot mismatches.

## Promotion publish validation

Published Campaign Definitions now validate:

```text
promotion ids are unique/path-safe
slot is one of the four V1 slots
renderer reference is registered and slot-compatible
promotion schedule timestamps are valid and ordered
dismiss enabled/persistence/ttl are valid
frequency cap max/period are valid
priority is an integer
```

`promotions` remains versioned Campaign Definition data. Runtime user dismissal remains normalized state in the existing `campaign_promotion_user_states` table.

## Persistence

No migration is required for CE3.1.

Migration 029 already provides:

```text
campaign_promotion_user_states
  user_id
  campaign_version_id
  promotion_id
  dismissed_at
  dismiss_until
  updated_at
```

User dismissal therefore naturally resets when a campaign publishes a new version unless that new version is dismissed again.

## Selection ordering

Server ordering is deterministic:

```text
priority DESC
campaign lifecycle start DESC
campaign slug ASC
promotion id ASC
```

Frontend may later choose slot capacity from this already stable order.

## Public projection boundary

CE3.1 never returns raw Campaign Definition JSON.

Promotion response exposes only:

```text
campaignSlug
campaignVersion
promotionId
slot
renderer kind/key
allowlisted localized Campaign experience copy
targetPath
priority
safe dismiss config
safe frequencyCap config
```

Unknown/legacy fields are not serialized.

## CE3.2 next scope after CE3.1 verification

```text
CampaignPlacement generic component
site_header host
floating/modal CampaignOverlayHost
dashboard_banner host on the authenticated user surface
session dismissal -> sessionStorage
device dismissal -> localStorage
presentation-only frequency caps
campaign_promotion_impression analytics
campaign_promotion_click analytics
campaign_promotion_dismiss analytics
existing Product Analytics endpoint/allowlist only
```

Product Analytics remains observational and cannot mutate Campaign business state.

Campaign CTA target remains `/campaign/:slug`; CE4 will implement/stabilize the Campaign experience target. CE3 must not invent CE4 mechanic behavior.

## Verification scope

Changed runtime service in CE3.1:

```text
backend only
```

No SQL migration changed.

Smallest founder-local verification:

```powershell
pnpm api
docker compose exec api node --test src/campaignPromotions.test.mjs src/campaignFoundation.test.mjs
```

HTTP smoke:

```powershell
curl.exe -i "http://localhost:4000/api/campaign-promotions?slot=site_header"
```

Expected with no active configured promotions:

```text
HTTP 200
{"ok":true,"slot":"site_header","promotions":[]}
```

Invalid slot smoke:

```powershell
curl.exe -i "http://localhost:4000/api/campaign-promotions?slot=telegram"
```

Expected:

```text
HTTP 400
CAMPAIGN_PROMOTION_SLOT_INVALID
```

No frontend rebuild, `db:schema`, `pnpm generate`, or `pnpm stack` is required for CE3.1.

Do not mark CE3.1 DONE until founder-local evidence is clean and no hidden blocker is found.
