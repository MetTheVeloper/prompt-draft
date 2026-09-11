# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11**

Date: 2026-09-11

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

Operational workflow:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
```

## 1. Objective

Phase 4 turns the accepted hybrid Nuxt/Nitro runtime into one reusable SEO/public-content platform. Every acquisition surface must have deterministic canonical URL, locale URL, indexability, SSR metadata, structured data where authoritative, sitemap/AI-discovery participation, 404 behavior, public projection and internal-link semantics.

Security remains absolute:

```text
DO NOT expose protected Prompt bodies/variants for SEO/public content.
DO NOT SSR/private-publish private Drafts.
DO NOT expose private account/Creator data.
DO NOT make GET /api/archive/:id public.
```

## 2. Accepted runtime baseline

```text
21.5.1 Hybrid / SSR Architecture   DONE / ACCEPTED
21.5.2 Docker Production Runtime   DONE / ACCEPTED
21.5.3 Cloudflare Production Path  DONE / ACCEPTED
```

Accepted foundations include Nuxt SSR for acquisition surfaces, explicit client-heavy application policy, Nitro Docker runtime, internal/public API origin separation, Cloudflare staging, `NUXT_PUBLIC_NOINDEX`, sanitized public APIs and the existing Arvan Object Storage media pipeline.

`prompt-draft.ir` remains untouched until explicit rollout.

## 3. Phase 4 execution order

```text
21.5.4A SEO Contracts & Route Semantics                    DONE / ACCEPTED
21.5.4B Public Prompt Architecture                         DONE / ACCEPTED
21.5.4C Public Creator + Indexability Policy               DONE / ACCEPTED
21.5.4D Sitemap / Robots / Discovery + AI Discovery        DONE / ACCEPTED 2026-09-09
21.5.4E Blog V1                                            DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
21.5.4F Integration / Verification / Legacy Retirement     DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11
```

Required order was completed as planned:

```text
4A -> 4B -> 4C -> 4D -> 4E -> 4F
```

## 4. Accepted locale/indexing model

```text
English/default -> unprefixed
Persian         -> /fa
```

Only authoritative localized content may be indexable. Each authoritative localization is self-canonical. When both exist, reciprocal hreflang is emitted and x-default points to English/default. No cookie-dependent canonical language and no fake fallback localization.

## 5. Accepted 4A — shared SEO/routing platform

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4A_SEO_CONTRACTS.md
```

Accepted: shared `usePublicSeo`, SSR metadata, absolute canonical URLs, OG/Twitter, EN/FA canonical/hreflang/x-default, staging noindex precedence, lang/dir, real 404/redirect behavior, public route helpers, application X-Robots policy, strict locale route audit and isolated legacy static compatibility.

## 6. Accepted 4B — Public Prompt

Canonical public routes:

```text
/prompt/:id
/fa/prompt/:id
GET /api/public/prompts/:id
```

Protected product detail remains:

```text
/prompts?id=<id>
/fa/prompts?id=<id>
GET /api/archive/:id
```

The public query never selects protected Prompt bodies/variants.

## 7. Accepted 4C — Public Creator

Canonical public routes:

```text
/creator/:username
/fa/creator/:username
```

Policy:

```text
accessible = active account + approved Creator + canonical username
indexable = accessible + complete Creator profile
discoverable = indexable
```

Publication count is never a Creator gate. Public projection excludes private account/lifecycle/economy/storage data.

## 8. Accepted 4D — Sitemap / Robots / Discovery + AI Discovery

Canonical records:

```text
docs/strategy/MILESTONE_21_5_PHASE4D_SITEMAP_ROBOTS_AI_DISCOVERY.md
docs/strategy/MILESTONE_21_5_PHASE4D_5_DISCOVERY_MIGRATION.md
docs/strategy/MILESTONE_21_5_PHASE4D_6_AGGREGATE_STAGING_ACCEPTANCE.md
```

Shared canonical public inventory drives sitemap, llms and static compatibility; shared route policy drives robots/X-Robots; native Discovery SSR owns visible content + SEO + JSON-LD.

Acceptance gates:

```text
pnpm test:phase4d-final       PASS
pnpm smoke:phase4d-final      PASS
pnpm verify:phase4d-static    PASS (historical acceptance command; retired during 4F)
```

