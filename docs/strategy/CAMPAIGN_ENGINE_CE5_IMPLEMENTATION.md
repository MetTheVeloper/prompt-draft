# Campaign Engine — CE5 Manage Marketing

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
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

---

## 1. CE5 scope

The accepted V1 plan defines CE5 as the operator layer for Campaign management:

```text
/manage/marketing list/editor
preview / validate / publish
lifecycle controls
TG4 Campaign -> shared Telegram publishing adapter
```

CE5 reuses the existing Manage shell, backend authorization, Campaign runtime contracts and shared Telegram subsystem. It does not create parallel Campaign, authorization, wallet, analytics or Telegram authorities.

CE5 is now complete and accepted.

---

## 2. Manage Marketing operator surface — accepted 2026-09-15

The current branch contains and the founder locally verified the Campaign admin/operator foundation, including:

```text
Campaign admin API foundation
Campaign admin client/types
marketing.campaigns.view / manage / publish authorization integration
Manage Marketing section registration
/manage/marketing Campaign list/editor
structured Campaign Definition form as the primary editor
raw JSON escape hatch for unsupported/advanced fields
draft save with optimistic revision handling
publish validation
immutable version publish action
pause / resume / end / archive lifecycle actions
runtime summary cards
EN/FA management copy
```

Accepted UX behavior includes:

```text
Objective dropdown explanations
Gregorian EN/FA schedule fields
IANA timezone selection
side-by-side localized EN/FA content above mini layouts
stacked localized cards on mobile/tablet
forced EN LTR / FA RTL
automatic /campaign/:slug canonical derivation
no Campaign canonical while indexing = noindex
Validate result modal
responsive mobile/tablet form layout
responsive two-column mini runtime summary
compact top-of-form action toolbar
mini FAB actions
Reload + lifecycle operations inside the shared three-dot menu
no duplicated bottom validation card
no duplicated bottom Campaign operations card
```

End and Archive confirmations remain preserved.

The production-wide crawl gate remains independent:

```text
NUXT_PUBLIC_NOINDEX=true -> KEEP until separate founder-approved SEO launch
```

---

## 3. Draft Preview — founder-local accepted 2026-09-15

Draft Preview is implemented and founder-local verified.

Canonical preview path:

```text
current local Campaign form state
  -> safe draft projection
  -> existing campaign-default-v1 renderer
  -> Manage modal
```

Accepted behavior:

```text
unsaved form edits appear immediately in Preview
EN/FA locale switching works
new Campaign can be previewed before Create draft
published/active Campaign draft edits can be previewed before Save
interactive mechanics are intentionally disabled
unsupported renderer produces an explicit unavailable state
mobile/tablet/desktop modal remains usable
```

Preview remains sandboxed:

```text
no real participation
no real attempts
no real completion/reward mutation
no real Goin issuance
no reward budget consumption
```

The Preview renderer does not call production action/reward endpoints with a hidden preview flag.

Relevant Preview implementation line:

```text
7b0d1c2d  feat: add safe Campaign draft preview
8ef2d3da  feat: wire Campaign draft preview
2d1c31f3  feat: improve Campaign form mini layout
47b5df40  feat: improve Marketing editor mini layout
ff93ed4a  fix: preserve Marketing desktop summary layout
b9e37aeb  feat: simplify Campaign editor actions
```

---

## 4. TG4 Campaign Telegram adapter — founder-local accepted 2026-09-15

TG4 is accepted through the shared Telegram architecture:

```text
/manage/marketing
  -> CampaignTelegramAdapter
  -> TelegramPostComposer
  -> TG1 shared backend TelegramPublisher
  -> telegram_publications
```

TG4 uses the immutable current published Campaign version as its publication source. Mutable draft state is never used for Telegram prefill.

Shared source identity:

```text
source.type    = campaign
source.id      = Campaign UUID
source.version = immutable published version number
```

Campaign Mini App CTA:

```text
campaign_<slug>
```

Telegram entry routes to the public Campaign with bounded attribution:

