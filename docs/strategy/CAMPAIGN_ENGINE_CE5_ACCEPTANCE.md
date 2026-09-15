# Campaign Engine — CE5 Manage Marketing Acceptance

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15**

Date: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Parent track:

```text
Campaign Engine V1
CE5 — Manage Marketing
```

Canonical companions:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

---

## 1. Acceptance scope

CE5 is the Campaign operator layer defined by the V1 plan:

```text
/manage/marketing list/editor
preview / validate / publish
lifecycle controls
Campaign -> shared Telegram publishing adapter
```

Aggregate acceptance confirms that these capabilities now operate together without introducing parallel Campaign, authorization, Economy, analytics or Telegram authorities.

---

## 2. Accepted operator surface

Founder-local verification accepted the `/manage/marketing` operator workflow, including:

```text
Campaign list and editor
structured Campaign Definition form
raw JSON escape hatch
optimistic draft save
publish validation
immutable version publishing
pause / resume / end / archive lifecycle controls
runtime summary
EN / FA editing
Gregorian scheduling + IANA timezone selection
index / noindex behavior
responsive mobile / tablet UX
compact top-of-form action toolbar
shared three-dot action menu
```

The accepted responsive pass preserves the existing desktop/laptop layout while using the project `mini` breakpoint for mobile/tablet behavior.

---

## 3. Accepted Draft Preview

Draft Preview was founder-local verified before CE5 closure.

Accepted behavior includes:

```text
unsaved local edits render immediately
new Campaign drafts can be previewed before creation
EN / FA content follows the active locale
existing public Campaign presentation is reused
interactive mechanics are explicitly disabled in preview
unsupported renderers fail visibly rather than silently
mobile / tablet / desktop preview remains usable
```

Safety boundary remains:

```text
no real participation
no attempts
no completion mutation
no reward issuance
no reward-budget consumption
```

Preview does not call production action/reward endpoints with a hidden preview flag.

---

## 4. Accepted TG4 Campaign Telegram bridge

TG4 was founder-local verified end-to-end against a dedicated Telegram test channel.

Verified path:

```text
/manage/marketing
  -> published immutable Campaign version
  -> CampaignTelegramAdapter
  -> TelegramPostComposer
  -> shared ManagedImageUploader
  -> Arvan Object Storage
  -> TG1 shared TelegramPublisher
  -> real Telegram test-channel post
  -> Join Campaign CTA
  -> configured Telegram Mini App
  -> intended public Campaign
```

Observed evidence:

```text
real Telegram channel delivery succeeded
image media was included
Campaign caption/content rendered
Join Campaign CTA was present
CTA opened the configured Mini App
Mini App resolved the intended Campaign
```

Focused managed-media backend contract verification also passed:

```text
3 tests
3 pass
0 fail
```

The test channel was intentionally separate from the production Telegram channel.

---

## 5. Aggregate invariant check

CE5 acceptance preserves the frozen Campaign Engine boundaries:

```text
Published Campaign Versions remain immutable.
Participation still locks to the exact published version.
Draft Preview cannot mutate runtime or Economy state.
Browser remains non-authoritative for eligibility, outcomes and rewards.
Campaign rewards still reconcile through user_economy_events.
No second Campaign wallet exists.
Telegram remains Preview + CTA distribution only.
TG4 reuses the shared Telegram publisher and publication ledger.
Telegram does not decide Campaign participation, attempts, outcome or rewards.
/manage/marketing reuses existing Manage authorization.
NUXT_PUBLIC_NOINDEX=true remains independent and unchanged.
No production DNS / Tunnel / Worker / indexability cutover was performed as a CE5 side effect.
```

---

## 6. Aggregate result

All CE5 sub-slices required by the V1 execution plan are accepted:

```text
Manage Marketing operator surface -> ACCEPTED
Draft Preview                     -> ACCEPTED
TG4 Campaign Telegram adapter     -> ACCEPTED
CE5 aggregate verification        -> ACCEPTED
```

No new runtime code was introduced during this aggregate closure; the checkpoint consolidates already founder-verified runtime behavior and the successful TG4 end-to-end delivery evidence.

Result:

```text
CE5 Manage Marketing -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
```

---

## 7. Next phase

Next:

```text
CE6 — Measurement & Reconciliation
```

V1 CE6 scope remains:

```text
funnel summary
participant / reward inspection
budget remaining
Economy transaction trace
placement / mechanic / reward reconciliation
```

Existing CE5 runtime summary cards are useful context but do not satisfy CE6 by themselves.

CE6 must continue to reuse existing authorities:

```text
Campaign runtime / trusted events
product_analytics_events
campaign_reward_budgets
campaign_reward_grants
user_economy_events
admin authorization / audit
```

Do not create a second analytics pipeline, reward ledger, wallet or Campaign authority.

---

## 8. Verification workflow note

This acceptance commit is documentation-only.

Per `DEVELOPMENT_WORKFLOW.md`:

```text
no Docker rebuild required
```

Future CE6 implementation must re-read the latest branch state and choose the smallest rebuild scope based on the files actually changed.
