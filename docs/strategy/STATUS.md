# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Exact Growth branch baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

## Current state

```text
Docker/backend Milestones 1–20 -> inherited COMPLETE baseline
Product Strategy V1            -> documented / approved direction
Founder Discovery Q&A V1       -> documented
Marketplace Product Model       -> documented
Content Graph & Lineage         -> documented
Execution Layer                 -> documented
Pricing/Internal Economy V1     -> documented
Execution Roadmap V1            -> documented
Milestone 21 Growth Foundation  -> IN PROGRESS
Phase 21A Analytics             -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21B Referral Activation   -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21C Preferences/Discovery -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21D Public Discovery/SEO  -> DONE / LOCALLY VERIFIED / USER ACCEPTED
Phase 21E Internal Economy      -> LEDGER CORE VERIFIED / GOIN ISSUANCE V1 IMPLEMENTED / AWAITING LOCAL VERIFICATION
```

## 21A closure

Behavioral Analytics foundation is complete through:

```text
backend/sql/020_product_analytics_events.sql
backend/src/productAnalytics.mjs
app/composables/useProductAnalytics.ts
POST /api/analytics/events
```

Canonical closure:

```text
docs/strategy/MILESTONE_21A_VERIFICATION.md
```

## 21B closure

Referral Growth Activation is complete.

Verified loop:

```text
shareable /login?ref=<username>
registration prefill
referral_link_open analytics
canonical referrals row
+500 referred-user reward
+1000 referrer reward
invited-user count refresh
pnpm generate PASS
```

Canonical closure:

```text
docs/strategy/MILESTONE_21B_VERIFICATION.md
```

## 21C closure

Preferences/Personalized Discovery is complete.

Verified foundation:

```text
021_user_preferences.sql
six current visual interest clusters
multi-tag interest bundles
public multi-tag Prompt Archive list filtering
personalized Home hero media
reusable global preferences modal
six immersive personalized Home discovery sections
Dark/Light + EN/FA polish
pnpm generate PASS
```

Canonical closure:

```text
docs/strategy/MILESTONE_21C_VERIFICATION.md
```

## 21D closure — Public Discovery / SEO

21D is fully closed.

Final public/protected boundary:

```text
/prompts list/catalog -> public
GET /api/archive -> public
search/sort/multi-tag/pagination -> public

/prompts?id=<id> full Prompt detail -> authenticated + email gate
GET /api/archive/:id -> authenticated + email gate
```

Public discovery routes:

```text
/discover/portrait-photography
/discover/3d-sculpture
/discover/illustration-animation
/discover/posters-editorial
/discover/product-fashion
/discover/cinematic-game-art
```

Verified public discovery API:

```text
GET /api/discover?tag=<slug>&tag=<slug>&limit=<1..24>
published items only
OR/union tag semantics
presentation metadata only
no prompt body
no variants
```

Verified release/SEO behavior:

```text
pnpm generate PASS
24 Nuxt routes generated including all six /discover/* routes
NUXT_PUBLIC_SITE_URL absent -> production sitemap intentionally skipped
NUXT_PUBLIC_SITE_URL=https://example.test -> sitemap generated for 7 public URLs
robots gets absolute Sitemap line
```

Nuxt's `ssr:false` output proved route bodies were SPA shells, so ADR-001's evidence gate was triggered.

Accepted correction:

```text
keep ssr:false
keep static deployment
post-process generated /discover/* HTML only
use sanitized /api/discover data
inject route-specific head + semantic body + JSON-LD
```

Final generated HTML verification:

```text
Snapshot         True
JsonLd           True
Canonical        True
Title            True
HasArticles      True
ProtectedFields  False
```

Confirmed generated title:

```html
<title>Posters &amp; Editorial · Prompt Draft</title>
```

Canonical closure:

```text
docs/strategy/MILESTONE_21D_VERIFICATION.md
```

Implementation source:

```text
docs/strategy/MILESTONE_21D_IMPLEMENTATION.md
```

Rendering ADR:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

## Current phase — 21E Internal Economy Simulation

Canonical design:

```text
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
```

Implementation handoff:

```text
docs/strategy/MILESTONE_21E_IMPLEMENTATION.md
```

Ledger verification:

```text
docs/strategy/MILESTONE_21E1_VERIFICATION.md
```

Goin issuance V1:

```text
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
```

### Founder-frozen semantics

Internal spendable unit name:

```text
goin
```

Initial simulation reference value:

```text
1 goin = 250 toman
```

This remains a simulation/reference value, not a fiat buy/cash-out/redemption promise.

### XP / Goin split

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

user_economy_events
  -> spendable Goin issuance/debit/refund/correction
