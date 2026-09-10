# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-11

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
21.5.4 SEO/Public Content Architecture          -> IN PROGRESS
  4A SEO Contracts & Route Semantics            -> DONE / ACCEPTED
  4B Public Prompt Architecture                 -> DONE / ACCEPTED
  4C Public Creator + Indexability              -> DONE / ACCEPTED
  4D Sitemap / Robots / Discovery / llms        -> DONE / ACCEPTED 2026-09-09
  4E Blog V1                                    -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
  4F Integration / Legacy Retirement            -> IN PROGRESS / FIRST RETIREMENT VERIFIED / API ROUTING FIX PENDING
21.5.5 Organic Acquisition Launch               -> NOT STARTED
```

## Mandatory sources

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
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
frontend only -> pnpm frontend
backend only  -> pnpm api
both changed  -> pnpm api + pnpm frontend
pnpm stack only when genuinely required
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
pnpm verify:phase4d-static PASS
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

Final 4E.7 acceptance additionally verified the shared `BlogArticlePresentation` across Manage/public surfaces, hierarchical collapsible sections, theme-native prose/code/quote/list/link styling, citation badges, one-boundary section dividers, global image lightbox, RTL/LTR behavior and the one-H1 contract where the localized Article title owns H1 and body Markdown H1 is rejected outside code fences.

---

# Phase 4F Integration / Legacy Retirement — IN PROGRESS

4F.1 evidence closure is complete. The accepted 4A–4E contracts remain the source of truth; `/prompts?id=...`, `/user`, the `/dashboard` compatibility redirect, the shared public inventory/runtime delivery stack, Blog Nitro repository loader, static-generation compatibility path, application noindex policy and staging noindex layers remain KEEP.

## Verified retirement — legacy Discovery generated-HTML cleanup

```text
95b7d7717544d8f8c8b2fb717342cecf2432b12c
  -> removed legacy Discovery generated-HTML cleanup from scripts/generate-public-seo.ts

d44e3cb1bb257f4b8d2faa34393275c54385b47c
  -> inverted Discovery regression expectations so cleanup/legacy markers must remain absent
```

Retired behavior:

```text
LEGACY_DISCOVERY_SNAPSHOT_PATTERN
LEGACY_DISCOVERY_STRUCTURED_PATTERN
readGeneratedHtml()
cleanupLegacyDiscoveryArtifacts()
legacy Discovery cleanup calls/logging
```

Founder-local verification on 2026-09-11:

```text
pnpm test:discovery-seo  -> PASS 8/8
pnpm verify:phase4e-static -> PASS
shared canonical URL count -> 224
published deterministic Blog fixture -> 1 Article / 2 locale URLs
Nuxt prerendered routes -> 341
```

The static output preserved sitemap/llms parity, Blog index/detail SSR/SEO, native Discovery prerendering and private-data exclusion. The native Discovery SSR/prerender implementation remains authoritative; `scripts/generate-public-seo.ts` remains active only for sitemap/llms/robots static compatibility.

## Integration defect found — committed API source did not reproduce accepted public runtime

During 4F integration audit, branch-exact `backend/src/index.mjs` was found to dispatch `handlePublicPromptRequest` and Home Discovery but not the already-accepted `handlePublicCreatorRequest` or `handlePublicInventoryRequest`.

This conflicted with the founder-local runtime, where `/api/public/inventory` still returned HTTP 200 during static verification. `compose.yaml`, `backend/Dockerfile` and `backend/package.json` prove the reproducible API image copies and runs `backend/src/index.mjs`; commit history also shows the Creator/inventory modules were added without a subsequent committed router-wiring change. The local API response was therefore evidence of source/runtime drift rather than proof that current committed source was complete.

Fix implemented without changing public projection, policy or authorization logic:

```text
c53febee08a99dd969e3c158fc4ec3578ad6bbd0
  -> wire handlePublicCreatorRequest + handlePublicInventoryRequest in backend/src/index.mjs

e481364492ddd385592798e0357008153377458e
  -> add simple source-level public API router guard

0bb966c1da8aab6ec12a6f8b44c7cc2373786b07
  -> include router guard in backend test:public-creator

77cc6fd232d121226269f606ea2cf76f78bb0fca
  -> include router guard in root test:public-inventory-api

80c1b65cae29718f7ff2be728b8171d7500d8c2b
  -> add root test:public-creator-api shortcut
```

This backend fix is **PENDING FOUNDER VERIFICATION**. Because backend source/tests changed, rebuild only API with `pnpm api`; do not rebuild frontend or the full stack.

## Static verifier integration / retirement gate

The historical `scripts/phase4d-static-generate-verification.mjs` still calculates the pre-Blog expected inventory and is not a correct standalone verifier for the accepted post-4E platform.

A replacement has been added:

```text
81c5189df538dba674a73db3dbab990e5480cce7
  -> scripts/phase4f-static-verification.ts
```

`pnpm verify:phase4f-static` runs the accepted `verify:phase4e-static` gate first and then checks the same generated output across all 12 EN/FA native Discovery pages for canonical, hreflang, CollectionPage/ItemList JSON-LD, absence of legacy static markers, absence of protected/legacy acquisition links, staging-noindex exclusion and private-data leakage.

The old `verify:phase4d-static` command/file is intentionally **retained until the new 4F replacement passes founder-local verification**. Only then may it be retired under the 4F deletion gates.

## Current verification commands

```powershell
git pull
pnpm api
pnpm test:public-inventory-api
pnpm test:public-creator-api
pnpm verify:phase4f-static
```

No `pnpm frontend` and no `pnpm stack` are required for this batch.

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
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Resume instruction

```text
1. read STATUS.md
2. read DEVELOPMENT_WORKFLOW.md + UI_IMPLEMENTATION_GUIDELINES.md
3. read MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
4. read MILESTONE_21_5_PHASE4E_BLOG_V1.md + 4E.7 acceptance record
5. inspect latest feature/growth-foundation HEAD
6. confirm 4E.1-4E.7 are DONE / ACCEPTED
7. current task = Phase 4F Integration / Verification / Legacy Retirement
8. first legacy Discovery cleanup retirement is founder-local verified
9. current pending gate = rebuild API only, verify committed Creator/inventory router wiring, then run verify:phase4f-static
10. retire verify:phase4d-static only after the 4F replacement passes
11. preserve accepted public/indexability/security contracts while retiring only proven redundancy
12. do not touch prompt-draft.ir before explicit rollout
```