```text
source = telegram
medium = campaign_channel
campaign = <slug>
metadata.placement = telegram_channel
```

Telegram remains distribution/entry only; Prompt Draft remains authoritative for identity, eligibility, participation, attempts, completion, outcome and rewards.

TG4 also includes shared managed-image hardening. `ArchiveImageManager` wraps the reusable `ManagedImageUploader`, and Telegram uses the same browser image preparation flow. Prepared Telegram images upload only on explicit Publish through server-owned `scope = telegram` Object Storage paths.

Founder-local end-to-end verification used a dedicated Telegram test channel and confirmed real image publication plus a working `Join Campaign` CTA that opened the configured Mini App on the intended Campaign. Focused managed-media backend contract tests passed 3/3.

Canonical TG4 records:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

---

## 5. Canonical public route and SEO behavior

Campaign public routing remains:

```text
/campaign/:slug
/fa/campaign/:slug
```

Effective SEO behavior:

```text
Campaign indexing = index
  -> canonical path derives from /campaign/:slug
  -> locale-aware public SEO creates the localized canonical URL

Campaign indexing = noindex
  -> Campaign canonical path is empty
  -> canonical/alternate links for the Campaign are not emitted
  -> robots remains noindex
```

CE5 does not use Campaign editing or Telegram distribution as a side door to activate production indexing.

---

## 6. CE5 aggregate acceptance — accepted 2026-09-15

All required CE5 sub-slices are accepted:

```text
Manage Marketing operator surface  -> FOUNDER-LOCAL ACCEPTED 2026-09-15
Draft Preview                      -> FOUNDER-LOCAL ACCEPTED 2026-09-15
TG4 Campaign Telegram adapter      -> FOUNDER-LOCAL ACCEPTED 2026-09-15
CE5 aggregate verification         -> FOUNDER-LOCAL ACCEPTED 2026-09-15
```

Aggregate verification confirms that the accepted slices compose without changing frozen authority boundaries:

```text
Published Campaign Versions remain immutable.
Participation remains version-locked.
Draft Preview cannot mutate Campaign runtime or Economy state.
Browser remains non-authoritative for eligibility, attempts, outcomes and rewards.
Campaign reward issuance remains reconciled through user_economy_events.
Telegram remains shared Preview + CTA distribution, not Campaign business logic.
TG4 reuses the shared Telegram publisher and publication ledger.
/manage/marketing reuses existing Manage authorization.
NUXT_PUBLIC_NOINDEX=true remains unchanged.
No production DNS / Tunnel / Worker / indexability cutover occurred as a CE5 side effect.
```

Canonical aggregate acceptance record:

```text
docs/strategy/CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
```

Result:

```text
CE5 Manage Marketing -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
```

---

## 7. Handoff to CE6

CE6 is now the next Campaign Engine slice:

```text
CE6 — Measurement & Reconciliation
```

V1 scope:

```text
funnel summary
participant / reward inspection
budget remaining
Economy transaction trace
placement / mechanic / reward reconciliation
```

The existing runtime summary cards on `/manage/marketing` are useful CE5 operator context but do not by themselves satisfy CE6 participant/reward inspection, budget reconciliation or Economy trace requirements.

CE6 must reuse the existing authorities:

```text
Campaign runtime + trusted events
product_analytics_events
campaign_reward_budgets
campaign_reward_grants
user_economy_events
admin authorization + admin_audit_log
```

Do not create a parallel analytics pipeline, wallet, reward ledger, authorization layer or Campaign authority.

Before CE6 implementation:

```text
1. inspect latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read CAMPAIGN_ENGINE_V1.md
4. read CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
5. read CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
6. read CAMPAIGN_ENGINE_STATUS.md
7. read CAMPAIGN_ENGINE_CE5_ACCEPTANCE.md
8. preserve CE1-CE5 acceptance unless a concrete regression is found
9. keep NUXT_PUBLIC_NOINDEX=true and SEO launch deferred
10. choose the smallest rebuild scope based on actual CE6 changes
```

This CE5 closure is documentation-only, so no Docker rebuild is required.
