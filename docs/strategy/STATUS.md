# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-12

Branch:

```text
feature/growth-foundation
```

## Current state

```text
Milestones 1–20                                  -> inherited COMPLETE baseline
Milestone 21 Growth Foundation                  -> DONE / USER ACCEPTED

Milestone 21.5 Rendering & Organic Acquisition  -> IN PROGRESS
21.5.1 Hybrid / SSR Architecture                -> DONE / ACCEPTED
21.5.2 Docker Production Runtime                -> DONE / ACCEPTED
21.5.3 Cloudflare Production Path               -> DONE / ACCEPTED
21.5.4 SEO/Public Content Architecture          -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11
  4A SEO Contracts & Route Semantics            -> DONE / ACCEPTED
  4B Public Prompt Architecture                 -> DONE / ACCEPTED
  4C Public Creator + Indexability              -> DONE / ACCEPTED
  4D Sitemap / Robots / Discovery / llms        -> DONE / ACCEPTED 2026-09-09
  4E Blog V1                                    -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
  4F Integration / Legacy Retirement            -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11
21.5.5 Organic Acquisition Launch               -> IN PROGRESS
  5.1 Launch Readiness                          -> IN PROGRESS / AUDIT + CUTOVER RUNBOOK DRAFTED
  5.2 Acquisition Measurement Instrumentation   -> IN PROGRESS / ACQUISITION CAPTURE IMPLEMENTED / RUNTIME VERIFY PENDING
  5.3 Founder-approved Production Cutover       -> BLOCKED UNTIL READINESS ACCEPTED
  5.4 Initial Launch + Measurement Cadence      -> PENDING PRODUCTION CUTOVER
```

## Mandatory sources

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
docs/strategy/MILESTONE_21_5_PHASE4E_1_ARTICLE_CONTRACT.md
docs/strategy/MILESTONE_21_5_PHASE4E_2_PUBLIC_BLOG.md
docs/strategy/MILESTONE_21_5_PHASE4E_3_BLOG_INVENTORY.md
docs/strategy/MILESTONE_21_5_PHASE4E_4_BLOG_MANAGEMENT.md
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
docs/strategy/MILESTONE_21_5_PHASE4E_6_FINAL_ACCEPTANCE.md
docs/strategy/MILESTONE_21_5_PHASE4E_7_SHARED_ARTICLE_PRESENTATION.md
```

## Verification workflow

```text
inspect changed services
-> focused tests
-> smallest required service rebuild(s)
-> founder-local/runtime verification
-> explicit founder acceptance
```

Service rule:

```text
docs only       -> no rebuild
environment only -> recreate only affected service(s)
frontend only   -> pnpm frontend
backend only    -> pnpm api
both changed    -> pnpm api + pnpm frontend
pnpm stack only when genuinely required
```

Environment-only service shortcuts:

```text
pnpm api:recreate
pnpm frontend:recreate
```

## Accepted runtime/staging baseline

```text
Nuxt SSR by default for acquisition surfaces
explicit client-only application route policy
Nuxt/Nitro node-server Docker runtime
independent backend API retained
server-internal API origin separated from browser API origin
Cloudflare staging: grassic.ir + api.grassic.ir
NUXT_PUBLIC_NOINDEX=true on staging
prompt-draft.ir remains untouched
```

## Accepted locale/indexing contract

```text
EN/default -> unprefixed
FA         -> /fa
self canonical per authoritative locale
reciprocal hreflang only for authoritative locales
x-default -> EN/default when EN exists
no fake localized fallback pages
staging global noindex always wins
```

## Accepted public/protected boundaries

```text
Public Prompt  -> /prompt/:id, /fa/prompt/:id
Protected Prompt detail -> /prompts?id=<id>, /fa/prompts?id=<id>
Public Creator -> /creator/:username, /fa/creator/:username
Public Blog    -> /blog, /blog/:slug, /fa/blog, /fa/blog/:slug
```

Public surfaces never expose protected Prompt bodies/variants, private Drafts, email, internal UUID/source ids, balances, permissions, sessions, storage credentials or admin data.

Creator policy remains:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

## Accepted Phase 4D

```text
pnpm test:phase4d-final    PASS
pnpm smoke:phase4d-final   PASS
pnpm verify:phase4d-static PASS (historical acceptance command; implementation retired in 4F)
```

Historical pre-Blog sitemap/llms count was 220; this is evidence only, not a permanent constant.

---

# Phase 4E Blog V1 — DONE / ACCEPTED

Editorial architecture:

```text
Git repository          -> canonical editorial source
Nuxt/Nitro deployed app -> normal public runtime source
Arvan Object Storage    -> Blog media + explicit optional mirror/emergency role
```

Never query GitHub per public Blog request.

Accepted slices:

```text
4E.1 Article Contract + Repository Loader -> DONE / ACCEPTED
4E.2 Public Blog SSR + SEO                 -> DONE / ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> DONE / ACCEPTED
4E.4 Blog Management Authoring             -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Blog Media + Git Publication          -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.6 Final Aggregate Acceptance            -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.7 Shared Article Presentation           -> DONE / FOUNDER UI VERIFIED / ACCEPTED
```

Accepted aggregate evidence:

```text
pnpm test:phase4e-final    -> PASS
pnpm smoke:phase4e-final   -> PASS
pnpm verify:phase4e-static -> PASS
```

Final 4E.7 acceptance additionally verified the shared `BlogArticlePresentation` across Manage/public surfaces, hierarchical collapsible sections, theme-native prose/code/quote/list/link styling, citation badges, one-boundary section dividers, global image lightbox, RTL/LTR behavior and the one-H1 contract where the localized Article title owns H1 and body Markdown H1 is rejected outside fenced code fences.

---

# Phase 4F Integration / Legacy Retirement — DONE / ACCEPTED

4F closed the integration gap between the accepted 4A–4E architecture and reproducible branch/runtime/static behavior. The accepted public/protected/indexability contracts remain authoritative; `/prompts?id=...`, `/user`, the `/dashboard` compatibility redirect, the shared public inventory/runtime delivery stack, Blog Nitro repository loader, static-generation compatibility path, application noindex policy and staging noindex layers remain KEEP.

## Verified retirement — legacy Discovery generated-HTML cleanup

```text
95b7d7717544d8f8c8b2fb717342cecf2432b12c
  -> removed legacy Discovery generated-HTML cleanup from scripts/generate-public-seo.ts