```

Spending Goin must not reduce lifetime XP/reputation.

### 21E1 ledger core — locally verified / accepted

Migration:

```text
022_user_economy_foundation.sql
```

Creates:

```text
user_economy_events
economy_settings
```

Verified locally:

```text
append-only ledger
SUM(unit_delta) authoritative balance
idempotent retry
negative balance rejected
failed overspend creates no row
parallel -200/-200 against 300 balance -> one success / one rejection
read model consistent with ledger
```

Backend:

```text
backend/src/economy.mjs
backend/src/adminEconomyRoute.mjs
```

User APIs:

```text
GET /api/economy
GET /api/economy/events?limit=<1..100>&cursor=<cursor>
```

### Goin Issuance V1 — implemented / awaiting local verification

Founder-approved schedule:

```text
account_created       -> 10 goin
profile_email_added   -> 10 goin
referral_joined       -> 10 goin
referral_reward       -> 20 goin
draft_created         -> 0 goin
```

Migration:

```text
023_goin_issuance_policy.sql
```

The migration:

```text
seeds mutable future issuance settings
seeds goin_issuance_rule_version = 1
backfills existing eligible score events with frozen V1 amounts
uses deterministic per-score-event economy idempotency
installs AFTER INSERT user_score_events -> Goin issuance trigger
keeps draft_created XP-only in V1
```

Historical backfill deliberately uses frozen V1 literals. Re-running schema after a future settings change cannot retroactively reprice old rewards.

Future issuance reads current server-side settings and records the current rule version in economy event metadata.

### Super-Admin economy settings contract

Protected by:

```text
system.settings.manage
```

Routes:

```text
GET /api/admin/economy/settings
PUT /api/admin/economy/settings
```

Manageable backend controls now include:

```text
goin reference value
account-created issuance
profile-email issuance
referred-user issuance
referrer issuance
Draft-created issuance
```

Changing any issuance amount atomically increments the issuance rule version and creates:

```text
economy.goin_issuance_policy_updated
```

No `/manage` UI is added yet. A later Super-Admin economy-management surface must reuse this backend contract.

### Still unresolved before first sink activation

```text
Prompt Archive first-unlock price in goin
whether first sinks use one price or a small server-side tier set
```

The 250-toman reference value, issuance supply schedule and future unlock price are independent controls.

### Planned first sink — 21E2

```text
Prompt Archive first full Prompt unlock / meaningful copy access
```

Required semantics:

```text
view/catalog -> free
first unlock -> may cost goin
repeat access -> must not charge again
successful debit + durable access -> one transaction
insufficient balance -> no debit and no unlock
```

Do not start 21E2 until migration 023/backfill/future issuance and ownership APIs are locally verified.

## Migration state

Current schema migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
```

Next future schema migration:

```text
024_*.sql
```

## Hard rules

```text
DO NOT use admin_audit_log as behavioral analytics.
DO NOT use user_score_events as a generic analytics warehouse.
DO NOT create a second XP/referral/auth/admin/profile system.
DO NOT make economy spending reduce lifetime XP/reputation.
DO NOT add a mutable users.balance as economy source of truth.
DO NOT trust frontend balance checks.
DO NOT trust analytics events as economic authority.
DO NOT convert XP 1:1 into Goin.
DO NOT issue Goin for draft_created in V1.
DO NOT retroactively reprice historical Goin after a settings change.
DO NOT charge on every Copy click.
DO NOT create paid access without atomic debit + durable unlock state.
DO NOT expose another user's economy history.
DO NOT treat 250 toman as a buy/cash-out/redemption guarantee.
DO NOT put prompt text/sellable knowledge into analytics metadata.
DO NOT fabricate ownership for legacy/managed Archive items.
DO NOT introduce multi-ownership in Milestone 21.
DO NOT return prompt bodies from /api/home/* or /api/discover.
DO NOT make /api/archive/:id public merely for SEO.
DO NOT use the full Prompt snapshot as the canonical public SEO projection.
DO NOT invent hreflang URLs while i18n remains no_prefix.
DO NOT publish localhost canonical/sitemap URLs as production truth.
DO NOT migrate the full application to SSR without a new evidence gate.
DO NOT introduce fiat purchase/cash-out/payout in 21E.
DO NOT start the full Marketplace inside Milestone 21.
```

## Primary sources

```text
docs/strategy/PRODUCT_STRATEGY_V1.md
docs/strategy/PRICING_AND_INTERNAL_ECONOMY_V1.md
docs/strategy/EXECUTION_ROADMAP_V1.md
docs/strategy/MILESTONE_21_GROWTH_FOUNDATION.md
docs/strategy/MILESTONE_21A_VERIFICATION.md
docs/strategy/MILESTONE_21B_VERIFICATION.md
docs/strategy/MILESTONE_21C_VERIFICATION.md
docs/strategy/MILESTONE_21D_PUBLIC_DISCOVERY_SEO.md
docs/strategy/MILESTONE_21D_IMPLEMENTATION.md
docs/strategy/MILESTONE_21D_VERIFICATION.md
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
docs/strategy/MILESTONE_21E_IMPLEMENTATION.md
docs/strategy/MILESTONE_21E1_VERIFICATION.md
docs/strategy/MILESTONE_21E_GOIN_ISSUANCE_V1.md
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
