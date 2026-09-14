# Milestone 21.5 — Pre-Scale Execution Handoff

Status: **FOUNDER-APPROVED PRE-SCALE EXECUTION / PRODUCTION RUNTIME ACTIVE / SEO DEFERRED / CAMPAIGN CE4 ACCEPTED / CE4.5 TG3 FINAL ACCEPTANCE NEXT**

Date: 2026-09-14

Branch:

```text
feature/growth-foundation
```

This file is the pre-scale handoff index. Detailed implementation/acceptance evidence lives in the linked strategy records; do not use older sequencing notes as current status when they conflict with the current Campaign/Telegram status docs.

## 1. Runtime checkpoint remains unchanged

Canonical production-runtime checkpoint:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

Current production posture:

```text
production runtime      -> ACTIVE / VERIFIED
production canonical    -> prompt-draft.ir
production API          -> api.prompt-draft.ir
production indexability -> OFF
NUXT_PUBLIC_NOINDEX     -> true
SEO launch              -> DEFERRED
Search Console launch   -> DEFERRED
```

Normal product engineering may continue against the production runtime while SEO/indexing stays disabled.

Do not change DNS, Tunnel, Worker, Search Console submission or indexability as a side effect of pre-scale product work.

## 2. Domain Expansion remains scale-gated

Domain Expansion remains a strategic future capability, not the current implementation track.

Current policy:

```text
DO NOT start Domain Expansion implementation merely because production runtime is active.

Before Domain Expansion implementation:
  -> product reaches the intended scale/readiness stage
  -> founder explicitly selects the scale gate
  -> domain research + semantic modeling are mature
```

Research may continue independently; implementation remains deferred.

## 3. Current pre-scale lane

The selected active lane is Campaign/Telegram commercialization infrastructure on top of the accepted Prompt Draft runtime, Economy and public/protected boundaries.

Current state:

```text
Campaign Engine CE1 Foundation                -> ACCEPTED
Expiring / Promotional Goin V1               -> ACCEPTED
Campaign Engine CE2.1 Runtime Core            -> ACCEPTED
Campaign Engine CE2.2 Actions / Attempts      -> ACCEPTED
Campaign Engine CE3 Promotion Surfaces        -> ACCEPTED
Campaign Engine CE4 Public Experience         -> ACCEPTED 2026-09-13

CE4.5 Shared Telegram Publishing              -> IN PROGRESS
  TG1 Shared Backend Foundation               -> ACCEPTED 2026-09-13
  TG2 Composer + /manage/telegram             -> ACCEPTED 2026-09-13
  TG3 Prompt Archive Adapter                  -> IMPLEMENTED + HARDENED / FINAL TG3 ACCEPTANCE PENDING

Prompt Archive management/image workflow      -> ACCEPTED 2026-09-14

CE5 /manage/marketing + TG4                   -> NEXT AFTER TG3 ACCEPTANCE
CE6 Measurement & Reconciliation              -> NOT STARTED
CE7 Final Verification                        -> NOT STARTED
```

Canonical current status:

```text
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
```

## 4. Mandatory current sources

Project workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Campaign architecture/status:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
docs/strategy/CAMPAIGN_ENGINE_CE4_ACCEPTANCE.md
```

Telegram bridge:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_SCHEDULING.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

Archive management acceptance:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

Production/no-SEO boundary:

```text
docs/strategy/STATUS.md
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

Before any new decision/write, always inspect the then-current `feature/growth-foundation` HEAD first.

## 5. Authorities that must remain singular

```text
backend authorization      -> permission authority
user_economy_events        -> authoritative Goin ledger
product_analytics_events   -> observational analytics
admin_audit_log            -> privileged mutation audit
campaign_versions          -> immutable published Campaign snapshots
telegram_publications      -> Telegram publication ledger
Prompt Draft backend       -> unlock/copy/Goin/business logic authority
```

Do not introduce parallel wallet, analytics, authorization, Campaign, Prompt-unlock or Telegram-publication authorities.

## 6. Campaign Engine accepted direction

Campaign remains a domain object rather than a page type.

Frozen public route:

```text
/campaign/:slug
/fa/campaign/:slug
```

Frozen trust boundary:

```text
browser may express intent
backend decides identity, eligibility, trusted progress, attempts, outcomes and rewards
published Campaign Versions are immutable
participation locks to the exact published version it started under
Campaign rewards reconcile to user_economy_events
```

Chance/random outcomes remain server-authoritative.

