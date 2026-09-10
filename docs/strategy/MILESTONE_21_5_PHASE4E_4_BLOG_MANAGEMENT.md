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

## 1. Purpose

4E.4 introduces a permissioned Blog authoring workspace without creating a temporary canonical content store before the Git publication adapter exists.

Target route:

```text
/manage/blog
/fa/manage/blog
```

The route remains an application/private noindex surface through the inherited `/manage/**` policy.

## 2. Authorization contract

New explicit permission:

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

`app/config/manage.ts` registers Blog as its own Manage section. It does not reuse Archive/System permissions.

### server-side enforcement

Nitro management endpoints do not trust client middleware alone.

Every request:

```text
Authorization: Bearer ...
-> Nitro server/utils/blogManageAuthorization.ts
-> backend GET /api/auth/me
-> require blog.manage or *
-> fail closed on 401 / 403 / invalid upstream / unavailable upstream
```

Admin repository endpoints:

```text
GET /api/manage/blog
GET /api/manage/blog/:id
```

Responses are `Cache-Control: no-store`.

## 3. Repository read model

Management reads the same deployed repository consumed by public Blog:

```text
content/blog in Git
-> Nitro assets:blog
-> loadBlogRepository()
```

The list exposes repository Article summaries, including draft entries, only after `blog.manage` authorization.

Detail loads one canonical Article by stable Article id, not public slug.

No GitHub request is performed at runtime.

## 4. Authoring workspace

`app/pages/manage/blog.vue` provides:

```text
repository Article list
new Article authoring state
edit existing Article state
stable Article id
public slug
status draft/published
publishedAt / updatedAt
editorial author name + public URL
hero URL / thumbnail / dimensions
EN metadata + body + alt
FA metadata + body + alt
live public-safe Markdown preview
validation result + exact contract issues
```

Existing Article ids are immutable in the editor because directory identity is stable independently of slug.

### component-first UI hardening

Founder review exposed that the initial 4E.4 implementation recreated a local native form/styling system instead of following accepted `/manage/archive` and `/manage/users` patterns.

The authoring surface was rewritten under the project-wide `UI_IMPLEMENTATION_GUIDELINES.md` contract.

`app/pages/manage/blog.vue` now uses the Prompt Draft component system for the complete page surface:

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

The page no longer owns native form controls or page-local scoped CSS.

Neutral/theme behavior comes from component defaults and semantic props:

```text
surface
normal / normalXX
normal15 borders
prim actions
green published/success
orange draft
red errors
```

No screenshot-derived white/black styling is permitted.

Focused source regression now requires:

```text
no native input/textarea/select/button/label/section/etc. in manage/blog.vue
no scoped style block in manage/blog.vue
Prompt Draft el form/action/layout primitives present
no hardcoded white/black neutral styling
```

## 5. Markdown editor decision

4E.4 intentionally adds no new Markdown/editor dependency.

The local Markdown authoring component remains:

```text
app/components/manage/ManageBlogMarkdownEditor.vue
```

Its controls now also use the Prompt Draft component system:

```text
format toolbar -> el-button
Markdown body  -> el-text-field type="textarea"
panes/layout   -> el-flex + el-grid
labels/state   -> el-text
```

The only native element intentionally retained is the sanitized `v-html` render sink used to mount already-rendered preview HTML. It is not a form control or styling primitive.

Scoped CSS in this component is limited to structural preview behavior that is not represented by ordinary component props/utilities:

```text
preview minimum height
responsive two-pane -> one-pane geometry
rendered Markdown img/pre presentation
```

Live preview calls:

```text
renderPublicBlogMarkdown
-> renderPublicMarkdown
```

Therefore editor preview and public Article rendering use the same accepted safe renderer.

The `md-editor-v3` candidate remains deferred: it is not required to satisfy 4E.4 and adding it would introduce a new dependency/renderer surface before publication/media integration is necessary.

## 6. Canonical Article validation

Client editor state is adapted by:

```text
app/utils/manageBlogDraft.ts
```

Validation calls the accepted 4E.1 authority directly:

```text
validateBlogArticlePackage
```

The editor does not recreate:

```text
slug rules
locale eligibility
published locale derivation
hero URL rules
Markdown unsafe-protocol rules
timestamp rules
```

