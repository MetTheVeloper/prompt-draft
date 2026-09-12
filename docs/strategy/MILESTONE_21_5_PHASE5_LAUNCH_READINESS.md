# Milestone 21.5 — Phase 5 Organic Acquisition Launch & Measurement

Status: **IN PROGRESS / 5.1 READINESS AUDIT + 5.2 DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

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

Audit the branch and founder-controlled deployment configuration before proposing any production change.

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

Do not assume staging values can be copied blindly. Record every hostname/config change explicitly before cutover.

### 5.1B — Search Console + acquisition measurement baseline

Required Search Console readiness:

```text
choose/confirm the intended production property scope
establish/confirm ownership verification
verify production sitemap URL is publicly reachable after cutover
submit the sitemap through Search Console after production launch
use URL Inspection/Page Indexing evidence for representative canonical routes
capture baseline and post-launch search impressions/clicks/indexing evidence
```

Search Console property scope and verification method must be recorded rather than assumed. Sitemap submission identifies the sitemap location; it does not guarantee crawling or indexing.

Branch-exact internal measurement audit on 2026-09-12 identified:

```text
first-party event table       -> backend/sql/020_product_analytics_events.sql
public analytics endpoint     -> POST /api/analytics/events
backend validation/storage    -> backend/src/productAnalytics.mjs
frontend sender/identity      -> app/composables/useProductAnalytics.ts
admin measurement aggregation -> backend/src/adminGrowth.mjs
```

Trusted conversion/economy evidence remains outside the observational analytics table:

```text
completed Prompt unlock -> user_content_unlocks
Goin issue/spend ledger  -> user_economy_events
```

Search Console inspection did not evidence a Prompt Draft production property in the connected account. The observed connected property was `sc-domain:verta.ir`; production `prompt-draft.ir` property scope, ownership verification and sitemap submission remain founder-controlled readiness tasks.

### 5.1C — Production cutover + rollback contract

Repository-side cutover/rollback runbook:

```text
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
```

The runbook must keep an ordered sequence for:

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

Critical accepted cutover constraints already recorded:

```text
NUXT_PUBLIC_NOINDEX is process-wide for the frontend container
one frontend container cannot simultaneously serve grassic.ir as noindex and prompt-draft.ir as indexable
initial cutover must retire staging frontend ingress before production noindex=false
current staging fallback Worker is staging-specific and must not be attached unchanged to production
production API needs its own explicit Cloudflare cache-bypass verification/rule
www.prompt-draft.ir policy must be explicit; preferred canonical behavior is edge/DNS redirect to apex
```

The stable production path must not be replaced until readiness is accepted and the founder explicitly approves execution.

### 5.1D — Founder readiness signoff

Phase 5.1 can close only when evidence demonstrates:

```text
configuration inventory is complete
production indexability state is intentional
measurement gaps are closed/accepted
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
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-12
```

Verification record:

```text
docs/strategy/MILESTONE_21_5_PHASE5_2_VERIFICATION.md
```

The 5.1 audit proved the existing first-party pipeline is the canonical analytics system. Phase 5.2 extended that pipeline across the accepted public acquisition surfaces and protected Prompt copy/unlock intent path without creating a second analytics system.

### 5.2A — Accepted event + trust contract

Client-origin analytics remain observational. They measure views and intent but are not authoritative proof that an economic conversion completed.

Allowed public/client taxonomy:

| Event | Resource | Meaning | Trust |
| --- | --- | --- | --- |
| `prompt_archive_view` | `prompt_archive_item` | protected Prompt detail viewed | observational |
| `prompt_archive_copy` | `prompt_archive_item` | clipboard copy succeeded | observational success |
| `referral_link_open` | `referral_username` | referral link opened | observational |
| `public_prompt_view` | `public_prompt` | valid public Prompt page mounted in browser | acquisition view |
| `public_creator_view` | `public_creator` | valid public Creator page mounted in browser | acquisition view |
| `public_blog_index_view` | `public_blog` / `index` | public Blog index mounted in browser | acquisition view |
| `public_blog_article_view` | `public_blog` / canonical slug | valid public Blog Article mounted in browser | acquisition view |
| `public_discovery_view` | `public_discovery` / taxonomy slug | valid taxonomy-backed Discovery route mounted in browser | acquisition view |
| `prompt_copy_clicked` | `public_prompt` | user initiated protected Prompt copy flow | intent |
| `prompt_unlock_clicked` | `public_prompt` | locked Prompt required unlock and user initiated it | intent |

Public Blog/Discovery resource slugs use a bounded normalized kebab-case validator. Arbitrary path-like, uppercase or overlong identifiers are rejected.

The public analytics endpoint does **not** accept trusted conversion names such as:

```text
prompt_unlock_completed
goin_spent
```

### 5.2B — Backend event layer

Implemented on the existing `/api/analytics/events` contract:

```text
public_prompt_view        -> positive numeric public Prompt id
public_creator_view       -> normalized canonical Creator username
public_blog_index_view    -> public_blog / index
public_blog_article_view  -> public_blog / normalized canonical Blog slug
public_discovery_view     -> public_discovery / normalized taxonomy slug
prompt_copy_clicked       -> positive numeric public Prompt id
prompt_unlock_clicked     -> positive numeric public Prompt id
```

