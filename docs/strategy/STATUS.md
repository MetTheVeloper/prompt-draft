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
  4E Blog V1                                    -> REOPENED / 4E.1-4E.6 ACCEPTED / 4E.7 UI VERIFICATION NEXT
  4F Integration / Legacy Retirement            -> BLOCKED UNTIL 4E.7 ACCEPTANCE
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

# Phase 4E Blog V1 — REOPENED FOR FINAL UI ADDENDUM

Editorial architecture remains:

```text
Git repository          -> canonical editorial source
Nuxt/Nitro deployed app -> normal public runtime source
Arvan Object Storage    -> Blog media + explicit optional mirror/emergency role
```

Never query GitHub per public Blog request.

Accepted historical slices remain accepted:

```text
4E.1 Article Contract + Repository Loader -> DONE / ACCEPTED
4E.2 Public Blog SSR + SEO                 -> DONE / ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> DONE / ACCEPTED
4E.4 Blog Management Authoring             -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Blog Media + Git Publication          -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.6 Final Aggregate Acceptance            -> DONE / FOUNDER VERIFIED / ACCEPTED
```

Previously accepted aggregate evidence remains valid:

```text
pnpm test:phase4e-final    -> PASS
pnpm smoke:phase4e-final   -> PASS
pnpm verify:phase4e-static -> PASS
```

## 4E.7 — Shared Article Presentation — IMPLEMENTED / UI VERIFICATION NEXT

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_7_SHARED_ARTICLE_PRESENTATION.md
```

Founder-requested final presentation contract:

```text
Manage Markdown preview and public Blog detail share BlogArticlePresentation
existing safe Markdown renderer remains authoritative
heading hierarchy becomes open-by-default collapsible details/summary sections
shared themed typography for headings/body/lists/quotes/code/links/images
inline Article images preserve the accepted 400px cap
inline Article images open through the global modal lightbox on click/Enter/Space
public Hero uses the same image lightbox workflow
no second Markdown engine, sanitizer, modal system or theme vocabulary
```

This is frontend-only. Required verification is focused Blog regression plus `pnpm frontend`; no API or full-stack rebuild is required.

4F must not begin until founder UI verification and explicit 4E.7 acceptance.

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
3. read MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
4. read MILESTONE_21_5_PHASE4E_BLOG_V1.md + 4E.7 record
5. inspect latest feature/growth-foundation HEAD
6. confirm 4E.1-4E.6 remain DONE / ACCEPTED
7. current task = verify 4E.7 shared Article presentation
8. run focused Blog tests then pnpm frontend
9. founder checks EN/FA, Light/Dark, collapsible heading hierarchy and global image lightbox
10. only explicit founder acceptance re-closes 4E and unblocks 4F
```
