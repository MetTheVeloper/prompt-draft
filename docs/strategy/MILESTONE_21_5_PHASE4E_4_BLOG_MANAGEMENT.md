# Milestone 21.5 — Phase 4E.4 Blog Management Permission + Authoring UI

Status: **IMPLEMENTED / FOUNDER VERIFICATION IN PROGRESS / NOT ACCEPTED**

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

Companion media record:

```text
docs/strategy/MILESTONE_21_5_PHASE4E_5_BLOG_MEDIA_PUBLISH.md
```

## 1. Purpose

4E.4 provides the permissioned Blog authoring workspace while Git remains the only canonical editorial source.

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

Mirrored catalogs:

```text
backend/src/authorization.mjs
app/config/authorization.ts
```

Role behavior:

```text
user        -> no blog.manage
admin       -> blog.manage
super_admin -> wildcard *
```

Nitro repository endpoints:

```text
GET /api/manage/blog
GET /api/manage/blog/:id
```

Every request revalidates its bearer token through backend `/api/auth/me`, requires `blog.manage` or wildcard, and fails closed.

Responses are `Cache-Control: no-store`.

## 3. Repository read model

```text
content/blog in Git
-> Nitro assets:blog
-> loadBlogRepository()
```

Management may read repository drafts only after authorization. Detail lookup uses stable Article id, not public slug. Public Blog requests never query GitHub.

## 4. Final authoring ownership contract

Founder review locked the following ownership rules:

```text
Article id    -> system-owned / immutable
publishedAt   -> system-owned
updatedAt     -> system-owned
public slug   -> editor-owned
status        -> editor-owned
public locales -> derived, never edited directly
public author -> V1 system editorial identity (Prompt Draft)
admin actor   -> internal authorization/audit identity, not public author metadata
```

The manual Editorial Identity form was removed.

`Public Locales` is no longer a disabled form field. EN/FA tabs surface derived states:

```text
Incomplete
Complete
Public
```

## 5. Prompt Draft UI-system contract

The entire Manage Blog UI follows:

```text
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
```

Main primitives:

```text
el-flex
el-grid
el-text
el-icon
el-button
el-text-field
el-dropdown
el-divider
```

No page-local native form system is allowed. Native DOM elements remain only when required as browser/render capability sinks, such as sanitized `v-html`, image rendering, or the hidden file picker used by Media Gallery.

Neutral styling comes from project component defaults and semantic theme tokens. Screenshot pixels are never treated as color authority.

The Repository Metadata panel uses:

```text
rules="css"
```

so its content aligns to the start/top of its layout contract.

## 6. Hero Media

Hero no longer exposes manual full URL, thumbnail URL, width, or height inputs.

It uses the reusable managed Gallery implemented in the 4E.5 media lane:

```text
Gallery asset
-> fullUrl
-> thumbnailUrl
-> width
-> height
-> Hero preview
```

Localized Hero alt remains Article-context metadata and is authored separately for EN/FA.

## 7. Markdown editor

No new Markdown dependency was added.

```text
app/components/manage/ManageBlogMarkdownEditor.vue
```

uses the Prompt Draft component system for toolbar, textarea, layout, labels and actions.

Live preview remains:

```text
renderPublicBlogMarkdown
-> renderPublicMarkdown
```

so editor preview and public Article rendering share the accepted safe renderer.

### Link workflow

The Link toolbar action opens the global modal system, collects label + URL, and validates URL through the same public-safe Blog URL contract instead of inserting a placeholder URL.

### Image workflow

The Image toolbar action uses the managed Gallery from 4E.5:

```text
Gallery
-> selected managed image
-> image preview + persisted default alt modal
-> editable contextual alt
-> real fullUrl inserted into Markdown
```

Selected editor text may override the default alt prefill for that insertion only.

### Preview layout

Both Markdown source and Preview panes align to the start/top of their shared grid track.

Preview text uses:

```text
var(--normalText)
```

Rendered images are constrained without distortion:

```text
max-width: min(100%, 400px)
max-height: 400px
width: auto
height: auto
object-fit: contain
```

## 8. Canonical Article validation

Editor state adapter:

```text
app/utils/manageBlogDraft.ts
```

Validation authority:

```text
validateBlogArticlePackage
```

The editor does not recreate slug, locale, publication, Hero, Markdown safety, or timestamp policy.

The accepted Nuxt app-graph hardening remains:

```text
app/shared/blog-article.ts -> Nuxt/runtime authority
shared/blog-article.ts     -> root re-export shim
app/utils/manageBlogDraft.ts -> ../shared/blog-article
```

This path works in Nitro bundling and standalone `tsx` tests.

## 9. Canonical write boundary

4E.4 still does not implement canonical Article writes:

```text
POST /api/manage/blog
PUT /api/manage/blog/:id
DELETE /api/manage/blog/:id
Git Article commit/write
Save draft
Publish Article
```

Managed media exists in the 4E.5 media lane, but media storage does not make editor state canonical.

Git publication/reconciliation remains pending in 4E.5.

## 10. Focused tests

Root command:

```powershell
pnpm test:blog-manage
```

Coverage includes permission parity, server-side auth, Article draft adapter, canonical validation, public-safe preview reuse, EN/FA localization, Nuxt app-graph safety, component-first UI rules, no raw editable system identity/timestamps, global Link workflow, top-aligned/theme-aware preview, read-only canonical boundary and previous 4E.1 regressions.

Founder previously reached:

```text
43/43 PASS
```

before the latest combined media/UI finalization. Therefore the focused command must be rerun once more with the final source.

## 11. Combined verification scope

Latest finalization changes both frontend and backend through the companion 4E.5 media lane.

Run:

```powershell
pnpm test:blog-manage
pnpm test:blog-media
```

If both pass:

```powershell
pnpm api
pnpm frontend
```

Do not run `pnpm stack` unless a concrete later gate requires it.

Founder UI smoke must cover EN/FA plus Light/Dark and verify:

```text
Repository Metadata start alignment
system-owned Article id/timestamps remain non-editable
no manual Editorial Identity section
locale states near EN/FA tabs
Hero Gallery flow
Link modal
Image Gallery -> image/alt modal -> Markdown insertion
source + Preview top alignment
400px Preview image constraints
canonical validation
no canonical Article save/publish action yet
no fixed white/black theme regression
```

## 12. Current state

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> DONE / ACCEPTED
4E.3 -> DONE / ACCEPTED
4E.4 -> IMPLEMENTED / VERIFICATION IN PROGRESS / NOT ACCEPTED
4E.5 media lane -> IMPLEMENTED / VERIFICATION PENDING
4E.5 Git publication lane -> NOT STARTED
4E.6 -> NOT STARTED
```

Do not mark 4E.4 accepted until final focused tests, required builds, founder UI smoke and explicit founder acceptance are complete.
