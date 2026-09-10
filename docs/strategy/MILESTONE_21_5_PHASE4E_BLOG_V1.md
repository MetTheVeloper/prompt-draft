# Milestone 21.5 — Phase 4E Blog V1

Status: **DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Parent:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Operational rules:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Accepted dependency:

```text
21.5.4D Sitemap / Robots / Discovery + AI Discovery -> DONE / ACCEPTED 2026-09-09
```

## Objective

4E adds a repository-backed bilingual Blog acquisition + editorial system without creating parallel SEO, indexability, authorization, localization, Markdown, media, or content-source architectures.

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

Locked source model:

```text
Git repository          -> canonical editorial source
Docker/Nitro deployment -> normal public runtime content source
Arvan Object Storage    -> managed Blog media + explicit optional emergency role
```

GitHub is never queried per public Blog request.

## Accepted slices

```text
4E.1 Article Contract + Repository Loader -> DONE / ACCEPTED
4E.2 Public Blog SSR + SEO                 -> DONE / ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> DONE / ACCEPTED
4E.4 Blog Management Authoring             -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Blog Media + Git Publication          -> DONE / FOUNDER RUNTIME VERIFIED / ACCEPTED
4E.6 Final Aggregate Acceptance            -> DONE / FOUNDER VERIFIED / ACCEPTED
```

## 4E.1 — Article contract

Canonical package:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Public locale eligibility is derived from `published` status plus complete localized title, description and non-empty body. V1 public author is explicit editorial/site identity. Shared Markdown escapes raw HTML and rejects unsafe active URL schemes.

## 4E.2 — Public Blog

Accepted public behavior includes SSR EN/FA Blog index/detail, real 404/canonical slug semantics, safe Markdown, CollectionPage/ItemList and BlogPosting JSON-LD, OG/Twitter metadata, Article.availableLocales-driven hreflang and staging noindex preservation.

## 4E.3 — Inventory / sitemap / llms

Article inventory is integrated into the shared public URL inventory, sitemap, llms and legacy static generator. Draft/unpublished URLs never enter public inventory and no fake locale is created.

## 4E.4 — Blog management authoring

Accepted management contracts:

```text
blog.manage permission
permission-gated /manage/blog authoring
system-owned immutable Article id
system-owned publishedAt / updatedAt
system editorial public author
editor-owned slug/status/content
EN/FA authoring + derived locale state
managed Hero media
safe Markdown preview
Link + Gallery image workflows
canonical Article validation
Prompt Draft el-* / theme-first UI
Markdown textarea auto-grow without contenteditable
context actions through el-text-field global menu pipeline
selection restore without scroll jump
```

Final founder evidence included `pnpm test:blog-manage -> 46/46 PASS` plus functional authoring/editor/context-menu/UI verification.

## 4E.5 — Media + canonical Git publication

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

Accepted Media direction:

```text
existing archiveStorage/SigV4 authority reused
blog/ namespace confinement
ListObjectsV2 Gallery browsing
managed full + thumbnail + JSON manifest
required persisted default alt on new uploads
legacy no-alt compatibility
blog.manage authorization + media audit
reusable MediaGallery
Hero + Markdown image integration
no base64 canonical Markdown
```

Accepted Git publication direction:

```text
server-only BLOG_GITHUB_* configuration
management reads canonical Git when configured
configured Git failure -> fail closed, no stale fallback
POST /api/manage/blog
PUT /api/manage/blog/:id
browser sends editor-owned state + expectedVersion only
server owns id / author / timestamps
whole repository validated before mutation
one Git tree + one commit + non-force ref update
stable SHA-256 Article version
stale Article write -> conflict
unrelated branch movement -> one guarded retry
backend actor audit receipt after successful Git commit
public Blog remains deploy-local and does not live-query Git
```

Runtime founder proof covered real Save Draft, update, first publish, published update, two-tab stale conflict, `auditRecorded=true`, deployment-lag 404 and unpublish. `publishedAt` was assigned once and preserved while `updatedAt` advanced. The temporary smoke Article was removed from the canonical branch before subsequent builds.

A Git write is canonical immediately in Git, but public runtime reflects it only after the next deployment/build containing that commit.

## 4E.6 — Final acceptance

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_6_FINAL_ACCEPTANCE.md
```

Final root gates:

```text
pnpm test:phase4e-final    -> PASS
pnpm smoke:phase4e-final   -> PASS
pnpm verify:phase4e-static -> PASS
```

Final aggregate Blog sub-suite evidence:

```text
Blog contract/runtime loader        -> 20/20 PASS
Public Blog SSR/SEO/projection      -> 28/28 PASS
Blog inventory/sitemap/llms         -> 19/19 PASS
Blog management                     -> 46/46 PASS
Blog media/Gallery                  -> 15/15 PASS
Git publication/audit               -> 14/14 PASS
```

The deterministic EN/FA published Article fixture prerendered successfully in both locales, joined sitemap + llms, emitted BlogPosting/canonical output and was removed in `finally`. `git status --short content/blog` was clean afterward.

The static acceptance pass also closed two legacy-static gaps: dynamic Blog Article routes are explicitly projected from the validated repository inventory, and legacy static prerender reads the same validated build-workspace Blog snapshot while normal Docker/Nitro runtime continues to read bundled `assets:blog`.

## Hard rules

```text
DO NOT weaken authorization.
DO NOT expose protected Prompt/private Draft/private account data.
DO NOT query GitHub per public Blog request.
DO NOT make Git + Arvan uncontrolled equal content sources.
DO NOT put base64 image payloads in Markdown.
DO NOT make editor state canonical.
DO NOT create fake localized Blog routes.
DO NOT expose draft/unpublished Article URLs in sitemap/llms.
DO NOT recreate Blog indexability outside the Article contract.
DO NOT let Blog SEO override staging noindex.
DO NOT expose BLOG_GITHUB_TOKEN through public runtime config.
DO NOT touch prompt-draft.ir before explicit rollout.
```

## Completion

```text
Phase 4E Blog V1 -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
Next -> Phase 4F Integration / Verification / Legacy Retirement
```

Follow-up Blog preview/presentation polish is intentionally independent and should not reopen accepted 4E contracts unless it changes public semantics.
