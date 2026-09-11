# Milestone 21.5 — Phase 5 Organic Acquisition Launch & Measurement

Status: **IN PROGRESS / PHASE 5.1 LAUNCH READINESS CONTRACT + AUDIT**

Date: 2026-09-11

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
PENDING 5.1 MEASUREMENT AUDIT
```

Only implement this slice if 5.1 proves that current instrumentation is incomplete for the acquisition experiment.

Potential scope must be driven by the audit, not assumed upfront. Expected questions include:

```text
Can we attribute public landing surfaces?
Can we distinguish Blog/Prompt/Creator/Discovery entry routes?
Can we measure useful downstream product actions?
Can we preserve privacy while retaining useful referrer/landing evidence?
Can external Search Console evidence and internal engagement evidence be compared without conflating them?
```

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

Continue with the branch-exact Phase 5.1 audit:

```text
1. re-read latest feature/growth-foundation HEAD
2. inventory runtime/deployment/env/indexability configuration from repository + founder-controlled deployment evidence
3. inventory existing analytics/measurement implementation without assuming filenames or providers
4. record Search Console property/verification/sitemap plan
5. produce the cutover + rollback checklist
6. classify any missing measurement work into Phase 5.2
7. stop before production-changing actions and obtain explicit founder approval
```

Phase 4 is accepted. Do not restart its audit from scratch unless Phase 5 reveals a concrete regression.