# Milestone 21.5 — Phase 5 Organic Acquisition Launch & Measurement

Status: **IN PROGRESS / 5.1 READINESS AUDIT + 5.2 MEASUREMENT IMPLEMENTATION**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Mandatory workflow sources:

```text
docs/strategy/STATUS.md
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

---

## 1. Objective

Phase 5 turns the accepted rendering, public-content and SEO architecture into a controlled, measurable acquisition launch.

Phase 5.1 does **not** perform the production cutover. It establishes the evidence, configuration inventory, measurement baseline, cutover gates and rollback procedure required before the founder explicitly authorizes a production switch.

Current invariant:

```text
staging -> NUXT_PUBLIC_NOINDEX=true
production prompt-draft.ir -> untouched until explicit founder-approved cutover
```

The accepted Phase 4 architecture is an input to this phase, not a target for broad redesign.

---

## 2. Accepted inputs from Phases 1–4

Do not reopen these contracts unless the Phase 5 audit proves a concrete defect:

```text
Nuxt SSR/hybrid rendering baseline
Docker/Nitro frontend runtime
independent backend API
server-internal API origin separated from browser API origin
Cloudflare staging path through grassic.ir + api.grassic.ir
loopback-only direct frontend/API host exposure
staging X-Robots-Tag noindex hardening
Cloudflare API cache bypass policy
public Prompt -> /prompt/:id and /fa/prompt/:id
protected Prompt detail -> /prompts?id=<id> and /fa/prompts?id=<id>
public Creator -> /creator/:username and /fa/creator/:username
public Blog -> /blog, /blog/:slug and FA equivalents
native Discovery SSR/prerender
shared Blog-aware public inventory for sitemap.xml + llms.txt
EN/default unprefixed; FA /fa
self canonical + authoritative reciprocal hreflang only
staging noindex always wins
```

Security remains absolute: public acquisition surfaces must never expose protected Prompt bodies/variants, private Drafts, email, sessions, balances, permissions, storage credentials, internal-only IDs or admin data.

---

## 3. Phase 5.1 — Launch Readiness

Status:

```text
IN PROGRESS / CONTRACT + AUDIT
```

Goal:

```text
prove Prompt Draft can be switched from the accepted production-like staging path to the production acquisition path safely, reversibly and measurably
```

### 5.1A — Runtime / deployment / environment / indexability inventory

Audit the branch and the founder-controlled deployment configuration before proposing any production change.

Required inventory:

```text
production frontend hostname target
production API hostname target
Cloudflare zone / DNS / Tunnel routing assumptions
frontend public site URL
browser API origin
Nuxt internal SSR API origin
CORS allowlist
frontend/API host bind policy
staging noindex environment
production noindex/indexability target
Cloudflare Worker fallback decision for production
Cloudflare cache rules, especially API bypass
secrets that must remain local/uncommitted
actual deploy/restart/recovery commands
```

Do not assume that staging values can be copied blindly. Record every hostname/config change explicitly before cutover.

### 5.1B — Search Console + acquisition measurement baseline

Audit what measurement already exists before adding instrumentation.

Required Search Console readiness:

```text
choose/confirm the intended production property scope
establish/confirm ownership verification
verify production sitemap URL is publicly reachable after cutover
submit the sitemap through Search Console after production launch
use URL Inspection/Page Indexing evidence for representative canonical routes
capture baseline and post-launch search impressions/clicks/indexing evidence
```

Google Search Console distinguishes Domain properties from URL-prefix properties; the final property choice and verification method must be recorded during this audit rather than assumed in advance. Sitemap submission tells Google where the sitemap is; it does not guarantee crawling or indexing.

Required internal measurement audit:

```text
identify current analytics/event pipeline and its canonical source
verify whether Blog/public Prompt/public Creator/Discovery landing views are measurable
verify meaningful product actions from those acquisition surfaces are measurable
verify landing/referrer evidence is captured only where privacy-appropriate
separate external search evidence from internal product engagement evidence
identify missing instrumentation as explicit Phase 5.2 work
```

Do not infer whole-product DAU/MAU from acquisition-surface events unless instrumentation genuinely supports that interpretation.

Branch-exact measurement audit result on 2026-09-12:

```text
first-party event table       -> backend/sql/020_product_analytics_events.sql
public analytics endpoint     -> POST /api/analytics/events
backend validation/storage    -> backend/src/productAnalytics.mjs
frontend sender/identity      -> app/composables/useProductAnalytics.ts
admin measurement aggregation -> backend/src/adminGrowth.mjs
```

The existing pipeline already provided anonymous/session IDs, optional authenticated-user linkage, locale/path, bounded metadata, idempotent event IDs and fail-open client delivery so analytics cannot block the primary product action.

Existing pre-5.2 behavioral events were:

```text
prompt_archive_view
prompt_archive_copy
referral_link_open
```

Trusted conversion/economy evidence already existed outside the observational analytics table:

```text
completed Prompt unlock -> user_content_unlocks
Goin issue/spend ledger  -> user_economy_events
```

This means Phase 5.2 must extend the existing first-party pipeline rather than add a second analytics system or duplicate transactional truth as client events.

Search Console inspection did not evidence a Prompt Draft production property in the connected account. The observed connected property was `sc-domain:verta.ir`; production `prompt-draft.ir` property scope, ownership verification and sitemap submission remain explicit founder-controlled readiness tasks.

### 5.1C — Production cutover + rollback contract

Before any production change, write an ordered runbook containing:

```text
pre-cutover backup/checkpoint
exact environment/config changes
Cloudflare DNS/Tunnel/route changes
CORS/API-origin changes
production noindex removal/enable-indexing step
service rebuild/recreate scope only where required
public frontend/API health checks
SSR HTML canonical/hreflang/noindex checks
robots.txt / sitemap.xml / llms.txt checks
public/protected security smoke
representative EN/FA Prompt/Creator/Discovery/Blog smoke
fallback/outage behavior check
rollback trigger conditions
exact rollback steps
post-rollback verification
```

The stable production path must not be replaced until this runbook is complete and the founder explicitly approves execution.

### 5.1D — Founder readiness signoff

Phase 5.1 can close only when the evidence demonstrates:

```text
configuration inventory is complete
production indexability state is intentional
measurement gaps are known
Search Console setup plan is explicit
cutover sequence is explicit
rollback sequence is explicit
security/public-private boundaries remain intact
no unresolved blocker requires a Phase 4 redesign
founder explicitly accepts readiness
```

Closing 5.1 does not itself mean production has been cut over.

---

## 4. Phase 5.2 — Acquisition Measurement Instrumentation

Status:

```text
IN PROGRESS / CORE PROMPT + CREATOR INSTRUMENTATION IMPLEMENTED / RUNTIME VERIFICATION PENDING
```

The 5.1 measurement audit proved the existing first-party pipeline is the correct canonical analytics system, but it did not yet measure the public Prompt/Creator acquisition surfaces or explicit Prompt copy/unlock intent needed for the launch experiment.

### 5.2A — Event + trust contract

Client-origin analytics remain observational. They can measure views and intent but must not be treated as authoritative proof that an economic conversion completed.

Current allowed public/client event taxonomy:

| Event | Resource | Meaning | Trust |
| --- | --- | --- | --- |
| `prompt_archive_view` | `prompt_archive_item` | protected Prompt detail viewed | observational |
| `prompt_archive_copy` | `prompt_archive_item` | clipboard copy succeeded | observational success |
| `referral_link_open` | `referral_username` | referral link opened | observational |
| `public_prompt_view` | `public_prompt` | valid public Prompt page mounted in browser | acquisition view |
| `public_creator_view` | `public_creator` | valid public Creator page mounted in browser | acquisition view |
| `prompt_copy_clicked` | `public_prompt` | user initiated protected Prompt copy flow | intent |
| `prompt_unlock_clicked` | `public_prompt` | locked Prompt required unlock and user initiated it | intent |

The public analytics endpoint explicitly does **not** accept trusted conversion names such as:

```text
prompt_unlock_completed
goin_spent
```

Those outcomes remain derived from transactional records.

### 5.2B — Backend event layer

Implemented on the existing `/api/analytics/events` contract:

```text
public_prompt_view    -> positive numeric public Prompt id
public_creator_view   -> normalized canonical Creator username
prompt_copy_clicked   -> positive numeric public Prompt id
prompt_unlock_clicked -> positive numeric public Prompt id
```

No SQL migration was required because `product_analytics_events` already supports the envelope. Event/resource validation was extended in `backend/src/productAnalytics.mjs` and protected by `backend/src/productAnalytics.test.mjs`.

### 5.2C — Frontend instrumentation hooks

Implemented branch-exact hooks:

```text
app/pages/prompt/[id].vue
  -> public_prompt_view in onMounted only after valid SSR/public data exists

