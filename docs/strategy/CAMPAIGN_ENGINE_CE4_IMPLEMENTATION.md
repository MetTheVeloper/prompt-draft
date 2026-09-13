# Campaign Engine — CE4 Public Experience + Trusted Mechanics Implementation

Status: **CE4.1 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13 · CE4.2A IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION · CE4.2B NOT STARTED · CE4.3 NOT STARTED**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

## Inherited accepted state

```text
CE1 Foundation                  -> DONE / VERIFIED / ACCEPTED
Expiring / Promotional Goin V1 -> DONE / VERIFIED / ACCEPTED
CE2.1 Runtime Core             -> DONE / VERIFIED / ACCEPTED
CE2.2 Actions / Attempts       -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
CE3 Promotion Surfaces         -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
CE4.1 Public Campaign          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

After CE4 acceptance, the scheduled next bridge remains:

```text
CE4.5 — Shared Telegram Publishing Foundation
```

## CE4 sequencing

CE4 keeps the founder-approved V1 scope but is verified in slices:

```text
CE4.1  -> Public Campaign Experience + participation/state client
CE4.2A -> Custom Game trusted backend runtime
CE4.2B -> Custom Game renderer/client
CE4.3  -> Chance Wheel server-authoritative RNG + mechanic-outcome reward settlement
```

This split does not reduce CE4 scope. It establishes the generic public Campaign entry first, then adds mechanic-specific authority without weakening CE2.2 attempts/actions.

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
custom renderers use the same Campaign runtime protocol
```

---

## CE4.1 — Public Campaign Experience — ACCEPTED

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

No backend or SQL change was required for CE4.1 because CE2 already provides the public Campaign projection, authenticated caller state and participation-start APIs.

### Accepted route/runtime behavior

Canonical public routes:

```text
/campaign/:slug
/fa/campaign/:slug
```

The page is generic and renderer-registry driven. No campaign-specific permalink page is introduced.

The accepted built-in renderer is:

```text
campaign-default-v1 -> CampaignDefaultExperience
```

Unknown renderer references fail closed. Public SSR uses the safe Campaign projection. Browser auth is initialized only after hydration; a public Campaign page does not require a browser token for SSR.

Declared EN/FA locales are enforced. The page reuses `usePublicSeo`; Campaign SEO defaults remain noindex and the project-wide runtime invariant still wins:

```text
NUXT_PUBLIC_NOINDEX=true
```

### Participation and CE3 attribution

`useCampaignRuntime` consumes:

```text
GET  /api/campaigns/:slug
GET  /api/campaigns/:slug/state
POST /api/campaigns/:slug/participation
```

Participation identity, eligibility, version lock, completion and rewards remain backend-authoritative.

CE3 promotion attribution follows:

```text
read bounded pending attribution
-> POST participation
-> consume attribution only after successful start
```

Failed participation therefore does not silently lose attribution before retry.

### Founder-local verification evidence

Founder ran the required smallest frontend scope:

```powershell
pnpm frontend
```

Result:

```text
Nuxt client build -> PASS
Nuxt SSR build    -> PASS
Nitro build       -> PASS
frontend container -> STARTED
```

Non-blocking warnings were limited to the already-known sourcemap/chunk-size output and orphan cloudflared notice.

The archived CE3 local fixture was then visually verified on:

```text
/campaign/ce3-visual-fixture
/fa/campaign/ce3-visual-fixture
```

Verified:

```text
EN public route renders
FA route renders RTL correctly
archived lifecycle displays correctly
closed Campaign does not offer Start Participation
Light Mode is correct
Dark Mode is correct
shared header/shell remains correct
```

Founder supplied clean Light/Dark screenshots for both EN and FA. CE4.1 is therefore:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

---

## CE4.2 — Custom Game

CE4.2 is intentionally split into backend authority first and UI second.

### CE4.2A — Trusted backend runtime

Status:

```text
IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION
```

Implementation commits:

```text
e23f70dd2aeeca67a535e9de72a3d0f0cf8b473d
  feat: add trusted custom game runtime

a13e56e0bfd85f06c6391f7d5a1d97c565d76ba2
  fix: harden trusted custom game validation
```

