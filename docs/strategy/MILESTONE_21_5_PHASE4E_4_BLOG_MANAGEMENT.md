# Milestone 21.5 — Phase 4E.4 Blog Management Permission + Authoring UI

Status: **IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED**

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

## 5. Markdown editor decision

4E.4 intentionally adds no new Markdown/editor dependency.

A small local toolbar + textarea authoring component is used:

```text
app/components/manage/ManageBlogMarkdownEditor.vue
```

Live preview calls:

```text
renderPublicBlogMarkdown
-> renderPublicMarkdown
```

Therefore editor preview and public Article rendering use the same accepted safe renderer.

The `md-editor-v3` candidate was re-audited but deferred: it is not required to satisfy 4E.4 and adding it would introduce a new dependency/renderer surface before publication/media integration is necessary.

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

New fragments:

```text
i18n/locales/manage-blog.en.ts
i18n/locales/manage-blog.fa.ts
```

Registered in `i18n/i18n.config.ts`.

Manage section and authoring workflow are bilingual.

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
absence of write endpoints in 4E.4
4E.1 Blog contract + public Markdown regression
```

## 10. Service verification scope

4E.4 changes both services:

```text
backend -> permission resolution
frontend -> Manage UI + Nitro admin endpoints + localization
```

Verification order:

```powershell
pnpm test:blog-manage
pnpm api
pnpm frontend
```

Do not use `pnpm stack` unless a genuine cross-service problem requires it.

After both services are rebuilt, founder UI smoke:

```text
admin account sees Blog Manage section
/manage/blog loads
/fa/manage/blog loads
repository list/empty state loads
New article opens
EN/FA tabs work
Markdown preview renders
invalid package shows validator issues
complete draft validates successfully
no canonical save/publish action is presented yet
```

A non-authorized account must not receive Blog repository data; direct Nitro endpoint access must return 401/403.

## 11. Current state

```text
4E.1 -> DONE / ACCEPTED
4E.2 -> DONE / ACCEPTED
4E.3 -> DONE / ACCEPTED
4E.4 -> IMPLEMENTED / FOUNDER VERIFICATION PENDING / NOT ACCEPTED
4E.5 -> NOT STARTED
4E.6 -> NOT STARTED
```

Do not mark 4E.4 accepted until focused tests, both service builds, founder UI smoke and explicit founder acceptance are complete.
