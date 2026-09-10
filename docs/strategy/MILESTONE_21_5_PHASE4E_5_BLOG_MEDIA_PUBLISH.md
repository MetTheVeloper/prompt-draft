# Milestone 21.5 — Phase 4E.5 Blog Media + Git Publication

Status: **IN PROGRESS / MEDIA LANE DONE + ACCEPTED / GIT PUBLICATION IMPLEMENTED + VERIFICATION PENDING / NOT ACCEPTED**

Date: 2026-09-10

Branch:

```text
feature/growth-foundation
```

Accepted dependencies:

```text
4E.1 Article Contract + Repository Loader -> ACCEPTED
4E.2 Public Blog SSR + SEO                 -> ACCEPTED
4E.3 Blog Inventory / Sitemap / llms       -> ACCEPTED
4E.4 Blog Management Authoring             -> ACCEPTED 2026-09-10
```

## 1. Purpose

4E.5 connects the accepted Blog authoring surface to durable managed media and canonical Git save/publish without introducing a second editorial authority.

```text
Lane A -> managed Blog media on existing Arvan/S3 authority
Lane B -> canonical Git save/publish + optimistic reconciliation
```

Lane A is founder-verified and accepted. Lane B is implemented but must still pass focused/build/runtime verification before 4E.5 can be accepted.

## 2. Lane A — Managed Blog Media — ACCEPTED

Blog media reuses the existing Archive Object Storage/SigV4 implementation and remains confined below:

```text
blog/
```

Managed layout:

```text
blog/YYYY/MM/<uuid>.full.webp
blog/YYYY/MM/<uuid>.thumb.webp
blog/YYYY/MM/<uuid>.json
```

Accepted behavior includes ListObjectsV2 browsing, required persisted default alt for new uploads, legacy no-alt manifest compatibility, `blog.manage` authorization, `blog.media.upload` admin audit, reusable MediaGallery, Hero selection, Markdown Gallery insertion, selection toggle, theme-safe component-system UI, top-aligned authoring panes and 400px preview image limits.

Founder explicitly confirmed the finalized behavior was fully tested and correct on 2026-09-10. Media changes remain protected by `pnpm test:blog-media` and the accepted 4E.4 regression surface.

## 3. Lane B — Canonical Git Publication — IMPLEMENTED

Canonical editorial authority remains:

```text
Git repository
```

Normal public serving remains:

```text
content/blog in Git
-> build/deploy
-> Nitro bundled assets:blog
-> request-time public SSR
```

**Public Blog never queries GitHub per request.** A successful management Git save does not become public until the next deployment/build containing that Git commit.

### 3.1 Server-only Git configuration

Frontend/Nitro management runtime receives:

```text
BLOG_GITHUB_TOKEN
BLOG_GITHUB_REPOSITORY
BLOG_GITHUB_BRANCH
```

Defaults for this development branch are represented in Compose/example config, while the real token belongs only in local/deployment secret environment and must never be committed or exposed via `NUXT_PUBLIC_*`.

### 3.2 Management repository source

When Git publication is configured:

```text
/manage Blog read
-> canonical Git branch
-> validate whole content/blog repository
-> Article list/detail + Article version
```

Configured Git failures fail closed. Management must **not** silently fall back to a potentially stale deployed snapshot.

When Git publication is intentionally not configured, deployed bundled content may still be read for the authoring/validation UI, but writes remain disabled.

### 3.3 Write API

```text
POST /api/manage/blog
PUT  /api/manage/blog/:id
```

Both require `blog.manage` through the accepted Nitro authorization boundary.

The browser may submit only editor-owned state plus optimistic version:

```text
expectedVersion
slug
status
hero
localizations
body
```

It cannot author:

```text
id
author
publishedAt
updatedAt
```

Those remain server-owned.

### 3.4 Identity + timestamps

New Article id is deterministically derived from the initial slug and collision-resolved (`-2`, `-3`, ...). After creation the repository directory/id is immutable.

Server rules:

```text
updatedAt   -> assigned on every canonical save
publishedAt -> assigned on first publish only, then preserved
public author -> Prompt Draft editorial identity
```

The full resulting Article package is validated through the accepted Article/repository validators before Git mutation.

### 3.5 Atomic Git mutation

