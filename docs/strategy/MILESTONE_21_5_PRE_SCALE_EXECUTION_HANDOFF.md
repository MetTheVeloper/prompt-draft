# Milestone 21.5 — Pre-Scale Execution Handoff

Status: **FOUNDER-APPROVED EXECUTION HANDOFF / PRODUCTION RUNTIME ACTIVE / SEO DEFERRED / DOMAIN EXPANSION SCALE-GATED**

Date: 2026-09-13

Branch:

```text
feature/growth-foundation
```

Current authoritative runtime checkpoint:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

Campaign Engine source of truth:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_DB_SCHEMA_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_STATUS.md
```

---

## 1. Founder sequencing decision

Milestone 21.5 has reached the intended safe operating checkpoint for continued product development:

```text
production runtime      -> ACTIVE / VERIFIED
production canonical    -> prompt-draft.ir
production API          -> api.prompt-draft.ir
production indexability -> OFF
NUXT_PUBLIC_NOINDEX     -> true
SEO launch              -> DEFERRED
Search Console launch   -> DEFERRED
```

The product is still under active development/testing. SEO/indexing must remain disabled until a future explicit founder approval.

Milestone 21.5 therefore remains technically open for its deferred SEO-launch work, but it no longer blocks normal product engineering.

---

## 2. Domain Expansion is not the immediate next implementation track

Domain Expansion remains a major strategic capability and a future proof that Prompt Draft's Semantic Prompt Engine generalizes beyond the current image-focused domain.

However, the founder has explicitly classified Domain Expansion as a **scale-stage advantage**, not the next immediate engineering task.

Current execution policy:

```text
DO NOT start Domain Expansion implementation merely because 21.5 runtime work reached a pause point.

Before Domain Expansion implementation:
  -> product should reach the appropriate scale/readiness stage
  -> founder should explicitly select the scale gate
  -> domain research + semantic modeling must be mature
```

Domain research may continue in parallel, but implementation is intentionally deferred.

This amends the older shorthand assumption that "Domain Expansion implementation follows immediately after Milestone 21.5". The strategic roadmap position is preserved, but immediate execution may contain pre-scale growth, commercialization, operations and product-system work first.

---

## 3. Pre-scale execution lane

Between the current 21.5 checkpoint and the future Domain Expansion scale gate, Prompt Draft may execute platform work that improves acquisition, retention, commercialization readiness, operator capability and economic experimentation without prematurely multiplying semantic domains.

Examples include:

```text
Campaign Engine
marketing/operator tooling
campaign-driven Goin incentives
promotion surfaces
measurement/reconciliation
production reliability work
other founder-selected pre-scale product systems
```

These tracks must reuse the accepted Growth Foundation contracts rather than create parallel wallets, analytics stores, authorization systems or rendering stacks.

---

## 4. Selected next engineering track — Campaign Engine V1

Founder-selected next track:

```text
Campaign Engine V1
```

Current implementation state:

```text
architecture/source of truth -> DOCUMENTED
database schema              -> DESIGNED
API/runtime contract         -> DESIGNED
runtime implementation       -> NOT STARTED
first implementation slice   -> CE1 — Foundation
```

Campaign Engine is a pre-scale commercialization/growth platform. It is not part of Domain Expansion and does not require Domain Expansion to begin.

It must preserve the existing authority boundaries:

```text
user_economy_events       -> authoritative Goin ledger
product_analytics_events  -> observational analytics
admin_audit_log           -> privileged mutation audit
backend authorization     -> authoritative permission enforcement
```

---

## 5. 21.5 invariants while Campaign Engine work proceeds

Campaign Engine implementation must not reopen accepted 21.5 architecture without a concrete defect.

Keep:

```text
Nuxt SSR/hybrid route contract
production runtime through Cloudflare Tunnel
prompt-draft.ir canonical production host
api.prompt-draft.ir browser API origin
server-internal API -> http://api:4000
host-aware indexability guard
NUXT_PUBLIC_NOINDEX=true
production + staging noindex behavior
public/protected Prompt and Creator boundaries
Blog/public SEO architecture
first-party acquisition analytics contract
```

Do not:

```text
turn SEO/indexing on as a side effect of Campaign work
submit production sitemap/Search Console launch work
change production DNS/Tunnel/Worker/indexability without explicit founder approval
weaken public/private data boundaries
```

Campaign public routes may be built and production-tested while global noindex remains active.

---

## 6. Deferred 21.5 work

The following remains intentionally deferred rather than forgotten:

```text
NUXT_PUBLIC_NOINDEX=false
production SEO/indexability launch
Search Console production property/launch workflow
sitemap submission for acquisition launch
representative production indexing evidence
initial organic acquisition measurement cadence
```

When the founder later decides the product is ready for SEO launch, resume from:

```text
docs/strategy/MILESTONE_21_5_PHASE5_PRODUCTION_RUNTIME_NOSEO_CHECKPOINT.md
```

and re-audit the latest branch/runtime before changing indexability.

---

## 7. Current transition instruction

Immediate execution transition:

```text
21.5 production runtime / SEO-off checkpoint -> KEEP
Domain Expansion implementation              -> DEFER UNTIL SCALE GATE
Campaign Engine V1                           -> NEXT SELECTED ENGINEERING TRACK
Campaign Engine first slice                  -> CE1 Foundation
```

Before Campaign Engine writes, always re-read the latest branch HEAD and `CAMPAIGN_ENGINE_STATUS.md`, because parallel work may change migration numbers, economy internals, authorization or Manage-shell contracts.