d44e3cb1bb257f4b8d2faa34393275c54385b47c
  -> inverted Discovery regression expectations so cleanup/legacy markers must remain absent
```

Founder-local verification on 2026-09-11:

```text
pnpm test:discovery-seo    -> PASS 8/8
pnpm verify:phase4e-static -> PASS
shared canonical URL count -> 224
Nuxt prerendered routes    -> 341
```

The native Discovery SSR/prerender implementation remains authoritative; `scripts/generate-public-seo.ts` remains active only for sitemap/llms/robots static compatibility.

## Verified integration repair — public Creator + inventory router wiring

Branch-exact 4F audit found that accepted `publicCreator.mjs` and `publicInventory.mjs` handlers existed but were not dispatched by the committed `backend/src/index.mjs`. The local API image still served `/api/public/inventory`, proving source/runtime drift rather than reproducible branch state.

Repair commits:

```text
c53febee08a99dd969e3c158fc4ec3578ad6bbd0
  -> wire handlePublicCreatorRequest + handlePublicInventoryRequest

e481364492ddd385592798e0357008153377458e
  -> add source-level public API router guard

0bb966c1da8aab6ec12a6f8b44c7cc2373786b07
  -> include router guard in backend test:public-creator

77cc6fd232d121226269f606ea2cf76f78bb0fca
  -> include router guard in root test:public-inventory-api

80c1b65cae29718f7ff2be728b8171d7500d8c2b
  -> add root test:public-creator-api shortcut
```

Founder-local verification on 2026-09-11:

```text
pnpm api                       -> PASS / fresh API image built and started
pnpm test:public-inventory-api -> PASS 17/17
pnpm test:public-creator-api   -> PASS 11/11
```

No public DTO, authorization, Creator policy or Prompt privacy contract changed.

## Verified static replacement + retirement of historical Phase 4D verifier

The old `scripts/phase4d-static-generate-verification.mjs` calculated the pre-Blog inventory and was no longer a correct standalone post-4E integration gate. Replacement:

```text
81c5189df538dba674a73db3dbab990e5480cce7
  -> scripts/phase4f-static-verification.ts
