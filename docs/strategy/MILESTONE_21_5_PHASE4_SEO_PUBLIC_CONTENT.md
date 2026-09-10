# Milestone 21.5 — Phase 4 SEO Platform & Public Content Architecture

Status: **IN PROGRESS / 4A + 4B + 4C + 4D DONE + ACCEPTED / 4E REOPENED FOR 4E.7 / 4F BLOCKED**

Date: 2026-09-10

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
21.5.4E Blog V1                                            REOPENED / 4E.1-4E.6 ACCEPTED / 4E.7 UI VERIFICATION NEXT
21.5.4F Integration / Verification / Legacy Retirement     BLOCKED UNTIL 4E.7 ACCEPTANCE
```

Required order remains:

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
pnpm verify:phase4d-static    PASS
```

Historical acceptance snapshot was 220 sitemap URLs / 220 llms URLs / 331 prerendered routes. Counts are evidence, not permanent constants.

## 9. Phase 4E — Blog V1 — REOPENED FOR FINAL UI ADDENDUM

Canonical source of truth:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_BLOG_V1.md
```

Accepted aggregate record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_6_FINAL_ACCEPTANCE.md
```

Current UI addendum record:

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

4E state:

```text
4E.1 Article Contract + Repository Loader -> DONE / ACCEPTED
4E.2 Public Blog SSR + SEO                 -> DONE / ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> DONE / ACCEPTED
4E.4 Blog Management Authoring             -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Media + Git Publication               -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.6 Aggregate acceptance                  -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.7 Shared Article Presentation           -> IMPLEMENTED / FOUNDER UI VERIFICATION NEXT / NOT ACCEPTED
```

Previously accepted 4E.6 gates remain valid:

```text
pnpm test:phase4e-final    PASS
pnpm smoke:phase4e-final   PASS
pnpm verify:phase4e-static PASS
```

4E.7 is presentation-only and must not alter those accepted semantics. It introduces one shared Blog body presentation component for Manage preview and public Blog detail, hierarchical collapsible headings, centralized theme-native prose/code/quote/list/image styling and global-modal image zoom. The existing safe Markdown renderer remains authoritative.

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
DO NOT touch prompt-draft.ir before explicit rollout.
```

## 12. Current next action

Phase 4E.1–4E.6 remain accepted. Current gate is 4E.7 founder UI verification.

Run the focused Blog regressions and frontend-only rebuild, verify shared presentation/collapse/lightbox in EN/FA and Light/Dark, then require explicit founder acceptance. Only after that may Phase 4E be closed again and 4F begin.
