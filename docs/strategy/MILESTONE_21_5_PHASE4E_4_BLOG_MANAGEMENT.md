# Milestone 21.5 — Phase 4E.4 Blog Management Permission + Authoring UI

Status: **DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Accepted dependencies:

```text
4E.1 Article Contract + Repository Loader       -> ACCEPTED
4E.2 Public Blog SSR + Markdown/SEO              -> ACCEPTED
4E.3 Shared Blog sitemap/llms/static inventory  -> ACCEPTED
```

Companion continuation:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

## 1. Accepted purpose

4E.4 establishes the permissioned Blog authoring workspace while Git remains the canonical editorial source.

Routes:

```text
/manage/blog
/fa/manage/blog
```

The inherited `/manage/**` noindex/application policy applies.

## 2. Authorization

Explicit permission:

```text
blog.manage
```

Role behavior:

```text
user        -> no blog.manage
admin       -> blog.manage
super_admin -> wildcard *
```

Management reads are server-authorized and fail closed. Public Blog requests never query GitHub.

## 3. Accepted authoring ownership contract

```text
Article id     -> system-owned / immutable
publishedAt    -> system-owned
updatedAt      -> system-owned
public slug    -> editor-owned
status         -> editor-owned
public locales -> derived, never edited directly
public author  -> V1 system editorial identity (Prompt Draft)
admin actor    -> internal authorization/audit identity, never public author metadata
```

The manual Editorial Identity form is intentionally absent. EN/FA tabs surface derived `Incomplete / Complete / Public` state.

## 4. Accepted UI/editor behavior

The authoring workspace follows `UI_IMPLEMENTATION_GUIDELINES.md` and the existing Prompt Draft `el-*` component/theme system.

Accepted behavior includes:

```text
repository Article list
new/edit Article state
system-owned id/timestamps displayed but not editable
editable slug/status
managed Hero selection
EN/FA title + description + localized Hero alt + Markdown body
shared safe Markdown live preview
canonical validation through validateBlogArticlePackage
global Link modal
managed Gallery image insertion
source + Preview top alignment
400px Preview image cap on either axis
Repository Metadata start alignment
Light/Dark theme-safe presentation
```

No new editor dependency or second Markdown engine was introduced.

## 5. Canonical write boundary at 4E.4 acceptance

4E.4 was deliberately accepted as the **read + author + validate** slice. Canonical Git writes were not a prerequisite for this acceptance and are owned by 4E.5.

That later slice may add:

```text
POST /api/manage/blog
PUT /api/manage/blog/:id
Save draft
Publish/update
Git commit/version conflict handling
```

without changing the accepted 4E.4 ownership/UI contracts above.

## 6. Founder verification evidence

Final focused verification supplied by founder:

```text
pnpm test:blog-manage -> 46/46 PASS
```

Founder also explicitly confirmed the relevant authoring/Markdown/context-menu/UI behavior had been functionally tested and was fully correct, then approved moving to the next phase.

Therefore:

```text
4E.4 -> DONE / FOUNDER VERIFIED / ACCEPTED 2026-09-10
```

Future 4E.5 changes must preserve this accepted regression surface.
