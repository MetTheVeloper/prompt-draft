# Milestone 21 — Growth Foundation Closure

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Inherited baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

## Outcome

Milestone 21 is fully closed. The Growth Foundation now provides a measurable acquisition/engagement layer, referral activation, preference-driven discovery, public SEO/discovery foundations, a simulated internal economy named Goin, Prompt Archive paid-unlock semantics, Super-Admin economy controls, and a Growth metrics surface in the existing Manage workspace.

The final UI-polish pass was also locally verified and explicitly accepted by the founder.

## Completed phases

```text
21A Behavioral Analytics Foundation        DONE / LOCALLY VERIFIED / USER ACCEPTED
21B Referral Growth Activation             DONE / LOCALLY VERIFIED / USER ACCEPTED
21C Preferences & Personalized Discovery   DONE / LOCALLY VERIFIED / USER ACCEPTED
21D Public Discovery & SEO Foundation      DONE / LOCALLY VERIFIED / USER ACCEPTED
21E1 Economy Foundation                    DONE / LOCALLY VERIFIED / USER ACCEPTED
21E2 Prompt Archive Unlock                 DONE / LOCALLY VERIFIED / USER ACCEPTED
21E3 Economy UX & Super-Admin Manage       DONE / LOCALLY VERIFIED / USER ACCEPTED
21F Growth Metrics                         DONE / LOCALLY VERIFIED / USER ACCEPTED
Final UI polish                            DONE / LOCALLY VERIFIED / USER ACCEPTED
```

## Canonical verification sources

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E2_PROMPT_UNLOCK.md
docs/strategy/MILESTONE_21E3_ECONOMY_UX_MANAGE.md
docs/strategy/MILESTONE_21F_VERIFICATION.md
docs/strategy/MILESTONE_21_UI_POLISH.md
```

## Final accepted product state

### Analytics and Growth measurement

Persisted behavioral coverage currently includes:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

The system deliberately labels this as measured/instrumented Growth-surface activity rather than whole-product DAU/MAU.

`/manage/growth` provides 7-day and 30-day decision views for:

```text
measured audience
Prompt Archive views/copies/unlocks
copy-session rate
referral opens/signups/share/directional ratio
Goin issued/spent/outstanding
active spenders
UTC daily signals
popular Prompt Archive tags
```

Final SQL-vs-API verification passed for both supported windows, including authorization and invalid-window behavior.

### Referral activation

The existing persisted username-based referral model was reused rather than replaced.

Accepted public flow:

```text
/login?ref=<normalizedUsername>
```

The referral is preserved through registration, backend authority remains canonical, reward persistence is atomic/idempotent, and the Profile Menu exposes a referral-link copy action.

### Preferences and personalized discovery

Authenticated users can persist up to six discovery interests. The homepage can use those interests for discovery ordering, while anonymous users retain broad Archive discovery.

Six public discovery categories are established and reused by `/discover/*`, home discovery, and Archive deep links.

### Public discovery / SEO

Accepted architecture remains:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

No speculative full-SSR migration was introduced.

Six controlled `/discover/*` routes receive post-generate static SEO enrichment with sanitized public item projections, route-specific metadata and JSON-LD. Full Prompt text remains behind the accepted authenticated/email detail boundary.

### Internal economy — Goin

Internal spendable unit:

```text
goin
```

Simulation reference value:

```text
1 goin = 250 toman
```

This is reference metadata only, not a fiat purchase, cash-out, redemption, crypto, security, or externally tradable-token promise.

XP and Goin are intentionally separate:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

Current issuance V1:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Current Prompt Archive sink:

```text
first meaningful Prompt Copy unlock -> 5 goin
repeat access/copy after unlock      -> free
```

Verified invariants include:

```text
append-only authoritative ledger
SUM(unit_delta) authoritative balance
idempotent retry
no negative balance
parallel spends cannot overspend
historical issuance backfill is rerunnable without duplicate issue
atomic debit + durable unlock
same-Prompt concurrent unlock charges exactly once
insufficient balance creates neither debit nor unlock
historical unlock price/rule version is preserved
XP does not fall when Goin is spent
```

### Economy UX and management

Private Profile Menu:

```text
Goin beside username through shared GoinAmount component
XP shown separately
reusable What is Goin? modal
current earn/spend policy read from authoritative Economy settings
```

Super-Admin management:

```text
/manage/economy
permission: system.settings.manage
```

Manageable V1 settings:

```text
Goin reference value
account-created issuance
profile-email issuance
referred-user issuance
referrer issuance
Draft-created issuance
Prompt Archive first-unlock cost
```

Policy edits apply to future issuance/unlocks and do not retroactively reprice historical ledger/unlock rows.

## Final UI-polish acceptance

The final polish pass was accepted across the requested surfaces:

```text
/manage/growth
/manage/economy
private Profile Menu
Goin education modal
Prompt Archive locked/unlocked Copy UX
/prompts list cards
/user Draft cards
```

Accepted presentation changes include:

```text
founder-provided Goin SVG and reusable GoinAmount component
Profile Menu Goin-first hierarchy with XP moved to its own row
central reusable Goin information modal
chart-first Daily Signals and Popular Prompt Tags with table toggles
useScreen-based responsive Growth layout
dense desktop/wide 2 x 4-card metric grouping
shared Goin rendering in Growth/Economy cards
normal-colored Prompt unlock/copy feedback with state icons
/prompts surface80 content layer
normal/invert Prompt tags
theme-aware card overlays, fallbacks and borders on /prompts and /user
Light/Dark + EN/FA/RTL smoke acceptance
```

## Final build verification

Founder-local final release build:

```powershell
pnpm generate
```

Result:

```text
PASS
Nuxt client build completed
26 routes prerendered
.output/public generated
offline manifest generated
258 files / 63.2 MB
6 discovery routes enriched with sanitized SEO snapshots
```

`NUXT_PUBLIC_SITE_URL` was empty during this final local run, so sitemap generation was intentionally skipped by the existing SEO script; discovery-route enrichment still completed.

Known build warnings remain non-blocking and pre-existing/accepted for this milestone, including duplicated `compilePromptOutput` auto-import warning, sourcemap/chunk-size warnings, and the expected `ssr:false` static-hosting message.

## Migration state

Milestone 21 migrations end at:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

Next future schema migration:

```text
025_*.sql
```

## Preserved boundaries

Milestone 21 intentionally did not implement:

```text
full Marketplace Product/Order/License system
fiat Goin purchase
cash-out / Creator payout
subscriptions
reviews/ratings marketplace
follow graph
multi-Creator ownership
full Content Graph
Content Creation generator
Programming generator
AI assistant/model
dynamic AI Wizard
full SSR migration
```

## Next roadmap phase

Per `EXECUTION_ROADMAP_V1.md`, the next phase is:

```text
Phase 2 — Domain Expansion
```

The first domain to tackle is:

```text
Content Creation
```

The required operating sequence remains:

```text
research domain
  -> identify semantic components
  -> define independent modules
  -> define wiring / compile semantics
  -> build domain generator
  -> test real user value
```

Do not start multiple domains at once. Content Creation should validate that the Semantic Prompt Engine is truly reusable beyond image prompting before Programming begins.
