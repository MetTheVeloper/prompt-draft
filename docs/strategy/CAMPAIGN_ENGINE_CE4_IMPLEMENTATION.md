# Campaign Engine — CE4 Public Experience + Trusted Mechanics Implementation

Status: **CE4.1 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13 · CE4.2 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13 · CE4.3A BACKEND IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION · CE4.3B NOT STARTED**

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
CE4.2 Custom Game              -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
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
CE4.3A -> Chance Wheel trusted backend runtime + mechanic-outcome reward settlement
CE4.3B -> Chance Wheel renderer/client
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

## CE4.2 — Custom Game — ACCEPTED

CE4.2 was intentionally split into backend authority first and UI second.

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

The existing `mechanic_outcome` completion resolver consumes the persisted result. Existing atomic completion reward settlement remains the only Goin issuance path for completion-triggered Custom Game rewards.

#### CE4.2A verification evidence

Founder first ran the aggregate CE4.2A + inherited regression gate. New custom-game/runtime tests were green; two stale generic CE2.2 fixtures were then corrected to the mechanic-neutral `task_list` type rather than weakening production validation.

Focused rerun:

```powershell
docker compose exec api node --test src/campaignActionsAttempts.test.mjs
```

Result:

```text
5/5 PASS
0 FAIL
```

Combined evidence proved definition validation, private verifier isolation, server-verified win/lose, trusted outcome persistence, completion/reward settlement, retry idempotency and inherited CE2.1/CE2.2 behavior.

CE4.2A is:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

### CE4.2B — Renderer / client — ACCEPTED

Implementation/fix commits include:

```text
38200d0441693f3de296513d42266ba9039a5016
  feat: add Campaign custom game client

71ca4c0993f23c0d99c02b4360b9e493d5db51bd
  fix: restore persisted custom game outcome

c4afcce5ed500223bb5983f7f71eaec07673a4b6
  fix: render persisted custom game result
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

Browser storage is recovery-only and never authoritative for eligibility, attempt usage, answer correctness, result or reward.

After founder verification exposed a persistence-rendering gap, the client was hardened to recover the last trusted result from `campaign_mechanic_states.state.lastOutcome` when no current browser attempt object exists. This means a completed result survives refresh, locale changes and theme changes without relying on session storage.

#### CE4.2B founder-local evidence

Founder completed the intended flow with a controlled active fixture:

```text
participation start                  -> PASS
attempt reservation                  -> PASS
wrong answer                         -> trusted lose / PASS
retry                                -> PASS
correct Persian-equivalent answer    -> trusted win / PASS
Campaign status                      -> Rewarded
remaining attempts                   -> 0
persisted result after refresh        -> PASS
EN                                   -> Correct / Result confirmed
FA                                   -> درست بود / نتیجه تأیید شد
Light theme                          -> PASS
Dark theme                           -> PASS
```

The final persisted-result verification was explicitly accepted by the founder on 2026-09-13.

CE4.2B and CE4.2 overall are therefore:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
```

---

## CE4.3 — Chance Wheel

CE4.3 is split into trusted backend authority and renderer/client verification:

```text
CE4.3A -> backend RNG / persisted outcome / mechanic-outcome rewards
CE4.3B -> wheel renderer / animation of already-persisted result
```

### CE4.3A — Trusted backend runtime — IMPLEMENTED / AWAITING VERIFICATION

Implementation commits currently include:

```text
59e9d3f2cd4cf96b56e7c6d39e4badeb38771296
  feat: add Campaign chance wheel authority

20ca2c08a54e75f1e8436004f3cb2da1b8d7ef89
  feat: validate Campaign chance wheel definitions

44c483e7b4cf630698aacf461bc6a82c8cd9da98
  test: cover Campaign chance wheel authority

212be3f06e1e4b548029092dcd475eee7d0b7c90
  feat: settle Campaign mechanic outcome rewards

33b41824a10306c5adbead132b0b40fd4fdc9b1a
  feat: resolve Campaign chance wheel spins

fffedcd6d3fa14e9950ca01670d750038238b76d
  test: verify Campaign chance wheel runtime

a558fd892e6a063eea8ca77e54effec55ca65e48
  fix: keep Campaign wheel weights private

e8d58692bccfc2ba7b23aa4878928c688e5524f1
  test: reject public Campaign wheel weights
```

Backend scope:

```text
backend/src/campaignChanceWheel.mjs
backend/src/campaignChanceWheel.test.mjs
backend/src/campaignChanceWheelRuntime.test.mjs
backend/src/campaignOutcomeSettlement.mjs
backend/src/campaignActions.mjs
backend/src/campaignRuntimeDefinition.mjs
```

No SQL migration is required. CE4.3 reuses:

