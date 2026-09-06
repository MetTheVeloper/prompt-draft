# Milestone 21 — Growth Foundation

Status: **DONE / LOCALLY VERIFIED / USER ACCEPTED**

Date closed: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Inherited baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

Canonical closure:

```text
docs/strategy/MILESTONE_21_CLOSURE.md
```

## Purpose

Milestone 21 was the first commercialization/growth milestone after the completed Docker/backend Milestones 1–20.

Its goal was to turn the existing technically mature Prompt Draft product into a measurable growth system without prematurely starting the full Marketplace or rewriting existing foundations.

The milestone is now fully complete.

## Completed phases

```text
21A Behavioral Analytics Foundation        DONE
21B Referral Growth Activation             DONE
21C Preferences & Personalized Discovery   DONE
21D Public Discovery & SEO Foundation      DONE
21E1 Economy Foundation                    DONE
21E2 Prompt Archive Unlock                 DONE
21E3 Economy UX & Super-Admin Manage       DONE
21F Growth Metrics                         DONE
Final UI polish                            DONE
```

Every phase reached `DONE` only after local verification and explicit founder acceptance.

## Major delivered capabilities

### Behavioral analytics

A dedicated behavioral analytics primitive was added instead of misusing admin audit or XP history.

Current persisted Growth event coverage:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

### Referral activation

The existing username-based persisted referral relationship was reused and extended with:

```text
/login?ref=<normalizedUsername>
registration prefill/preservation
Profile Menu referral-link copy UX
referral landing analytics
```

No second referral-code identity system was created.

### Preferences and personalized discovery

Authenticated discovery interests are persisted and used to shape the homepage. Six public discovery category routes were established and connected to Archive filtering.

### Public discovery / SEO

Accepted architecture remains:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

Six controlled discovery routes receive targeted post-generate static SEO enrichment with sanitized public data, metadata and JSON-LD.

Full Prompt detail remains behind the accepted authenticated/email boundary.

### Internal economy — Goin

Spendable internal unit:

```text
goin
```

Current simulation reference metadata:

```text
1 goin = 250 toman
```

XP and Goin remain separate systems with different semantics:

```text
user_score_events
  -> lifetime achievement / reward provenance

user_economy_events
  -> spendable Goin ledger
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
repeat Copy/access after unlock      -> free
```

The ledger and unlock flow were verified for idempotency, concurrency safety, no-overspend behavior and atomic durable access.

### Economy UX and Super-Admin management

Private user UX includes:

```text
Goin beside username
XP separately displayed
reusable Goin education modal
live policy values sourced from authoritative Economy settings
```

Super-Admin management lives at:

```text
/manage/economy
```

and controls the reference value, issuance amounts and Prompt Archive unlock cost for future events.

### Growth metrics

Existing Manage workspace was extended at:

```text
/manage/growth
```

with 7-day and 30-day summaries covering measured audience, Prompt Archive behavior, referrals, Goin circulation, daily signals and popular tags.

The final backend verification compared API output against independent SQL for both windows and passed all authorization/validation/data checks.

### Final UI polish

The final presentation pass introduced and standardized:

```text
shared Goin SVG + GoinAmount component
reusable central Goin information modal
chart-first Growth visualizations with table toggles
useScreen responsive Growth density
shared Goin rendering in Manage cards
theme-normal Prompt unlock feedback with state icons
surface80 Prompt Archive content layer
normal/invert neutral card tags
theme-aware card overlays/fallbacks/borders on /prompts and /user
Light/Dark + EN/FA/RTL acceptance
```

Detailed polish record:

```text
docs/strategy/MILESTONE_21_UI_POLISH.md
```

## Verification summary

Canonical phase verification docs:

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

Final release-generation gate:

```powershell
pnpm generate
```

Final accepted result:

```text
PASS
26 routes prerendered
.output/public generated
offline manifest generated: 258 files / 63.2 MB
6 discovery routes enriched with sanitized SEO snapshots
```

`NUXT_PUBLIC_SITE_URL` was empty during that final local run, so sitemap generation was intentionally skipped while the discovery-route enrichment still completed.

## Migration state

Milestone 21 migrations:

```text
020_product_analytics_events.sql
021_user_preferences.sql
022_user_economy_foundation.sql
023_goin_issuance_policy.sql
024_prompt_archive_unlocks.sql
```

Next future migration:

```text
025_*.sql
```

## Boundaries preserved

Milestone 21 did not implement:

```text
full commercial Product/Order/License schema
fiat Goin purchase
cash-out / Creator payout
subscriptions
ratings/reviews marketplace
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

Per `docs/strategy/EXECUTION_ROADMAP_V1.md`:

```text
Phase 2 — Domain Expansion
```

The first selected domain is:

```text
Content Creation
```

The next milestone must begin with capability/domain research and semantic modeling before UI or code:

```text
research domain
  -> identify semantic components
  -> define independent modules
  -> define wiring / compile semantics
  -> build domain generator
  -> test real user value
```

Do not start Programming until Content Creation proves the cross-domain architecture.