```

The replacement verifies the accepted Blog-aware static inventory and then reuses that output to verify all native Discovery pages for canonical/hreflang, CollectionPage + ItemList JSON-LD, absence of retired legacy markers, absence of protected/legacy acquisition links, production-like noindex behavior and private-data exclusion.

Deletion gates were satisfied and the historical verifier/command were retired:

```text
8ff6d970e5c0c0aa6b2c4c77f1f2cd4ef0cd9953
  -> remove root verify:phase4d-static command

b9692880ca01a480d1adbd4f42312e85a35bc682
  -> delete scripts/phase4d-static-generate-verification.mjs
```

Historical 4D acceptance evidence remains documented; only the obsolete implementation/command was retired.

## Verified 4F cleanup — unique Nuxt auto-import ownership

The integration build exposed duplicate Nuxt auto-import ownership for `toAbsolutePublicUrl`, `normalizePublicSiteUrl` and `compilePromptOutput`.

Creator SEO URL helpers now have one implementation/ownership path: `publicPromptSeo.ts` owns the shared URL helpers, `publicCreatorSeo.ts` consumes without re-exporting them, and the Creator page imports the shared URL helpers directly. Regression coverage requires this ownership to remain unique.

The compiler required a different solution because both implementations are intentional: `compilePromptCore.ts` is the accepted headless compiler while `compilePrompt.ts` is the UI/runtime adapter. An initial module-scan opt-out did not remove Nuxt 4's duplicate warning in the founder build, so the final accepted solution preserves behavior while making ownership explicit: the Core export is now `compilePromptOutputCore`; `compilePromptPure.ts` imports that internal name directly; and the runtime wrapper remains the sole public/auto-import owner of `compilePromptOutput`.

Implementation commits:

```text
2d94442ea9b859bc30af244bf7fcd9925ebdb788
  -> remove duplicate Creator SEO URL-helper re-exports

ca94e206cffad7d965ca4aeefb206e6349d845e4
  -> import shared URL helpers directly in the Public Creator page

d9e0c3d8aa1c869a516f2cd8f74e45e44d00bf97
  -> add regression coverage for unique Creator SEO helper ownership

6908d7523575b5d18298495f98a8a53220f7f8cf
  -> give the headless prompt compiler Core a unique compilePromptOutputCore export

e31a4e2d7b8cc4dc82a8e0c6571bb234be4442bf
  -> consume the unique Core export from the pure compiler adapter

77375c828927b5a69324c2b91cbf598d693e26f1
  -> replace the stale Create-page historical guard with runtime/Core boundary coverage and lock unique compiler export ownership
```

Founder-local final acceptance evidence on 2026-09-11:

```text
pnpm test:public-creator-web -> PASS 20/20
pnpm test:phase9-regression  -> PASS 9/9
pnpm frontend                -> PASS / fresh frontend image built and started
Nuxt duplicate-import warnings for:
  toAbsolutePublicUrl        -> ABSENT
  normalizePublicSiteUrl     -> ABSENT
  compilePromptOutput        -> ABSENT

pnpm verify:phase4f-static   -> PASS
shared sitemap URLs          -> 224
shared llms URLs             -> 224
Nuxt prerendered routes      -> 341
native Discovery HTML        -> 12 EN/FA pages checked
Blog index HTML              -> 2 checked
Blog Article HTML            -> 2 checked
```

The remaining sourcemap, chunk-size, Nitro cache-driver and orphan-container warnings observed during local build/static generation are unrelated non-blocking warnings and are outside this Phase 4F cleanup contract.

## Phase 4 closure

```text
21.5.4A -> DONE / ACCEPTED
21.5.4B -> DONE / ACCEPTED
21.5.4C -> DONE / ACCEPTED
21.5.4D -> DONE / ACCEPTED
21.5.4E -> DONE / ACCEPTED
21.5.4F -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11
```

Milestone 21.5 Phase 4 — SEO/Public Content Architecture is therefore **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**.

No production cutover was performed. `prompt-draft.ir` remains untouched and staging must keep `NUXT_PUBLIC_NOINDEX=true` until the explicit acquisition-launch/cutover step.

---

# Phase 5 Organic Acquisition Launch & Measurement — IN PROGRESS

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
```

Current slices:

```text
5.1 Launch Readiness                        -> IN PROGRESS / AUDIT + CUTOVER RUNBOOK DRAFTED
5.2 Acquisition Measurement Instrumentation -> IN PROGRESS / ACQUISITION CAPTURE IMPLEMENTED / RUNTIME VERIFY PENDING
```