app/pages/creator/[username].vue
  -> public_creator_view in onMounted only after canonicalization + valid public Creator data exists

app/components/prompts/PromptDetail.vue
  -> prompt_copy_clicked when a real copy attempt starts
  -> prompt_unlock_clicked only inside the locked/unlock-required branch
  -> existing prompt_archive_copy remains after successful clipboard write
```

The page-view events are client-mounted rather than SSR-render counted, avoiding automatic bot/request counting as internal product engagement and avoiding duplicate server/client events.

### 5.2D — Trusted conversion reporting

`backend/src/adminGrowth.mjs` now exposes a `launchFunnel` summary and daily acquisition/intent fields while preserving transactional sources for completed outcomes.

Current `launchFunnel` fields:

```text
publicPromptViews
publicPromptViewSessions
publicCreatorViews
publicCreatorViewSessions
copyClicks
copyClickSessions
unlockClicks
unlockClickSessions
completedUnlocks
```

Trust boundary:

```text
views/click intent -> product_analytics_events
completed unlock   -> user_content_unlocks
Goin spend         -> user_economy_events
```

Do not calculate or present these aggregate counts as a strict sequential conversion funnel without session/resource cohort analysis; users may enter protected Prompt surfaces directly or return through different routes.

### 5.2E — Current verification contract

Focused source contract:

```text
pnpm test:product-analytics-web
```

Backend event-validation contract:

```text
pnpm test:product-analytics
```

Because the current implementation changes both `app/**` and `backend/src/**`, founder-local runtime verification requires the smallest two service rebuilds rather than `pnpm stack`:

```text
pnpm api
pnpm test:product-analytics
pnpm frontend
pnpm test:product-analytics-web
```

The source-only instrumentation test does not itself require a rebuild, but the API container must be rebuilt before the changed backend source/test exists inside the running image and the frontend image must be rebuilt before runtime smoke verification.

### 5.2F — Explicit remaining measurement gaps

Phase 5.2 is not complete yet. Remaining work is deliberately narrow:

```text
Blog landing/article view instrumentation is not yet implemented
Discovery landing view instrumentation is not yet implemented
raw document.referrer is intentionally not captured
privacy-safe landing/source classification remains undecided
founder-local API/frontend rebuild + focused runtime verification remains pending
staging behavior should be smoke-tested before acceptance
```

Any referrer/source work should prefer normalized source categories or an allowlisted attribution contract rather than storing arbitrary full referrer URLs/query strings.

Use the smallest implementation necessary. Do not introduce a second analytics system merely because Phase 5 exists.

---

## 5. Phase 5.3 — Founder-approved production cutover

Status:

```text
BLOCKED UNTIL 5.1 ACCEPTED AND REQUIRED 5.2 GAPS CLOSED
```

Production cutover is an explicit founder-authorized operation.

Until that authorization:

```text
DO NOT change prompt-draft.ir
DO NOT change production DNS/Tunnel routes
DO NOT remove staging noindex
DO NOT submit a staging sitemap as the production acquisition property
```

At cutover, use the accepted runbook from 5.1C rather than improvising configuration changes.

---

## 6. Phase 5.4 — Initial acquisition launch + measurement cadence

After production cutover is verified:

```text
submit/monitor production sitemap in Search Console
inspect representative canonical URLs
publish/verify the intended first acquisition content batch
verify internal links into useful Prompt Draft surfaces
capture an explicit launch baseline
review search impressions/clicks/indexing separately from product engagement
establish a repeatable review cadence
record defects and follow-up experiments from evidence, not assumptions
```

Search Console evidence is delayed/external acquisition evidence; Prompt Draft analytics are internal behavioral evidence. Both are required for a useful acquisition experiment, but they answer different questions.

---

## 7. Non-goals

Phase 5.1 does not include:

```text
production cutover without founder approval
broad Phase 4 SEO/public-route refactoring
restoring or deleting unrelated founder-local stash content
full CMS work
Domain Expansion implementation
new payment/commerce scope
new public exposure of protected Prompt/private Draft/account data
blanket Cloudflare HTML/API caching
analytics implementation before the existing pipeline is audited
```

---

## 8. Verification discipline

Follow `DEVELOPMENT_WORKFLOW.md` exactly.

```text
inspect actual changed files/services
-> run focused checks
-> choose smallest rebuild scope
-> founder runtime verification where needed
-> aggregate verification only when justified
```

Service rule:

```text
docs-only      -> no rebuild
frontend-only  -> pnpm frontend
backend-only   -> pnpm api
both changed   -> pnpm api + pnpm frontend
pnpm stack     -> only when genuinely required
```

Production verification must never be smuggled into an implementation step. Any action that changes `prompt-draft.ir`, production DNS, production Cloudflare routing or production indexability requires explicit founder approval in that turn.

---

## 9. Immediate next action

Continue Phase 5 without touching production:

```text
1. verify the current feature/growth-foundation HEAD locally
2. run pnpm test:product-analytics-web before any rebuild
3. rebuild only API with pnpm api, then run pnpm test:product-analytics
4. rebuild only frontend with pnpm frontend
5. smoke public Prompt + Creator view instrumentation and protected copy/unlock intent on staging/local runtime
6. verify /manage/growth launchFunnel values against transactional unlock/Goin evidence
7. implement only the still-required Blog/Discovery measurement gaps
8. continue 5.1C cutover/rollback and Search Console readiness work
9. stop before any production-changing action and obtain explicit founder approval
```

Phase 4 is accepted. Do not restart its audit from scratch unless Phase 5 reveals a concrete regression.