Changed backend files:

```text
backend/src/campaignCustomGame.mjs
backend/src/campaignCustomGame.test.mjs
backend/src/campaignAttempts.mjs
backend/src/campaignActions.mjs
backend/src/campaignRuntimeDefinition.mjs
```

No SQL migration is required. Migration 029 already provides:

```text
campaign_attempts.private_context
campaign_attempts.outcome
campaign_attempts.started_at
campaign_attempts.submitted_at
campaign_attempts.resolved_at
```

#### Server-verifiable V1 contract

The first V1 verifier is:

```text
exact_answer_v1
```

Its private definition contains the accepted answers. Publish validation requires a valid custom-game verifier and attempt policy before a Campaign Version may be published.

On attempt reservation the server:

```text
selects the challenge
normalizes accepted answers
creates a random per-attempt salt
stores only salted SHA-256 answer hashes in private_context
projects only challenge id + localized prompt to the browser
```

The browser never receives accepted answers, answer hashes, salt, trusted outcome or reward authority.

A submission uses the existing generic action envelope:

```text
action = game_finished
payload = { answer }
evidence = { attemptId }
```

The server resolves the authenticated participation and caller-owned attempt, locks the attempt, validates the evidence, evaluates the answer and decides exactly one trusted outcome:

```text
win
lose
```

The persisted attempt becomes `resolved` before completion evaluation.

Trusted events:

```text
attempt_resolved -> every valid resolution
game_won         -> server-verified win only
```

The existing `mechanic_outcome` completion resolver can then read the persisted resolved attempt. If Campaign completion matches, the already accepted atomic Campaign-completion reward settlement may issue Goin through `user_economy_events`.

A browser assertion such as:

```text
won = true
rewardAmount = 9999
```

has no authoritative meaning. Malformed/unsupported client game-finished assertions remain rejected and cannot produce a trusted success event.

#### Idempotency and race boundary

CE4.2A reuses CE2.2 action and attempt identities:

```text
server-created attempt
participation row serialization
attempt row lock for resolution
request-hash idempotency conflict detection
one accepted action per participation/idempotency key
resolved attempt cannot be resolved again through a new accepted state transition
```

Retrying the same accepted finish request returns established state without replaying trusted events or reward effects.

#### Current verification gate

CE4.2A is backend-only. The smallest required founder-local verification is:

```powershell
pnpm api

docker compose exec api node --test \
  src/campaignCustomGame.test.mjs \
  src/campaignActionsAttempts.test.mjs \
  src/campaignRuntime.test.mjs
```

The focused custom-game tests cover:

```text
private verifier validation
safe public challenge projection
server-verified win
resolved attempt persistence
trusted game_won / attempt_resolved events
completion evaluation from trusted mechanic outcome
one Goin grant/economy event on win
retry idempotency
wrong answer -> lose with no trusted win/reward
```

The CE2.2 and CE2.1 suites are included because CE4.2A extends those accepted runtime boundaries.

Do not mark CE4.2A verified until this gate is clean.

### CE4.2B — Renderer / client

Status:

```text
NOT STARTED
```

After CE4.2A verification, CE4.2B will add:

```text
attempt reservation client
attempt_started client action
custom-game challenge rendering from publicContext only
game_finished answer submission
server-returned outcome presentation
EN/FA + Light/Dark UI
no client-side winner/reward authority
```

CE4.2 overall remains incomplete until CE4.2B is verified and the remaining mechanic-outcome reward integration required by the V1 contract is explicitly closed before acceptance.

---

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

---

## CE4 acceptance boundary

CE4 overall remains incomplete until all slices are founder-verified and accepted:

```text
CE4.1 public Campaign page / participation entry -> ACCEPTED
CE4.2 server-verifiable custom game             -> IN PROGRESS
CE4.3 server-authoritative chance wheel         -> NOT STARTED
```

Then execution moves to:

```text
CE4.5 — Shared Telegram Publishing Foundation
```