Promotional Goin uses the same Economy ledger and accepted expiry/FEFO semantics.

## 7. Shared Telegram direction

Frozen architecture:

```text
Telegram = Preview + CTA
Mini App = Entry point
Prompt Draft = all business logic
```

Shared path:

```text
/manage/archive ----\
/manage/marketing ----> TelegramPostComposer -> shared Telegram Publishing API -> TelegramPublisher
/manage/telegram ----/
```

Prompt Archive and Campaign Engine must not gain separate Telegram clients, publication ledgers, retry state or delivery authority.

Telegram must not decide Campaign eligibility/rewards or Prompt unlock/Goin state.

## 8. Archive management/image workflow — CLOSED

Canonical acceptance:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
Status -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14
```

Frozen operator behavior:

```text
new/draft item                -> Save as draft
published/archived item       -> Update changes
metadata save                 -> preserve publication status
prepared-image upload         -> preserve publication status
persisted image delete/reorder-> preserve publication status
status mutation               -> explicit Publish / Move to draft / Archive / Restore draft only
multi-image preparation       -> all selected images reach terminal state without stale Preparing state
```

Do not reopen this workflow absent a concrete regression.

## 9. Immediate next gate — TG3 final acceptance

TG3 implementation is present and the underlying Archive editor is now accepted.

Immediate work is **not another Archive redesign**. It is a focused founder-local acceptance pass for the Telegram-specific TG3 contract in:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
```

The current checklist covers:

```text
published-only adapter visibility
shared TelegramPostComposer reuse
bilingual FA/EN public Prompt caption
public image ordering
hashtags
Prompt Mini App CTA -> prompt_<publicId>
fixed community direct-HTTPS CTA
Preview Model + Optimized for album CTA text
absence of protected Prompt body
Light/Dark rendering
safe disabled Publish state when Telegram config is missing
adapter removal when item moves back to draft
no mutation of legacy Archive Telegram scalar fields while composing
```

A real Telegram delivery is not required when local credentials/channel config are intentionally absent.

Once this checklist is explicitly accepted:

```text
TG3 -> ACCEPTED
CE4.5 -> COMPLETE
```

## 10. Next implementation after TG3 — CE5

After TG3 acceptance, begin:

```text
CE5 — /manage/marketing
```

CE5 target:

```text
Campaign list/editor
Campaign Definition editing/validation
preview/publish
pause/resume/end/archive
existing marketing permissions
existing Manage UI conventions
EN/FA management copy
TG4 Campaign Telegram adapter reusing the shared TelegramPostComposer + TG1 publisher
Campaign Telegram entry/attribution aligned with accepted CE3 attribution semantics
```

CE5 must not create a temporary Campaign-specific Telegram implementation.

## 11. Verification discipline

Use `DEVELOPMENT_WORKFLOW.md` for every slice:

```text
inspect exact changed files/services
-> run focused tests
-> no rebuild for docs-only
-> pnpm frontend for frontend-only
-> pnpm api for backend-only
-> rebuild both only when both changed
-> pnpm stack only when genuinely required
```

Do not recommend restart/recreate or `git pull` reflexively.

## 12. Hard boundaries

```text
KEEP NUXT_PUBLIC_NOINDEX=true until fresh founder approval for SEO launch.
KEEP prompt-draft.ir and retained grassic.ir noindex in current mode.
DO NOT start Domain Expansion before its scale gate.
DO NOT weaken public/protected Prompt boundaries.
DO NOT make protected Archive detail public.
DO NOT create a second Goin ledger.
DO NOT create a second Campaign authority.
DO NOT create a second Telegram publisher/ledger.
DO NOT move Campaign/Prompt business logic into Telegram.
DO NOT reopen CE1-CE4 or accepted Archive management work without a concrete regression.
```

## 13. Resume instruction

```text
1. inspect latest feature/growth-foundation HEAD
2. read STATUS.md
3. read DEVELOPMENT_WORKFLOW.md + UI_IMPLEMENTATION_GUIDELINES.md
4. read CAMPAIGN_ENGINE_STATUS.md
5. read TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
6. read PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
7. keep CE1-CE4 accepted unless a concrete regression exists
8. keep Archive management/images accepted unless a concrete regression exists
9. finish TG3 Telegram-specific acceptance
10. then start CE5 /manage/marketing + TG4
11. keep SEO launch deferred / noindex true
12. keep Domain Expansion scale-gated
```

This ordering remains authoritative until the founder explicitly changes it.