# Campaign Engine — CE4 Public Experience + Trusted Mechanics Implementation

Status: **CE4.1 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13 · CE4.2A DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13 · CE4.2B IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION · CE4.3 NOT STARTED**

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
CE4.2A Trusted Custom Game     -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
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

### Founder-local verification evidence

Founder ran:

```powershell
pnpm frontend
```

Result:

```text
Nuxt client build  -> PASS
Nuxt SSR build     -> PASS
Nitro build        -> PASS
frontend container -> STARTED
```

The archived CE3 local fixture was visually verified on both EN and FA routes in Light and Dark mode. Archived lifecycle and closed participation behavior were correct.

CE4.1 is therefore:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

---

## CE4.2 — Custom Game

CE4.2 is intentionally split into backend authority first and UI second.

### CE4.2A — Trusted backend runtime — ACCEPTED

Implementation commits:

```text
e23f70dd2aeeca67a535e9de72a3d0f0cf8b473d
  feat: add trusted custom game runtime

a13e56e0bfd85f06c6391f7d5a1d97c565d76ba2
  fix: harden trusted custom game validation

668a5fbc68a6b6becec47a61919ee6196ff223e8
  test: keep CE2.2 attempt fixture mechanic-neutral
```

Changed backend/runtime files:

```text
backend/src/campaignCustomGame.mjs
backend/src/campaignCustomGame.test.mjs
backend/src/campaignAttempts.mjs
backend/src/campaignActions.mjs
backend/src/campaignRuntimeDefinition.mjs
```

No SQL migration was required. Migration 029 already provides `private_context`, `outcome`, and attempt lifecycle timestamps.

#### Server-verifiable V1 contract

The first V1 verifier is:

```text
exact_answer_v1
```

Its accepted answers live only in `config.private.verifier`. Publish validation requires a valid custom-game verifier and attempt policy.

On attempt reservation the server:

```text
selects the challenge
normalizes accepted answers
creates a random per-attempt salt
stores salted SHA-256 answer hashes in private_context
projects only challenge id + localized prompt to the browser
```

The browser never receives accepted answers, answer hashes, salt, trusted outcome or reward authority.

A submission uses the existing generic action envelope:

```text
action = game_finished
payload = { answer }
evidence = { attemptId }
```

The server locks the caller-owned attempt, validates evidence, checks the answer and decides exactly one trusted outcome:

```text
win
lose
```

The attempt is persisted as resolved before completion evaluation. Trusted events are `attempt_resolved` for every valid resolution and `game_won` only for a server-verified win.

The existing `mechanic_outcome` completion resolver can consume the persisted result. Existing atomic completion reward settlement remains the only Goin issuance path.

#### Idempotency and race boundary

CE4.2A reuses CE2.2 identities and locking:

```text
server-created attempt
participation row serialization
attempt row lock for resolution
request-hash idempotency conflict detection
one accepted action per participation/idempotency key
resolved attempt cannot be resolved again through a new accepted transition
```

#### Founder-local verification evidence

Founder first ran the aggregate CE4.2A + inherited regression gate:

```powershell
docker compose exec api node --test src/campaignCustomGame.test.mjs src/campaignActionsAttempts.test.mjs src/campaignRuntime.test.mjs
```

Result:

```text
15 total
13 pass
2 fail
```

The new custom-game tests were all green and the CE2.1 runtime tests were all green. The two failures were isolated to the old CE2.2 generic fixture because that fixture still modeled a `custom_game` without the verifier contract that CE4.2A now correctly requires.

Production runtime was not weakened to satisfy stale test data. The generic CE2.2 fixture was changed to the mechanic-neutral `task_list` type, preserving the purpose of those attempt/action tests.

Founder then ran the smallest focused rerun:

```powershell
docker compose exec api node --test src/campaignActionsAttempts.test.mjs
```

Result:

```text
5/5 PASS
0 FAIL
```

Combined evidence therefore proves:

```text
custom-game definition validation -> PASS
private verifier does not enter public challenge -> PASS
server-verified win/lose -> PASS
resolved attempt persistence -> PASS
trusted outcome/completion/reward path -> PASS
retry/idempotency -> PASS
wrong answer cannot create trusted win/reward -> PASS
CE2.2 generic attempt/action regression -> PASS
CE2.1 runtime regression -> PASS
```

CE4.2A is therefore:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

### CE4.2B — Renderer / client — IMPLEMENTED / AWAITING VERIFICATION

Implementation commit:

```text
38200d0441693f3de296513d42266ba9039a5016
  feat: add Campaign custom game client
```

Frontend scope:

```text
app/composables/useCampaignMechanics.ts
app/composables/useCampaignCustomGame.ts
app/components/campaign/CustomGame.vue
app/components/campaign/ChallengeResult.vue
app/pages/campaign/[slug].vue
i18n/i18n.config.ts
i18n/locales/campaign-game.en.ts
i18n/locales/campaign-game.fa.ts
```

The accepted CE4.1 `DefaultExperience` remains unchanged. The public Campaign page adds custom-game mechanics additively after the generic Campaign experience only when the authenticated caller has a participation.

#### Client runtime boundary

The client reuses the accepted backend routes:

```text
POST /api/campaigns/:slug/mechanics/:mechanicId/attempts
POST /api/campaigns/:slug/actions
```

Flow:

```text
reserve attempt
-> receive publicContext only
-> submit attempt_started
-> render localized public challenge
-> submit user answer as untrusted payload
-> server decides/persists outcome
-> render only server-returned attempt.outcome
-> refresh authoritative caller state
```

The browser never receives private verifier material and never chooses success, reward amount or reward expiry.

#### Recovery/idempotency

A pending reservation idempotency key is held in `sessionStorage` only as a recovery aid. Reloading an unresolved challenge replays the same reservation request and receives the established attempt rather than consuming a new attempt slot.

Action identities are stable per attempt:

```text
campaign:game:start:<attemptId>
campaign:game:finish:<attemptId>
```

The answer snapshot is held for same-request retry after a transient submission failure so a retry cannot silently mutate the already-established idempotency request.

Browser storage is never authoritative for eligibility, attempt usage, answer correctness, result or reward.

#### UI contract

The renderer uses the existing Prompt Draft UI system:

```text
el-flex
el-text
el-text-field
el-button
semantic normal / prim / red / green / orange colors
```

No native form-control system, raw colors or custom page-local CSS framework was introduced. EN/FA strings are supplied through the existing i18n merge configuration.

#### Verification gate

CE4.2B changed frontend/i18n only. Smallest required build is:

```powershell
pnpm frontend
```

After a clean build, a controlled local-only active custom-game fixture should verify:

```text
participation start
attempt reservation
public challenge rendering
refresh/recovery without consuming another attempt
wrong answer -> server-returned non-success result
correct answer -> server-returned success result
remaining-attempt state refresh
EN/FA + RTL
Light/Dark
```

Do not mark CE4.2B or CE4.2 overall accepted until that gate is clean.

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
CE4.2A trusted custom-game backend              -> ACCEPTED
CE4.2B custom-game renderer/client              -> IMPLEMENTED / VERIFICATION PENDING
CE4.3 server-authoritative chance wheel         -> NOT STARTED
```

Then execution moves to:

```text
CE4.5 — Shared Telegram Publishing Foundation
```
