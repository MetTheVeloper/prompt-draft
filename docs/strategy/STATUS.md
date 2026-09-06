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
Phase 21E Internal Economy      -> CAPABILITY AUDIT COMPLETE / DESIGN BASELINE CREATED / IMPLEMENTATION READY
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

Capability audit and design baseline are complete.

Canonical design:

```text
docs/strategy/MILESTONE_21E_INTERNAL_ECONOMY_DESIGN.md
```

### Key semantic decision

Do **not** make spending reduce current profile XP/reputation.

Current split:

```text
user_score_events
  -> achievement/reward provenance + lifetime XP

future user_economy_events
  -> spendable internal-unit issuance/debit/refund/correction
```

This is not a parallel gamification system. The economy ledger has different invariants that current XP does not provide:

```text
atomic no-overspend
spend/debit semantics
refund/correction semantics
durable access purchase
transaction history
spendable balance
```

Economy issuance should reference existing score/reward provenance when applicable rather than create unrelated reward causes.

### Planned 21E1

Next migration:

```text
022_user_economy_foundation.sql
```

Planned first slice:

```text
user_economy_events
idempotent economy service
SUM(unit_delta) authoritative balance
atomic debit primitive
GET /api/economy
GET /api/economy/events
explicit/versioned issuance policy
```

No mutable `users.balance` column should become source of truth.

### Planned first sink

Best current simulation surface:

```text
Prompt Archive first full Prompt unlock / meaningful copy access
```

Required semantics:

```text
view/catalog -> free
first unlock -> may cost units
repeat access -> must not charge again
successful debit + durable access -> one transaction
insufficient balance -> no debit and no unlock
```

Exact branded unit name and exact first-unlock price remain intentionally unresolved until the controlled experiment policy is frozen.

## Migration state

Current schema migrations extend through:

```text
020_product_analytics_events.sql
021_user_preferences.sql
```

Next schema migration:

```text
022_user_economy_foundation.sql
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
DO NOT charge on every Copy click.
DO NOT create paid access without atomic debit + durable unlock state.
DO NOT expose another user's economy history.
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
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```