Historical acceptance snapshot was 220 sitemap URLs / 220 llms URLs / 331 prerendered routes. Counts are evidence, not permanent constants.

## 9. Accepted Phase 4E — Blog V1

Canonical source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
```

Aggregate acceptance record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_6_FINAL_ACCEPTANCE.md
```

Final shared-presentation acceptance record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_7_SHARED_ARTICLE_PRESENTATION.md
```

Public routes:

```text
/blog
/blog/:slug
/fa/blog
/fa/blog/:slug
```

Management routes:

```text
/manage/blog
/fa/manage/blog
```

Editorial architecture:

```text
Git repository          -> canonical editorial source
Docker/Nitro deployment -> normal public runtime content source
Arvan Object Storage    -> managed media + explicit optional emergency role
```

Repository-backed does **not** mean request-time GitHub. Public Blog reads deployed bundled content; legacy static generation reads the same validated build-workspace Blog repository snapshot.

Accepted 4E state:

```text
4E.1 Article Contract + Repository Loader -> DONE / ACCEPTED
4E.2 Public Blog SSR + SEO                 -> DONE / ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> DONE / ACCEPTED
4E.4 Blog Management Authoring             -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Media + Git Publication               -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.6 Aggregate acceptance                  -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.7 Shared Article Presentation           -> DONE / FOUNDER UI VERIFIED / ACCEPTED
```

Accepted 4E.6 gates:

```text
pnpm test:phase4e-final    PASS
pnpm smoke:phase4e-final   PASS
pnpm verify:phase4e-static PASS
```

4E.7 added one shared Blog body presentation component for Manage preview and public Blog detail, hierarchical collapsible headings, centralized theme-native prose/code/quote/list/image styling, citation badges, single section-boundary dividers, global-modal image zoom and the one-H1 contract. The localized Article title owns the page H1; canonical body Markdown H1 is rejected outside fenced code. Focused Blog tests/frontend verification completed without error and the founder explicitly accepted the UI/behavior on 2026-09-10.

### Locked Article/content model

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

`availableLocales` is derived from published status plus complete authoritative localized title/description/body. Draft/unpublished URLs never enter public inventory.

### Locked management ownership

```text
Article id     -> system-owned / immutable
publishedAt    -> system-owned
updatedAt      -> system-owned
public author  -> Prompt Draft editorial identity
admin actor    -> internal audit identity
slug/status/content -> editor-owned
public locales -> derived
```

### Managed media + publication

Blog images reuse the existing Arvan/S3 authority below `blog/`, with full/thumbnail/manifest assets, required persisted alt on new uploads, Gallery browsing and no base64 Markdown payloads.

Canonical authoring uses server-only `BLOG_GITHUB_*` configuration, fail-closed Git management reads, strict editor-owned write payloads, server-owned identity/timestamps, full repository validation, atomic Git tree+commit+non-force ref update, optimistic Article versions, guarded branch-race retry and backend actor audit receipts.

Public Blog still never queries GitHub; a canonical Git save appears publicly only after a deployment/build contains that commit.

### Emergency Arvan publication

Explicit emergency editorial publication remains optional and unimplemented. Arvan must never become an uncontrolled equal source of truth. If later enabled, it must use explicit identity/version/sync metadata such as `articleId`, content hash/revision, `source=emergency` and `syncState=pending_git`.

## 10. Blog sitemap / AI-discovery integration rule

Published Article eligibility flows through the same public inventory architecture:

```text
published Article contract
-> Blog public inventory
-> /blog + authoritative localized Article URLs
-> sitemap.xml
-> llms.txt
```

Forbidden: separate Blog-only indexability heuristics, draft URLs, fake localizations or a second sitemap policy.

## 11. Hard rules inherited forward

```text
DO NOT weaken authorization for Blog/SEO.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT use cookie-dependent canonical language.
DO NOT create fake localized Blog pages.
DO NOT query GitHub per public Blog request.
DO NOT expose BLOG_GITHUB_TOKEN through public config.
DO NOT create Git and Arvan as uncontrolled equal content sources.
DO NOT embed base64 images in Markdown.
DO NOT add draft/unpublished Blog URLs to sitemap/llms.
DO NOT create a second public-indexability system.
DO NOT allow canonical Blog body Markdown H1 outside fenced code; Article title owns H1.
DO NOT touch prompt-draft.ir before explicit rollout.
```

## 12. Accepted Phase 4F — Integration / Verification / Legacy Retirement

4F audited integration behavior before deleting or consolidating anything. It retained accepted compatibility/application paths when they still had real callers or runtime roles, repaired branch/runtime drift, replaced the stale pre-Blog static verifier, retired obsolete legacy Discovery cleanup, and removed duplicate Nuxt auto-import ownership without changing accepted compiler behavior or public/security contracts.

### Retained compatibility/runtime paths

```text
/prompts?id=:id                       -> protected application Prompt detail
/user                                 -> account/Draft surface
/dashboard                            -> compatibility redirect to /manage/dashboard
scripts/run-static-generate.mjs       -> legacy static-generation compatibility
scripts/generate-public-seo.ts        -> shared sitemap/llms/robots static compatibility
server/utils/public-seo-inventory.ts  -> shared inventory contract
Blog Nitro repository loader          -> request-time deployed content source
staging noindex middleware/meta        -> required until explicit production cutover
```

### Verified retirements and repairs

```text
95b7d7717544d8f8c8b2fb717342cecf2432b12c
  -> retire legacy Discovery generated-HTML cleanup