One Article save uses Git Data API semantics:

```text
read branch HEAD + tree
-> build Article tree entries
-> POST one Git tree using base_tree
-> POST one Git commit
-> PATCH branch ref with force=false
```

`article.json`, `en.md`, and `fa.md` therefore advance under one commit rather than independent file commits. Removing a locale body is represented as a tree deletion in that same commit.

### 3.6 Optimistic conflict/reconciliation

Article version is a deterministic SHA-256 projection of that Article's canonical repository files.

Existing-Article writes require the version returned when the Article was loaded. If the Article changed meanwhile, save returns conflict and does not overwrite the newer content.

If only the branch moved between read and ref update, the writer re-reads once and retries. The Article version guard runs again after that re-read, so unrelated branch motion can recover while target-Article motion still conflicts.

Current implementation intentionally supports a single retry; repeated branch movement fails closed.

### 3.7 Audit receipt

After a successful Git write, Nitro forwards a small authenticated receipt to backend:

```text
POST /api/admin/blog/publication-audit
```

Receipt contains only:

```text
action
articleId
slug
status
commitSha
branch
```

Backend resolves the real authenticated admin actor, requires `blog.manage`, and records `blog.article.create|update|publish|unpublish` in `admin_audit_log`.

Git commit and DB audit are not one distributed transaction. Therefore a successful Git commit is never falsely reported as a failed save merely because the secondary audit insertion failed; the response exposes `auditRecorded=false` so the condition remains visible without encouraging duplicate Git retries.

## 4. Management UX

The accepted 4E.4 authoring UI now exposes one state-driven canonical action:

```text
Draft                -> Save draft
First published save -> Publish article
Published Article    -> Update article
```

Local canonical validation runs before write. Successful saves replace editor state with the server-returned canonical Article/version and display the short commit SHA plus the explicit deployment-lag message.

Conflict errors instruct the editor to reload rather than overwrite remote changes.

## 5. Focused verification

New root command:

```powershell
pnpm test:blog-publish
```

It covers:

```text
strict audit receipt contract
server-only Git credentials
public runtime GitHub isolation
configured-management fail-closed behavior
atomic tree/commit/ref writer
server-owned metadata
identity collision handling
Article versioning
branch-race retry
management write/API/UI source contracts
```

Because the Git lane also changed accepted Blog management UI/composable contracts, rerun:

```powershell
pnpm test:blog-manage
```

The already accepted Media implementation itself did not change in this lane, so `pnpm test:blog-media` can return at the 4E.6 aggregate gate unless a media-specific regression appears.

## 6. Smallest rebuild after focused tests

This lane changed both runtime services:

```text
backend/src/adminBlogPublicationAudit* + adminArchiveRoute -> API image
server/** + app/** + i18n/** + Compose Git env wiring        -> frontend/Nitro image
```

After focused tests pass:

```powershell
pnpm api
pnpm frontend
```

Do **not** run `pnpm stack` by default.

## 7. Founder runtime verification target

With the real Git token stored only in local `.env`, verify:

```text
/manage/blog reads canonical Git and reports Git/write-ready state
Save Draft creates one canonical Git commit and stable Article id
second save preserves id and advances updatedAt/version
first Publish assigns publishedAt
later published updates preserve publishedAt
two-tab stale save conflicts instead of overwriting
Git Article directory contains valid article.json + locale bodies
audit log records authenticated actor + small receipt metadata
public Blog does not change until deployment includes the Git commit
```

For a local positive public proof after an Article publish, first pull the Git commit created by the application, then rebuild frontend; otherwise the host working tree/image is intentionally still on the older deployment snapshot.

## 8. Deferred/non-blocking V1 option

Explicit emergency Arvan editorial publication metadata remains optional and is **not implemented** in this slice. Arvan remains media infrastructure and must not become an uncontrolled equal content source.

## 9. Current state

```text
4E.4 -> DONE / ACCEPTED
4E.5 media lane -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Git publication lane -> IMPLEMENTED / VERIFICATION PENDING
4E.5 overall -> IN PROGRESS / NOT ACCEPTED
4E.6 -> NOT STARTED
```

Do not mark 4E.5 overall accepted until focused tests, required service builds, real canonical Git runtime proof, and explicit founder acceptance are complete.