```text
campaign_attempts                 -> authoritative attempt/outcome row
campaign_actions                  -> idempotent untrusted request audit
campaign_events                   -> trusted wheel_resolved/reward events
campaign_mechanic_states          -> latest persisted mechanic result
campaign_reward_budgets           -> budget serialization
campaign_reward_grants            -> qualification/grant reconciliation
user_economy_events               -> sole Goin ledger
```

#### Public/private definition boundary

V1 wheel configuration uses:

```text
config.public.segments
  -> ordered public segment keys + localized labels

config.private.weights
  -> positive integer server-only weights
```

Publish validation rejects malformed segment/weight mappings, unknown reward outcomes, public `weights`, segment-level `weight`, and unsupported public/private fields. Generic public Campaign projection still serializes only `config.public`; private weights never enter the browser projection.

#### Server-authoritative spin flow

CE4.3A reuses the existing CE2.2 routes:

```text
POST /api/campaigns/:slug/mechanics/:mechanicId/attempts
POST /api/campaigns/:slug/actions
```

The accepted wheel action envelope is:

```text
action   = spin_requested
payload  = {}
evidence = { attemptId }
```

The browser cannot submit an outcome. Any extra outcome-like payload fails schema validation.

Server flow:

```text
reserve server attempt
-> serialize participation
-> lock caller-owned attempt
-> crypto.randomInt weighted selection using private weights
-> persist campaign_attempts.outcome before response
-> persist latest mechanic state
-> create trusted wheel_resolved event
-> settle matching mechanic_outcome rewards
-> refresh optional Campaign completion state
-> return the already-persisted result
```

A resolved attempt cannot be spun again with a new action identity. A retry with the same accepted action idempotency key returns the persisted result without replaying effects.

#### Mechanic-outcome reward settlement

Wheel rewards use attempt-specific qualification identity:

```text
mechanic_outcome:<mechanicId>:<attemptId>
```

This allows repeated daily outcome rewards when `perUserLimit` is omitted while preserving same-attempt idempotency. V1 `perUserLimit = 1` remains enforceable across qualifications.

Settlement stays inside the same DB transaction and reuses the accepted Economy primitive. Budget rows are locked before commitment, budget exhaustion records a failed Campaign grant rather than issuing Goin, and expiring wheel rewards use the existing `expiresAfterSeconds` contract.

A daily wheel normally keeps Campaign participation `in_progress`; a mechanic-outcome reward alone does not terminally mark the Campaign `rewarded`. This preserves future daily eligibility unless the Campaign definition itself has a terminal completion rule.

#### CE4.3A focused verification gate

Changed files are backend/test only, so the smallest image rebuild is:

```powershell
pnpm api
```

Then run the focused CE4.3 + shared Campaign regression set:

```powershell
docker compose exec api node --test src/campaignChanceWheel.test.mjs src/campaignChanceWheelRuntime.test.mjs src/campaignCustomGame.test.mjs src/campaignActionsAttempts.test.mjs src/campaignAttemptTerminal.test.mjs src/campaignRuntime.test.mjs
```

Required evidence includes:

```text
public/private wheel definition validation
private weights absent from public projection
server weighted outcome persistence
browser outcome forgery rejected
same-action retry idempotency
new action cannot re-resolve a resolved attempt
mechanic_outcome qualification key
single Economy issuance per qualification
expiring reward issuance
budget exhaustion without overspend
calendar-day timezone attempt limit
Custom Game / CE2.2 / terminal / CE2.1 regressions remain green
```

Parallel daily-spin race verification remains a CE4.3A acceptance gate. It must be exercised after the focused suite against a controlled local runtime fixture; do not infer it merely from sequential tests.

Do not mark CE4.3A accepted until this gate and the parallel race proof are clean.

### CE4.3B — Renderer / client

Status:

```text
NOT STARTED
```

Target client contract:

```text
render public segment labels/order only
reserve attempt through the existing Campaign mechanics client
submit spin_requested without an outcome
wait for persisted server result
animate only to that returned result
refresh authoritative caller state
recover the last trusted wheel outcome after refresh
show server-derived next eligibility / attempts
EN/FA + RTL
Light/Dark
```

Animation is presentation only. The browser may never select the winning segment locally, even temporarily as an authoritative value.

---

## CE4 acceptance boundary

CE4 overall remains incomplete until all slices are founder-verified and accepted:

```text
CE4.1 public Campaign page / participation entry -> ACCEPTED
CE4.2 Custom Game                              -> ACCEPTED
CE4.3A chance-wheel backend authority          -> IMPLEMENTED / VERIFICATION PENDING
CE4.3B chance-wheel renderer/client            -> NOT STARTED
```

Then execution moves to:

```text
CE4.5 — Shared Telegram Publishing Foundation
```