d44e3cb1bb257f4b8d2faa34393275c54385b47c
  -> require retired cleanup/legacy markers to remain absent

c53febee08a99dd969e3c158fc4ec3578ad6bbd0
  -> wire public Creator + public inventory handlers into backend entrypoint

e481364492ddd385592798e0357008153377458e
0bb966c1da8aab6ec12a6f8b44c7cc2373786b07
77cc6fd232d121226269f606ea2cf76f78bb0fca
80c1b65cae29718f7ff2be728b8171d7500d8c2b
  -> lock public API router coverage into focused root/backend tests

81c5189df538dba674a73db3dbab990e5480cce7
  -> add integrated Blog-aware Phase 4F static gate

8ff6d970e5c0c0aa6b2c4c77f1f2cd4ef0cd9953
b9692880ca01a480d1adbd4f42312e85a35bc682
  -> retire historical Phase 4D standalone static verifier command/implementation
```

### Unique Nuxt auto-import ownership

Creator shared URL-helper ownership is now singular: `publicPromptSeo.ts` owns `toAbsolutePublicUrl` and `normalizePublicSiteUrl`; Creator-specific code consumes those helpers without re-exporting them.

The prompt compiler keeps the accepted architecture while making export ownership explicit:

```text
compilePromptCore.ts -> headless compiler / compilePromptOutputCore
compilePromptPure.ts -> pure final adapter consuming compilePromptOutputCore
compilePrompt.ts     -> UI/runtime adapter / sole public compilePromptOutput owner
create.vue           -> runtime adapter only; does not bypass into Core/Pure internals
```

Final compiler cleanup commits:

```text
6908d7523575b5d18298495f98a8a53220f7f8cf
  -> unique compilePromptOutputCore headless export

e31a4e2d7b8cc4dc82a8e0c6571bb234be4442bf
  -> pure adapter consumes the unique Core export

77375c828927b5a69324c2b91cbf598d693e26f1
  -> focused runtime/Core boundary regression and unique export ownership guard
```

### Final founder-local evidence — 2026-09-11

```text
pnpm test:public-creator-web -> PASS 20/20
pnpm test:phase9-regression  -> PASS 9/9

pnpm frontend                -> PASS / fresh frontend image built and started
Nuxt duplicate imports:
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

The integrated gate verified the Blog-aware shared inventory, native Discovery canonical/hreflang + CollectionPage/ItemList JSON-LD, absence of retired markers, absence of protected/legacy acquisition links, production-like indexability behavior and private-data exclusion.

Remaining Nuxt/Vite sourcemap and chunk-size warnings, the Nitro cache-driver externalization warning and the existing orphan `cloudflared` container warning were non-blocking and unrelated to the Phase 4 contract.

### Phase 4 acceptance

All six Phase 4 slices are accepted. No production cutover was performed as part of acceptance. Staging remains globally noindex and `prompt-draft.ir` remains untouched.

```text
Phase 4 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11
NEXT    -> 21.5.5 Organic Acquisition Launch & Measurement
```

The next phase must turn the accepted SEO/public-content platform into a controlled measurable launch rather than changing the accepted Phase 4 architecture by default.