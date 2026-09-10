# Prompt Draft Strategy / Growth Foundation Status

Last updated: 2026-09-10

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
  4E Blog V1                                    -> IN PROGRESS / 4E.1-4E.5 ACCEPTED / 4E.6 NEXT
  4F Integration / Legacy Retirement            -> NOT STARTED
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

# Phase 4E Blog V1

Editorial architecture:

```text
Git repository          -> canonical editorial source
Nuxt/Nitro deployed app -> normal public runtime source
Arvan Object Storage    -> Blog media + explicit optional mirror/emergency role
```

Never query GitHub per public Blog request.

## 4E.1 — DONE / ACCEPTED

Canonical `content/blog/<articleId>/article.json + en.md/fa.md` contract, derived locale eligibility, editorial author identity and shared safe Markdown are accepted.

Evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> PASS
founder -> تایید
```

## 4E.2 — DONE / ACCEPTED

SSR Blog index/detail, real 404/canonical semantics, public projection, SEO/structured data, hreflang and staging noindex are accepted.

Evidence:

```text
pnpm test:blog-public -> 26/26 PASS
pnpm frontend -> PASS
pnpm smoke:blog-public -> PASS
founder -> تایید
```

## 4E.3 — DONE / ACCEPTED

Blog Article inventory is integrated into shared sitemap/llms/static generation. Accepted zero-published-Article snapshot: 222 canonical URLs.

Evidence:

```text
pnpm test:blog-inventory -> 19/19 PASS
pnpm frontend -> PASS
pnpm verify:blog-inventory-static -> PASS
founder -> تایید
```

## 4E.4 — DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10

Accepted:

```text
blog.manage permission
/manage/blog + /fa/manage/blog
system-owned Article id/timestamps/editorial author
editor-owned slug/status/content
EN/FA authoring + derived locale states
canonical validation
managed Hero selection
Link modal + Gallery image insertion
shared safe Markdown preview
Prompt Draft el-* / theme-first UI
```

Final evidence:

```text
pnpm test:blog-manage -> 46/46 PASS
founder functional behavior/UI verification -> PASS
founder -> تایید
```

## 4E.5 — DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED 2026-09-10

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

Accepted lanes:

```text
Media Lane           -> DONE / FOUNDER VERIFIED / ACCEPTED
Git Publication Lane -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.5 overall         -> DONE / ACCEPTED
```

Accepted media includes shared Arvan/S3 authority, `blog/` namespace, Gallery browsing/upload, persisted alt metadata, legacy manifest compatibility, admin audit, Hero + Markdown integration and no base64 Markdown.

Accepted Git publication includes server-only Git configuration, canonical Git management reads, fail-closed configured reads, strict editor-owned write input, server-owned identity/timestamps/author, atomic Git tree+commit+non-force ref update, optimistic Article versioning, guarded ref-race retry, backend audit receipt and deployment-local public Blog runtime.

Verification evidence includes:

```text
focused Blog publication/manage suites -> PASS
pnpm api -> PASS
pnpm frontend -> PASS
real Save Draft -> PASS
real Draft update -> PASS
stale two-tab write -> CONFLICT / no overwrite
first Publish -> PASS / publishedAt assigned
published update -> PASS / publishedAt preserved / updatedAt advanced
auditRecorded -> true
public route before rebuild -> 404 / deployment-lag contract PASS
unpublish -> PASS / publishedAt preserved
```

The temporary smoke Article was removed from the canonical branch after verification and before any subsequent rebuild.

Real Git token must never be pasted into chat or committed.

## 4E.6 — NEXT

Aggregate Blog/public/staging/static acceptance begins now that 4E.5 is accepted.

Target:

```text
accepted 4A–4D regressions
all Blog contract/public/inventory/manage/media/publication regressions
positive published Article SSR fixture
404/canonical/localization checks
structured data + hreflang
sitemap/llms parity
Manage authorization
Git publication regression proof
static generation
external staging noindex verification
explicit founder acceptance
```

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
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Resume instruction

```text
1. read STATUS.md
2. read DEVELOPMENT_WORKFLOW.md + UI_IMPLEMENTATION_GUIDELINES.md
3. read MILESTONE_21_5_PHASE4E_BLOG_V1.md
4. read 4E.1 through 4E.5 records
5. inspect latest feature/growth-foundation HEAD
6. confirm 4E.1-4E.5 are ACCEPTED
7. current task = 4E.6 aggregate Blog/public/staging/static acceptance
8. use time-first verification and smallest rebuild scope
9. keep grassic.ir noindex and prompt-draft.ir untouched
10. do not close Phase 4E without explicit founder acceptance of 4E.6
```
