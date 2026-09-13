# Campaign Engine — CE3 Promotion Surfaces Implementation

Status: **CE3.1 FOUNDER-LOCAL VERIFIED / CE3.2 IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

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

## CE3.1 founder-local evidence

Founder-local verification on 2026-09-13:

```text
pnpm api
  -> API rebuilt successfully

node --test
  campaignPromotions.test.mjs
  campaignFoundation.test.mjs
  campaignRuntime.test.mjs

18 tests
18 pass
0 fail
```

HTTP smoke:

```text
GET /api/campaign-promotions?slot=site_header
-> 200
-> {"ok":true,"slot":"site_header","promotions":[]}

GET /api/campaign-promotions?slot=telegram
-> 400
-> CAMPAIGN_PROMOTION_SLOT_INVALID
```

The unrelated existing orphan `cloudflared` Compose warning remains outside Campaign Engine scope.

CE3.1 is therefore technically founder-local verified. Founder acceptance has not yet been recorded separately.

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

Published Campaign Definitions validate:

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

No migration is required for CE3.

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

User dismissal naturally resets when a campaign publishes a new version unless that new version is dismissed again.

CE3.2 browser-local state uses version-scoped keys for:

```text
session dismissal -> sessionStorage
device dismissal  -> localStorage
frequency session -> sessionStorage
frequency day     -> localStorage + browser-local day key
frequency campaign-> localStorage
```

These controls are presentation-only and never authorize participation/reward/economy state.

## Selection ordering

Server ordering is deterministic:

```text
priority DESC
campaign lifecycle start DESC
campaign slug ASC
promotion id ASC
```

Frontend chooses the first candidate still allowed by local dismissal/frequency state.

## Public projection boundary

CE3 never returns raw Campaign Definition JSON.

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

## CE3.2 implemented scope

Frontend implementation adds:

```text
useCampaignPromotions
CampaignPlacement
CampaignPromotionSurface
CampaignHeaderHost
CampaignOverlayHost

site_header -> teleported into the existing Prompt Draft Header
floating_corner -> shared global overlay host
modal -> existing useModal / global modal system
dashboard_banner -> renderer + generic placement support ready
```

No campaign-specific conditionals were added to the global shell.

### Header integration

`site_header` uses the existing Header DOM as its host through Vue Teleport.

This avoids changing the global content-height calculation or creating a second header shell. On mobile the CTA uses the existing `el-button` fab behavior.

### Floating integration

The floating card uses Prompt Draft `el-flex`, `el-text`, and `el-button` primitives and semantic theme tokens.

The only scoped CSS introduced is structural geometry:

```text
fixed positioning
logical inline edge
bottom offset
maximum responsive width
z-index
```

No raw feature colors or page-local visual system were introduced.

### Modal integration

Campaign modal promotions use the existing global `useModal` / `<el-modal>` system.

Campaign Engine does not create its own backdrop, Escape handling, modal stack, or theme implementation.

### dashboard_banner mounting decision

The repository's current `/dashboard` route is a legacy redirect to:

```text
/manage/dashboard
```

and that destination requires the admin-only `dashboard.view` permission. Ordinary users do not have that permission.

Therefore CE3 deliberately does **not** mount a customer Campaign `dashboard_banner` into `/manage/dashboard` merely because the slot is named `dashboard_banner`.

Current direction:

```text
renderer contract        -> implemented
CampaignPlacement support -> implemented
admin Manage dashboard   -> intentionally not used as a customer promotion surface
end-user dashboard host  -> attach when a legitimate end-user dashboard surface exists
```

This prevents Campaign discovery UI from leaking into an operator-only administration surface.

## Attribution handoff to CE4

Promotion activation stores one bounded pending attribution object in `sessionStorage`, keyed by Campaign slug:

```json
{
  "source": "onsite",
  "medium": "campaign_promotion",
  "campaign": "payiz",
  "placement": "site_header",
  "referrer": "/prompts"
}
```

Only fields already accepted by the Campaign participation runtime contract are stored.

The referrer uses `route.path`, not arbitrary query strings, so CE3 does not persist sensitive/unbounded URL query payloads.

`readPendingCampaignAttribution(slug, { consume })` is the explicit handoff for CE4 Campaign landing/start implementation.

CE3 does not start participation on click and does not invent CE4 behavior.

## Product Analytics

The existing `/api/analytics/events` endpoint is extended with only these observational events:

```text
campaign_promotion_impression
campaign_promotion_click
campaign_promotion_dismiss
```

Resource contract:

```text
resource.type = campaign_promotion
resource.id   = campaign slug
```

Bounded allowlisted metadata:

```text
promotionId
slot
campaignVersion
rendererKey
dismissPersistence
```

Analytics failure cannot block:

```text
rendering
click/navigation
dismissal
participation
reward
budget
Economy
```

No new campaign analytics ingestion endpoint was created.

## CE3.2 verification scope

Changed runtime services:

```text
backend -> Product Analytics allowlist/validation
frontend -> promotion composable/components/global hosts
```

No SQL migration changed.

Smallest founder-local verification:

```powershell
pnpm api

docker compose exec api node --test src/productAnalytics.test.mjs src/campaignPromotions.test.mjs

pnpm frontend
```

No `db:schema`, `pnpm generate`, or `pnpm stack` is required.

Because the current database has no active configured promotion, an empty promotion response is expected and does not visually exercise the renderer. Visual founder verification of an actual header/floating/modal promotion requires a real published Campaign Definition with that promotion configured; do not add production-like seed side effects merely for reassurance.

## Acceptance gate

Do not mark CE3.2 or CE3 overall DONE/ACCEPTED until:

```text
backend focused regression is clean
Nuxt frontend build is clean
no hidden runtime error is observed
Founder acceptance is explicit or equivalent under project convention
```
