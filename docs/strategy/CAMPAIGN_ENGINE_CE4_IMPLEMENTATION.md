# Campaign Engine — CE4 Public Experience + Trusted Mechanics Implementation

Status: **CE4.1 IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION · CE4.2 NOT STARTED · CE4.3 NOT STARTED**

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
CE3 Promotion Surfaces         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

After CE4 acceptance, the scheduled next bridge remains:

```text
CE4.5 — Shared Telegram Publishing Foundation
```

## CE4 sequencing

CE4 keeps the founder-approved V1 scope, but is intentionally verified in three slices:

```text
CE4.1 -> Public Campaign Experience + participation/state client
CE4.2 -> Custom Game server-verifiable runtime
CE4.3 -> Chance Wheel server-authoritative RNG + mechanic-outcome reward settlement
```

This split does not reduce CE4 scope. It establishes the public Campaign entry surface first, then adds mechanic-specific authority on top of an already verified page/runtime boundary.

## Frozen trust boundaries

All CE4 slices must preserve:

```text
browser never chooses authoritative user identity
browser never chooses reward amount or expiry
browser never chooses winner / wheel result
attempts are server-created/reserved
custom game success must be server-verifiable
chance wheel RNG and outcome persistence are server-authoritative
mechanic-outcome reward qualification is server-side
reward grants remain atomic, idempotent and budget-safe
Goin remains in user_economy_events
Product Analytics remains observational only
published Campaign Versions remain immutable
custom renderers must use the same Campaign runtime protocol
```

## CE4.1 — Public Campaign Experience

Implementation commits:

```text
a91e0b3fccdace36201540eb502254bda4204354
  feat: add Campaign CE4.1 public experience

8a07a3e481e406634646cd464edbb611da6c9989
  fix: inherit Campaign page theme surface
```

Frontend-only scope:

```text
app/pages/campaign/[slug].vue
app/components/campaign/DefaultExperience.vue
app/composables/useCampaignRuntime.ts
i18n/locales/growth.en.ts
i18n/locales/growth.fa.ts
```

No backend or SQL change is required for CE4.1 because CE2 already provides the public Campaign projection, authenticated caller state and participation-start APIs.

### Generic public route

Canonical page:

```text
/campaign/:slug
/fa/campaign/:slug
```

The page is generic and renderer-registry driven. No campaign-specific permalink page is introduced.

CE4.1 initially binds the accepted built-in renderer:

```text
campaign-default-v1 -> CampaignDefaultExperience
```

Unknown/unavailable renderer references fail closed in the UI rather than executing arbitrary persisted data.

### SSR and locale behavior

The public Campaign projection is fetched during SSR through the server-internal API origin.

The browser-visible auth token is not required for public SSR. After hydration:

```text
auth.initialize()
-> authenticated caller state GET when logged in
-> anonymous public projection remains usable when logged out
```

Declared Campaign locales are enforced. A route locale without corresponding published Campaign content fails closed rather than silently borrowing another locale.

### SEO/indexability

CE4.1 reuses `usePublicSeo` and the accepted EN/default + `/fa` locale model.

Campaign-level SEO intent is read from the safe public projection. Campaign V1 defaults to noindex unless a published definition explicitly requests indexing.

The project-wide runtime invariant still wins:

```text
NUXT_PUBLIC_NOINDEX=true
```

Therefore CE4 implementation does not enable production indexing.

### Participation client

`useCampaignRuntime` consumes the already accepted backend routes:

```text
GET  /api/campaigns/:slug
GET  /api/campaigns/:slug/state
POST /api/campaigns/:slug/participation
```

Participation start:

```text
identity -> auth/session only
idempotency -> session-stable client request key
eligibility -> backend authority
version lock -> backend authority
reward/completion -> backend authority
```

The UI cannot manufacture completion or reward facts.

### CE3 attribution handoff

When a user reaches the Campaign through an accepted CE3 promotion, CE4.1 reads the bounded pending attribution object from `useCampaignPromotions`.

Important retry behavior:

```text
read attribution
-> POST participation
-> only after successful participation start, consume pending attribution
```

A failed participation request therefore does not lose the acquisition attribution before retry.

### Login return path

Logged-out participation uses the existing localized login route and its accepted `next` query behavior so the user returns to the Campaign page after authentication.

### UI implementation

The built-in Campaign page uses existing Prompt Draft primitives:

```text
el-flex
el-text
el-button
semantic theme colors/surfaces
```

Page CSS is structural only:

```text
minimum page height
maximum content width
logical auto margins
```

Light/Dark appearance is inherited from the existing shell/theme system.

## CE4.1 verification gate

Changed runtime service:

```text
frontend only
```

Smallest required founder-local build:

```powershell
pnpm frontend
```

No API rebuild, database schema application, full stack rebuild or static generation is required.

After a clean build, runtime verification should exercise the existing archived local CE3 fixture through:

```text
/campaign/ce3-visual-fixture
/fa/campaign/ce3-visual-fixture
```

Because that Campaign is archived, it is useful for proving:

```text
SSR public route exists
EN/FA localized rendering works
Light/Dark presentation works
archived lifecycle is displayed
participation start is not offered for a closed Campaign
```

A separate active no-reward local fixture may be used only if needed to verify actual participation + CE3 attribution transfer. It must remain local-only and must not be committed as migration/seed data.

Do not mark CE4.1 accepted until the frontend build and public-route runtime verification are clean.

## CE4.2 — Custom Game

Status:

```text
NOT STARTED
```

Target scope after CE4.1 acceptance:

```text
custom_game definition validation
server-verifiable game submission contract
attempt reservation/started lifecycle reuse
bounded evidence schema
authoritative server validation of success/failure
attempt resolved persistence
trusted mechanic outcome event
mechanic state revision
retry/idempotency/conflict behavior
parallel submission protection
mechanic-outcome qualification integration
custom game renderer/client that never acts as reward authority
focused backend tests + smallest required frontend verification
```

The generic CE2 action endpoint must not simply trust a browser `game_finished` assertion. CE4.2 must introduce a mechanic-specific trusted validation path.

## CE4.3 — Chance Wheel

Status:

```text
NOT STARTED
```

Target scope after CE4.2 acceptance:

```text
chance_wheel definition public/private configuration split
server-side cryptographic RNG
server-side weighted outcome resolution
attempt row lock / one-resolution semantics
calendar-day timezone limits through existing attempt periods
persist outcome before client animation
trusted wheel_resolved / mechanic outcome event
mechanic-outcome reward settlement through existing Economy transaction boundary
qualification_key idempotency
budget exhaustion behavior
parallel spin verification
safe public outcome projection
wheel renderer animation consumes server result only
```

The browser may animate a result only after receiving the persisted server outcome. It may never submit or select the winning segment.

## CE4 acceptance boundary

CE4 overall remains incomplete until all three slices are founder-verified and accepted:

```text
CE4.1 public Campaign page / participation entry
CE4.2 server-verifiable custom game
CE4.3 server-authoritative chance wheel + reward path
```

Then execution moves to:

```text
CE4.5 — Shared Telegram Publishing Foundation
```
