# Milestone 21.5 — Phase 4E Blog V1

Status: **IN PROGRESS / 4E.1–4E.4 ACCEPTED / 4E.5 MEDIA ACCEPTED + GIT PUBLICATION IMPLEMENTED / VERIFICATION PENDING**

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

## 4E.1 — DONE / ACCEPTED

Canonical package:

```text
content/blog/<articleId>/
  article.json
  en.md
  fa.md
```

Public locale eligibility is derived from `published` status plus complete localized title, description and non-empty body. V1 public author is explicit editorial/site identity. Shared Markdown escapes raw HTML and rejects unsafe active URL schemes.

Evidence:

```text
pnpm test:blog-contract -> 18/18 PASS
pnpm frontend -> PASS
founder -> تایید
```

## 4E.2 — DONE / ACCEPTED

Accepted public behavior includes SSR EN/FA Blog index/detail, real 404/canonical slug semantics, safe Markdown, CollectionPage/ItemList and BlogPosting JSON-LD, OG/Twitter metadata, Article.availableLocales-driven hreflang and staging noindex preservation.

Evidence:

```text
pnpm test:blog-public -> 26/26 PASS
pnpm frontend -> PASS
pnpm smoke:blog-public -> PASS
founder -> تایید
```

## 4E.3 — DONE / ACCEPTED

Article inventory is integrated into the shared public URL inventory, sitemap, llms and legacy static generator. Accepted zero-published-Article snapshot was 222 canonical URLs (`historical 220 + /blog + /fa/blog`).

Evidence:

```text
pnpm test:blog-inventory -> 19/19 PASS
pnpm frontend -> PASS
pnpm verify:blog-inventory-static -> PASS
founder -> تایید
```

## 4E.4 — DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10

Accepted Blog management contracts:

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
```

4E.4 was deliberately accepted as the read + author + validate slice; canonical Git writes belong to 4E.5.

Final founder evidence:

```text
pnpm test:blog-manage -> 46/46 PASS
functional authoring/editor/context-menu/UI behavior -> founder verified
founder -> تایید
```

## 4E.5 — CURRENT

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

Current state:

```text
Media Lane            -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
Git Publication Lane  -> IMPLEMENTED / VERIFICATION PENDING
4E.5 overall          -> IN PROGRESS / NOT ACCEPTED
```

### Accepted Media direction

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

### Implemented Git publication direction

```text
server-only BLOG_GITHUB_* configuration
management reads canonical Git when configured
configured Git failure -> fail closed, no stale fallback
POST /api/manage/blog
PUT /api/manage/blog/:id
browser sends editor-owned state + expectedVersion only
server owns id / author / timestamps
whole repository validated before mutation
one Git tree + one commit + force=false ref update
stable SHA-256 Article version
stale Article write -> conflict
unrelated branch movement -> one guarded retry
backend actor audit receipt after successful Git commit
public Blog remains deploy-local and does not live-query Git
```

A Git write is canonical immediately in Git, but the public runtime reflects it only after the next deployment/build containing that commit. This is an intentional consequence of the accepted no-request-time-GitHub architecture.

Focused verification now begins with:

```powershell
pnpm test:blog-publish
pnpm test:blog-manage
```

If both pass, the smallest changed-service rebuild is:

```powershell
pnpm api
pnpm frontend
```

No full `pnpm stack` by default.

4E.5 must not be accepted until real canonical Git Save/Publish/conflict behavior and explicit founder acceptance are proven.

## 4E.6 — NOT STARTED

Final target includes accepted 4A–4D regressions, all Blog contract/public/inventory/manage/media/publication regressions, positive published Article SSR, 404/canonical/localization, structured data, sitemap/llms parity, Manage authorization, Git publication proof, static generation and external staging noindex verification.

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

## Current next action

```text
1. pnpm test:blog-publish
2. pnpm test:blog-manage
3. if green -> pnpm api
4. pnpm frontend
5. founder canonical Git Save Draft / Update / Publish / stale-conflict runtime verification
6. explicit founder acceptance
7. only then start 4E.6
```