Phase 5.1 exists to establish a branch-exact runtime/deployment/environment/indexability inventory, Search Console and acquisition-measurement baseline, explicit production cutover procedure, explicit rollback procedure and founder readiness signoff **before** production is changed.

Phase 5.1C repository-side runbook is now drafted. It records a critical cutover constraint: `NUXT_PUBLIC_NOINDEX` is process-wide, so one frontend container cannot simultaneously serve `grassic.ir` as noindex and `prompt-draft.ir` as indexable. The initial-cutover policy is therefore to retire the staging frontend ingress before setting production noindex=false. The existing staging fallback Worker must not be attached unchanged to production because its copy/behavior is staging-specific.

Phase 5.2 extends the existing first-party `product_analytics_events` pipeline rather than introducing a second analytics system. Client-mounted acquisition views now cover public Prompt, public Creator, Blog index, Blog Article and taxonomy-backed Discovery routes; protected Prompt copy/unlock intent is instrumented; successful clipboard copy remains separately measured; completed unlock and Goin spend remain derived from transactional source-of-truth tables. Founder-local/runtime verification is still pending before 5.2 can be accepted.

Execution slices:

```text
5.1A runtime/deployment/env/indexability inventory
5.1B Search Console + acquisition measurement baseline
5.1C production cutover + rollback contract
5.1D founder readiness signoff
5.2 acquisition measurement instrumentation only for gaps proven by 5.1
5.3 founder-approved production cutover
5.4 initial acquisition launch + measurement cadence
```

Current hard boundary:

```text
staging NUXT_PUBLIC_NOINDEX=true -> KEEP until approved cutover sequence retires staging frontend ingress
prompt-draft.ir                  -> UNTOUCHED
production DNS/Tunnel/indexability changes -> require explicit founder approval
```

Current Phase 5.2 source implementation changes both frontend and backend. Per the project workflow, runtime verification requires only `pnpm api` + `pnpm frontend`; a full `pnpm stack` is not justified. Environment-only cutover changes later use `pnpm api:recreate` / `pnpm frontend:recreate` after the verified images already exist. No production route, DNS, Tunnel or indexability change has been made.

## Hard rules

```text
DO NOT weaken authorization for SEO/Blog.
DO NOT make protected Archive detail public.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT query GitHub per public Blog request.
DO NOT make Git + Arvan uncontrolled equal content sources.
DO NOT embed base64 images in Markdown.
DO NOT make editor state canonical.
DO NOT create fake localized Blog routes.
DO NOT put draft/unpublished Blog URLs into sitemap/llms.
DO NOT recreate Blog indexability outside Article contract.
DO NOT let Blog SEO override staging noindex.
DO NOT expose BLOG_GITHUB_TOKEN publicly.
DO NOT allow canonical Blog body Markdown H1 outside fenced code; Article title owns H1.
DO NOT attach the staging fallback Worker unchanged to prompt-draft.ir.
DO NOT touch prompt-draft.ir before explicit rollout.
DO NOT change production DNS/Tunnel/indexability without explicit founder approval.
```

## Resume instruction

```text
1. read STATUS.md
2. read DEVELOPMENT_WORKFLOW.md + UI_IMPLEMENTATION_GUIDELINES.md
3. read MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
4. read MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md as the current Phase 5 source of truth
5. read MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md before any cutover discussion
6. read MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md for accepted staging baseline
7. inspect latest feature/growth-foundation HEAD before every decision/write
8. confirm 21.5.4 / 4A-4F remain DONE / ACCEPTED; do not restart Phase 4 audit without a concrete regression
9. current task = 21.5.5 / Phase 5.1 + Phase 5.2
10. run focused Phase 5.2 source tests, rebuild only pnpm api + pnpm frontend, and smoke Prompt/Creator/Blog/Discovery plus protected copy/unlock behavior
11. verify /api/admin/growth/summary launchFunnel against transactional unlock/Goin evidence; do not treat aggregate surface counts as a strict sequential funnel
12. if focused verification passes, record founder-local Phase 5.2 acceptance
13. complete the external current-production DNS/origin snapshot required by 5.1C and confirm www/Search Console policy
14. preserve all accepted public/indexability/security/compiler boundaries
15. keep staging NUXT_PUBLIC_NOINDEX=true until the founder-approved cutover step explicitly retires staging frontend ingress
16. do not touch prompt-draft.ir or production Cloudflare routing before explicit founder approval
```