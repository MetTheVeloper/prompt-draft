# Campaign Engine — CE3 Promotion Surfaces Implementation

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Accepted inherited state

```text
CE1 Foundation                 -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / VERIFIED / ACCEPTED
CE2.1 Runtime Core             -> DONE / VERIFIED / ACCEPTED
CE2.2 Actions / Attempts       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
CE3 Promotion Surfaces         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
CE4 Custom Game + Chance Wheel -> NEXT
CE4.5 Shared Telegram System   -> SCHEDULED AFTER CE4 / BEFORE CE5
```

Telegram remains a separate external publishing subsystem. It is not a CE3 on-site promotion slot.

## CE3 scope

CE3 was intentionally verified in two slices:

```text
CE3.1 -> backend promotion selection + dismissal + publish validation
CE3.2 -> frontend placement hosts + local persistence/frequency + Product Analytics instrumentation
```

The split followed `DEVELOPMENT_WORKFLOW.md`: backend contracts were verified before frontend consumers were added.

## CE3.1 — backend runtime

Implemented routes:

```text
GET    /api/campaign-promotions?slot=<slot>
PUT    /api/campaign-promotions/:slug/:promotionId/dismiss
DELETE /api/campaign-promotions/:slug/:promotionId/dismiss
```

Supported V1 slots:

```text
site_header
floating_corner
modal
dashboard_banner
```

Backend behavior:

```text
optional authentication on selection
required authentication for server-backed user dismissal
campaign lifecycle filtering
promotion-specific schedule filtering
deterministic priority ordering
current published campaign version only
version-scoped user dismissal
TTL-aware user dismissal
session/device dismissal stays browser-local
safe localized promotion projection
private/unknown promotion fields never projected
runtime fail-closed handling for malformed legacy published promotion JSON
```

No migration was required. Migration 029 already contains `campaign_promotion_user_states`.

## Promotion renderer registry

Accepted built-ins:

```text
header-campaign-cta-v1       -> site_header
floating-campaign-card-v1    -> floating_corner
campaign-modal-v1            -> modal
dashboard-campaign-banner-v1 -> dashboard_banner
```

Publish validation rejects unknown renderer keys and renderer/slot mismatches.

Published definitions also validate:

```text
promotion ids are unique/path-safe
slot is supported
schedule timestamps are valid and ordered
dismiss config is valid
frequency cap config is valid
priority is an integer
```

## Selection ordering

Server ordering is deterministic:

```text
priority DESC
campaign lifecycle start DESC
campaign slug ASC
promotion id ASC
```

Frontend selects the first server candidate that is still allowed by local dismissal/frequency state.

## Public projection boundary

CE3 never returns raw Campaign Definition JSON.

Promotion responses expose only:

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

Unknown/private fields are not serialized.

## CE3.2 — frontend placement hosts

Implemented frontend primitives:

```text
useCampaignPromotions
CampaignPlacement
CampaignPromotionSurface
CampaignHeaderHost
CampaignOverlayHost
```

Mounting:

```text
site_header      -> teleported into the existing Prompt Draft Header
floating_corner  -> shared global overlay host
modal            -> existing global useModal / el-modal system
dashboard_banner -> renderer + generic placement support ready
```

No campaign-specific branch was added to the global shell.

### Header

`site_header` uses the existing Header DOM through Vue Teleport. It does not create a second header or change the global content-height model.

### Floating card

The floating card uses the existing Prompt Draft design primitives and semantic theme tokens. Scoped CSS is structural only: fixed positioning, logical edge, bottom offset, responsive max width and z-index.

### Modal

Campaign modal promotions use the existing modal system. CE3 does not create a parallel backdrop, Escape handler, modal stack or theme implementation.

### Dashboard banner decision

The current `/dashboard` is a legacy redirect to admin-only `/manage/dashboard`.

Therefore CE3 intentionally does **not** mount a customer Campaign `dashboard_banner` into the operator dashboard merely because the slot is named `dashboard_banner`.