`Article.availableLocales` shown in the editor is derived only from a successful canonical validation.

### Nitro app-graph hardening

Founder verification exposed a Nitro bundle failure after Vite SSR compilation:

```text
RollupError: Could not resolve "../shared/blog-article.ts"
from generated server Blog chunk
```

Cause:

```text
app/utils/manageBlogDraft.ts
-> runtime import ../../shared/blog-article
-> Vite SSR chunk retained a relative path outside the Nuxt app graph
-> Nitro later resolved that relative path from .nuxt/dist/server/_nuxt and failed
```

The accepted 4D Discovery pattern is reused:

```text
app/shared/blog-article.ts -> authoritative Blog Article contract for Nuxt app/runtime graph
shared/blog-article.ts     -> thin re-export shim for root scripts/server consumers
```

`app/utils/manageBlogDraft.ts` imports through:

```text
../shared/blog-article
```

This path remains inside the Nuxt app graph while also resolving under standalone `tsx` tests. Page code may use the equivalent Nuxt alias form where standalone Node resolution is not involved.

No Blog validation policy changed. This is build-graph hardening only.

Focused source coverage guards both Nitro app-graph safety and standalone-test resolvability.

## 7. Deliberate write boundary

4E.4 is read + author + validate only.

It intentionally does **not** implement:

```text
POST /api/manage/blog
PUT /api/manage/blog/:id
DELETE /api/manage/blog/:id
Git commit/write
canonical save
canonical publish
Arvan media upload
```

Reason:

```text
Git is the accepted canonical editorial source.
The Git publication/reconciliation adapter belongs to 4E.5.
A temporary container filesystem/database/editor-state source would violate the accepted architecture.
```

The UI explicitly communicates this boundary.

## 8. Localization

Fragments:

```text
i18n/locales/manage-blog.en.ts
i18n/locales/manage-blog.fa.ts
```

Registered in `i18n/i18n.config.ts`.

Manage section, authoring workflow, list count, Markdown labels, preview state and toolbar tooltips are bilingual.

## 9. Focused tests

Root command:

```powershell
pnpm test:blog-manage
```

Coverage includes:

```text
backend role permission grants
Nitro auth boundary 401/403/502/fail-closed behavior
frontend/backend permission parity
Manage section registration
page authorization middleware
Nitro management endpoint authorization ownership
canonical Article draft adapter
published locale derivation
unsafe Markdown rejection
existing Article edit projection
safe public Markdown preview reuse
EN/FA management localization registration
Nuxt app-graph Blog contract import guard
component-first Manage UI guard
native-form-control exclusion
near-zero page CSS guard
theme-token/no-hardcoded-white-black guard
absence of write endpoints in 4E.4
4E.1 Blog contract + public Markdown regression
```

## 10. Service verification scope

4E.4 originally changed both services:

```text
backend -> permission resolution
frontend -> Manage UI + Nitro admin endpoints + localization
```

Founder already verified the backend build successfully and direct unauthenticated Nitro Blog access returned:

```text
401
```

Founder also verified the Nitro import-path fixes through a successful frontend Docker build before the component-first UI rewrite.

The latest changes are frontend/test/i18n/documentation only. Therefore the smallest remaining verification scope is:

```powershell
pnpm test:blog-manage
pnpm frontend
```

Do not rebuild API or the full stack for this UI hardening.

After frontend succeeds, founder UI smoke must cover both Light and Dark themes:

```text
admin account sees Blog Manage section
/manage/blog loads
/fa/manage/blog loads
repository list/empty state loads
New article opens
all fields use Prompt Draft el controls
status dropdown uses project dropdown component
EN/FA tabs work
Markdown toolbar uses project buttons
Markdown body uses project text-field component
Markdown preview renders
invalid package shows validator issues
complete draft validates successfully
no canonical save/publish action is presented yet
no fixed white/black regression in either theme
```

## 11. Current state

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> DONE / ACCEPTED
4E.3 -> DONE / ACCEPTED
4E.4 -> IMPLEMENTED / FOUNDER VERIFICATION IN PROGRESS / NOT ACCEPTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```

Do not mark 4E.4 accepted until focused tests, frontend build, founder Light/Dark UI smoke and explicit founder acceptance are complete.
