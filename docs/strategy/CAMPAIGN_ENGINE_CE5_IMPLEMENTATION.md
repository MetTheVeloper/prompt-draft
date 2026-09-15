# Campaign Engine — CE5 Manage Marketing

Status: **IN PROGRESS / MANAGE MARKETING OPERATOR SURFACE FOUNDER-LOCAL VERIFIED 2026-09-15 / DRAFT PREVIEW + TG4 REMAIN**

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

CE5 must reuse the existing Manage shell, backend authorization, Campaign runtime contracts and shared Telegram subsystem. It must not create parallel Campaign, authorization, wallet, analytics or Telegram authorities.

---

## 2. Implemented operator foundation

The current branch contains the Campaign admin/backend and frontend operator foundation, including:

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

The structured form preserves the underlying Campaign Definition contract rather than introducing a second UI-only schema.

---

## 3. Founder-local verified UX checkpoint — 2026-09-15

The founder manually verified the current `/manage/marketing` experience after the CE5 UI/UX refinement slice and confirmed all requested changes behave correctly.

Accepted behavior:

```text
Objective dropdown
  -> each objective includes a concise explanation of when to select it

Schedule
  -> Starts at / Ends at use the reusable Gregorian date-time field
  -> both EN and FA use Gregorian dates
  -> timezone is selected from valid IANA timezone values rather than free text
  -> persisted lifecycle timestamps remain absolute ISO timestamps

Localized Campaign content
  -> Title and Description are vertically stacked inside each locale card
  -> English and Persian locale cards are side-by-side above tablet size
  -> locale cards stack on tablet/mobile
  -> English content is forced LTR
  -> Persian content is forced RTL

SEO/indexability
  -> manual Canonical path input is removed
  -> indexable Campaign canonical is derived from /campaign/:slug
  -> no Campaign canonical is emitted while Campaign indexing = noindex
  -> global NUXT_PUBLIC_NOINDEX=true remains authoritative and unchanged

Publish validation
  -> validation state remains visible in the page
  -> explicit Validate also opens a result modal
  -> modal shows publishable/not-publishable state plus validation errors/warnings

Lifecycle operations
  -> Pause / Resume / End / Archive live inside a dedicated Campaign operations card
  -> current lifecycle status is visible with the operations
  -> warning/destructive visual hierarchy is explicit
  -> End and Archive confirmations remain preserved
```

This verification closes the current Manage Marketing UI/UX refinement checkpoint. It does **not** close CE5 as a whole because Draft Preview and TG4 are still outstanding.

---

## 4. Canonical public route and canonical behavior

Campaign public routing remains:

```text
/campaign/:slug
/fa/campaign/:slug
```

For the current CE5 contract, the operator does not author a free-form canonical path.

Effective page behavior:

```text
Campaign indexing = index
  -> canonical path derives from /campaign/:slug
  -> locale-aware public SEO creates the localized canonical URL

Campaign indexing = noindex
  -> Campaign canonical path is empty
  -> canonical/alternate links for the Campaign are not emitted
  -> robots remains noindex
```

The production-wide launch gate remains independent:

```text
NUXT_PUBLIC_NOINDEX=true -> KEEP until separate founder-approved SEO launch
```

CE5 must not use Campaign editing as a side door to activate production indexing.

---

## 5. Implementation checkpoints in the current CE5 line

Relevant implementation history includes:

```text
18b68ddf  feat: add Campaign admin API foundation
6cc17b8f  fix: wire Campaign runtime and admin routes
629c7fdd  fix: harden Campaign admin lifecycle API
fc26155b  feat: add Campaign admin API types
94340b40  feat: add Campaign admin client
fb9d9073  feat: expose Campaign admin permissions
4281d3a6  feat: add Marketing manage section
ee825866  feat: add Campaign operator surface
a41fb79f  feat: add structured Campaign definition form
d64117ec  feat: make Campaign form the primary editor
115c224f  fix: keep Campaign locale edits atomic
2de30888  feat: add reusable Gregorian date-time field
31cf0eba  feat: improve Campaign form scheduling and locale UX
d3784e76  feat: expand Campaign builder UX copy
d6741f38  feat: localize Campaign builder UX
b076c9ff  fix: derive public Campaign canonical from slug
6ca369ba  feat: improve Campaign validation and lifecycle UX
```

The founder-local UX verification described above was completed against the branch state through `6ca369ba`.

---

## 6. NEXT — CE5 Draft Preview

The next implementation slice is the still-open Preview requirement from the Campaign Engine API/runtime contract.

Required direction:

```text
current mutable Campaign draft
  -> same Campaign renderer registry
  -> preview mode
  -> operator-visible preview
```

Preview is explicitly non-authoritative and non-reward-capable:

```text
no real participation
no real attempts
no real completion/reward mutation
no real Goin issuance
no reward budget consumption
```

Prefer rendering directly from the current editor/draft state when possible. If a backend preview projection is later required, it must remain an isolated safe projection and must not route through production action endpoints with a hidden preview flag.

Preview should preserve the current EN/FA renderer behavior and must not weaken the public/private Campaign projection boundary.

---

## 7. AFTER PREVIEW — TG4 Campaign Telegram adapter

After Draft Preview, complete the remaining CE5 Telegram integration:

```text
/manage/marketing
  -> Campaign Telegram adapter
  -> existing TelegramPostComposer
  -> existing TG1 shared publisher
  -> telegram_publications shared ledger
```

TG4 must not create a Campaign-specific Bot API client, modal/publisher, publication ledger or retry system.

Campaign Telegram CTA attribution must align with the already accepted Campaign attribution semantics. Telegram remains distribution/entry only; Prompt Draft remains authoritative for identity, eligibility, participation, attempts, outcome and rewards.

---

## 8. CE5 completion gate

CE5 may be marked DONE / ACCEPTED only after the remaining Preview and TG4 work is implemented and verified.

Expected order:

```text
Manage Marketing operator surface  -> FOUNDER-LOCAL VERIFIED 2026-09-15
Draft Preview                      -> NEXT
TG4 Campaign Telegram adapter      -> AFTER PREVIEW
CE5 aggregate verification         -> THEN
CE6 Measurement & Reconciliation   -> AFTER CE5 ACCEPTANCE
```

CE6 remains a separate slice. The existing runtime summary cards on `/manage/marketing` do not by themselves satisfy CE6 participant/reward inspection, budget reconciliation and Economy trace requirements.

---

## 9. Verification / resume rule

Before the next write:

```text
1. inspect latest feature/growth-foundation HEAD
2. read DEVELOPMENT_WORKFLOW.md and UI_IMPLEMENTATION_GUIDELINES.md
3. read CAMPAIGN_ENGINE_STATUS.md and this CE5 checkpoint
4. implement the smallest Draft Preview slice first
5. preserve production NUXT_PUBLIC_NOINDEX=true
6. do not reopen accepted CE1-CE4.5 work without a concrete regression
7. after Preview, implement TG4 only through the shared Telegram architecture
```

This documentation checkpoint itself requires no rebuild.