Accepted direction:

```text
renderer contract         -> implemented
CampaignPlacement support -> implemented
admin Manage dashboard    -> intentionally not used as customer promotion surface
end-user dashboard host   -> attach when a legitimate end-user dashboard exists
```

## Browser-local presentation state

Version-scoped local state:

```text
session dismissal -> sessionStorage
device dismissal  -> localStorage
frequency session -> sessionStorage
frequency day     -> localStorage + browser-local day key
frequency campaign-> localStorage
```

These controls are presentation-only and never authorize participation, reward, budget or Economy state.

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

Only fields accepted by the Campaign participation attribution contract are stored. Referrer uses `route.path`, not arbitrary query strings.

CE4 consumes this through:

```text
readPendingCampaignAttribution(slug, { consume })
```

CE3 does not start participation on click and does not implement mechanic/reward authority.

## Product Analytics

The existing `/api/analytics/events` endpoint was extended with observational events only:

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

Allowlisted bounded metadata:

```text
promotionId
slot
campaignVersion
rendererKey
dismissPersistence
```

Analytics failure cannot block rendering, navigation, dismissal, participation, reward, budget or Economy.

## Founder-local verification evidence

### CE3.1 backend regression

2026-09-13:

```text
pnpm api
  -> PASS

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

### CE3.2 backend/frontend verification

2026-09-13:

```text
pnpm api
  -> PASS

node --test
  productAnalytics.test.mjs
  campaignPromotions.test.mjs

13 tests
13 pass
0 fail

pnpm frontend
  -> Nuxt client build PASS
  -> Nuxt SSR build PASS
  -> Nitro server build PASS
  -> frontend container started
```

Observed Nuxt sourcemap/chunk-size warnings and the orphan `cloudflared` Compose warning were unrelated/non-blocking.

## Controlled visual verification

A local-only temporary published Campaign fixture was used. It contained no rewards or Economy effects and was never committed as seed/migration data.

Visual verification covered:

```text
site_header renders inside existing Header
floating_corner renders correctly
modal uses the global Prompt Draft modal system
Light theme renders correctly
Dark theme renders correctly
FA/RTL localized content renders correctly
CTA navigation reaches /campaign/:slug
browser-local version-scoped presentation state works across published version change
```

The Campaign target route correctly reached the not-yet-implemented CE4 Campaign page boundary; a 404 at `/campaign/ce3-visual-fixture` was expected during CE3 and was not a CE3 failure.

The initial fixture accidentally stored Persian text as `????` due to PowerShell/terminal encoding. This was not a CE3 locale bug. The attempted direct UPDATE of the published version was rejected by PostgreSQL with:

```text
ERROR: published campaign versions are immutable
```

That rejection provided additional evidence that the migration-029 immutability trigger is active.

The fixture was then correctly advanced by publishing Version 2 with ASCII-safe Unicode escapes. API projection returned proper Persian content and the UI rendered it correctly in RTL/Dark and Light modes.

Founder response after the corrected Version 2 visual verification:

```text
درست شد
```

Under the project acceptance convention, this records founder acceptance.

## CE3 final status

```text
CE3.1 backend promotion runtime -> DONE / FOUNDER-LOCAL VERIFIED
CE3.2 frontend placements       -> DONE / FOUNDER-LOCAL VERIFIED
CE3 overall                     -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

## Next execution slice

```text
CE4 — Custom Game + Chance Wheel
```

CE4 must re-audit the latest branch before implementation and preserve all existing trust boundaries:

```text
browser is never winner/reward authority
attempts remain server-created/reserved
random outcomes are server-authoritative
published versions remain immutable
Campaign rewards remain in the existing Economy ledger
Product Analytics remains observational only
```

After CE4 acceptance, execution moves to the already scheduled:

```text
CE4.5 — Shared Telegram Publishing Foundation
```

No Docker rebuild is required for this documentation-only acceptance update.
