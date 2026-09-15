# Campaign Engine — CE5 Manage Marketing

Status: **IN PROGRESS / MANAGE MARKETING + DRAFT PREVIEW FOUNDER-LOCAL ACCEPTED 2026-09-15 / TG4 IMPLEMENTED — VERIFICATION PENDING**

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
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
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

CE5 reuses the existing Manage shell, backend authorization, Campaign runtime contracts and shared Telegram subsystem. It must not create parallel Campaign, authorization, wallet, analytics or Telegram authorities.

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

## 4. TG4 Campaign Telegram adapter — implemented / verification pending

TG4 is implemented through the accepted shared Telegram architecture:

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

TG4 implementation commits:

```text
acc6e5b6  feat: add Campaign Telegram adapter
d8528037  feat: route Telegram Campaign start params
c879a800  feat: capture Telegram Campaign attribution
d73085ee  feat: connect Campaigns to Telegram composer
05c7e64f  docs: record TG4 Campaign Telegram implementation
```

Canonical TG4 verification details live in:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
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

CE5 must not use Campaign editing or Telegram distribution as a side door to activate production indexing.

---

## 6. CE5 completion gate

Current sequence:

```text
Manage Marketing operator surface  -> FOUNDER-LOCAL ACCEPTED 2026-09-15
Draft Preview                      -> FOUNDER-LOCAL ACCEPTED 2026-09-15
TG4 Campaign Telegram adapter      -> IMPLEMENTED / VERIFICATION PENDING
CE5 aggregate verification         -> AFTER TG4 ACCEPTANCE
CE6 Measurement & Reconciliation   -> AFTER CE5 ACCEPTANCE
```

CE5 may be marked DONE / ACCEPTED only after TG4 founder-local verification and the CE5 aggregate checkpoint.

CE6 remains separate. The existing runtime summary cards on `/manage/marketing` do not by themselves satisfy CE6 participant/reward inspection, budget reconciliation and Economy trace requirements.

---

## 7. Verification / resume rule

Before the next write:

```text
1. inspect latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read CAMPAIGN_ENGINE_STATUS.md and this CE5 checkpoint
4. verify TG4 through the shared Telegram publisher
5. preserve production NUXT_PUBLIC_NOINDEX=true
6. do not reopen accepted CE1-CE4.5 work without a concrete regression
7. after TG4 acceptance, run CE5 aggregate verification before CE6
```

Current TG4 implementation is frontend-only, so local runtime verification requires only:

```powershell
pnpm frontend
```