No SQL migration was required because `product_analytics_events` already supports the envelope. Validation is in `backend/src/productAnalytics.mjs`, protected by `backend/src/productAnalytics.test.mjs`.

### 5.2C — Frontend instrumentation hooks

Accepted hooks:

```text
app/pages/prompt/[id].vue
  -> public_prompt_view in onMounted only after valid SSR/public data exists

app/pages/creator/[username].vue
  -> public_creator_view in onMounted only after canonicalization + valid public Creator data exists

app/pages/blog/index.vue
  -> public_blog_index_view in onMounted after successful Blog index SSR load

app/pages/blog/[slug].vue
  -> public_blog_article_view in onMounted after Article load + canonical slug resolution

app/pages/discover/[slug].vue
  -> public_discovery_view in onMounted only for accepted Discovery taxonomy
  -> invalid/not-found Discovery state does not emit a view event

app/components/prompts/PromptDetail.vue
  -> prompt_copy_clicked when a real copy attempt starts
  -> prompt_unlock_clicked only inside the locked/unlock-required branch
  -> existing prompt_archive_copy remains after successful clipboard write
```

Public page-view events are client-mounted rather than SSR-request counted, avoiding automatic bot/request counting and duplicate server/client events.

### 5.2D — Trusted conversion reporting

`backend/src/adminGrowth.mjs` exposes `launchFunnel` acquisition/intent fields while preserving transactional sources for completed outcomes.

Accepted `launchFunnel` fields:

```text
publicPromptViews
publicPromptViewSessions
publicCreatorViews
publicCreatorViewSessions
publicBlogIndexViews
publicBlogIndexViewSessions
publicBlogArticleViews
publicBlogArticleViewSessions
publicDiscoveryViews
publicDiscoveryViewSessions
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

These aggregate counts must not be presented as a strict sequential conversion funnel without cohort/session/resource analysis.

### 5.2E — Accepted verification evidence

Founder-local automated verification:

```text
pnpm test:product-analytics-web -> PASS 5/5
pnpm api                        -> PASS / API healthy
pnpm test:product-analytics     -> PASS 8/8
pnpm frontend                   -> PASS / Nuxt client + SSR/Nitro build
pnpm stack:cloudflare:status    -> PASS / staging topology healthy
```

Behavioral staging verification persisted real browser-originated acquisition events for:

```text
public Prompt
public Creator
Blog index
Discovery
```

The protected Prompt flow persisted the expected ordered events:

```text
prompt_unlock_clicked
-> prompt_copy_clicked
-> prompt_archive_copy
```

The authorized admin summary returned HTTP 200 with populated acquisition/intent `launchFunnel` counters and transactional `completedUnlocks`/economy values.

A published English staging Blog Article fixture was unavailable during runtime smoke, so `public_blog_article_view` runtime evidence is deferred. Its contract is covered by passing frontend and backend automated tests and is not a 5.2 acceptance blocker.

Initial-launch attribution remains privacy-minimal:

```text
raw document.referrer -> NOT CAPTURED
arbitrary query strings -> NOT CAPTURED
normalized/allowlisted source attribution -> optional future follow-up
```

Phase 5.2 is therefore **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**.

---

## 5. Phase 5.3 — Founder-approved production cutover

Status:

```text
BLOCKED UNTIL 5.1 READINESS ACCEPTED + EXPLICIT FOUNDER CUTOVER APPROVAL
```

Production cutover is an explicit founder-authorized operation.

Until that authorization:

```text
DO NOT change prompt-draft.ir
DO NOT change production DNS/Tunnel routes
DO NOT remove staging noindex
DO NOT submit a staging sitemap as the production acquisition property
```

At cutover, use the accepted 5.1C runbook rather than improvising configuration changes.

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

Search Console evidence is delayed/external acquisition evidence; Prompt Draft analytics are internal behavioral evidence. They answer different questions and should remain separately interpreted.

---

## 7. Non-goals

Phase 5 does not include:

```text
production cutover without founder approval
broad Phase 4 SEO/public-route refactoring
restoring or deleting unrelated founder-local stash content
full CMS work
Domain Expansion implementation
new payment/commerce scope
new public exposure of protected Prompt/private Draft/account data
blanket Cloudflare HTML/API caching
a second analytics system
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
docs-only       -> no rebuild
environment-only -> recreate only affected service(s)
frontend-only   -> pnpm frontend
backend-only    -> pnpm api
both changed    -> pnpm api + pnpm frontend
pnpm stack      -> only when genuinely required
```

Production verification must never be smuggled into an implementation step. Any action that changes `prompt-draft.ir`, production DNS, production Cloudflare routing or production indexability requires explicit founder approval in that turn.

---

## 9. Immediate next action

Continue Phase 5 without touching production:

```text
1. finish 5.1A production runtime/deployment/environment/indexability inventory
2. finish 5.1B Search Console property/ownership plan and production measurement baseline
3. audit/finalize 5.1C exact DNS/Tunnel/API-cache/www/noindex cutover + rollback values
4. obtain 5.1D founder readiness signoff
5. stop before any production-changing action and obtain explicit founder cutover approval
```

Phase 4 is accepted and Phase 5.2 is accepted. Do not restart either audit from scratch unless Phase 5.1 reveals a concrete regression.
