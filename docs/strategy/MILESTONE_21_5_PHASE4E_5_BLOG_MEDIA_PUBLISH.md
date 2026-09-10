# Milestone 21.5 — Phase 4E.5 Blog Media + Git Publication

Status: **IN PROGRESS / MEDIA LANE DONE + ACCEPTED / GIT PUBLICATION FOCUSED + BUILD VERIFIED / RUNTIME PROOF NEXT / NOT ACCEPTED**

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

Lane A is founder-verified and accepted. Lane B is implemented, focused-test verified and Docker build verified. Real canonical Git runtime proof remains before 4E.5 can be accepted.

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

Founder explicitly confirmed the finalized behavior was fully tested and correct on 2026-09-10.

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

The real token belongs only in local/deployment secret environment and must never be committed or exposed via `NUXT_PUBLIC_*`.

### 3.2 Management repository source

When Git publication is configured:

```text
/manage Blog read
-> canonical Git branch
-> validate whole content/blog repository
-> Article list/detail + Article version
```

Configured Git failures fail closed. Management must not silently fall back to a stale deployed snapshot.

When Git publication is intentionally not configured, deployed bundled content may still be read for authoring/validation, but writes remain disabled.

### 3.3 Write API

```text
POST /api/manage/blog
PUT  /api/manage/blog/:id
```

Both require `blog.manage` through the accepted Nitro authorization boundary.

Browser-owned input is limited to:

```text
expectedVersion
slug
status
hero
localizations
body
```

Server-owned fields remain:

```text
id
author
publishedAt
updatedAt
```

### 3.4 Identity + timestamps

New Article id is deterministically derived from the initial slug and collision-resolved (`-2`, `-3`, ...). After creation the repository directory/id is immutable.

Server rules:

```text
updatedAt   -> assigned on every canonical save
publishedAt -> assigned on first publish only, then preserved
public author -> Prompt Draft editorial identity
```

The resulting Article package is validated through the accepted Article/repository validators before Git mutation.

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

Existing-Article writes require the version returned when the Article was loaded. If the Article changed meanwhile, save returns conflict and does not overwrite newer content.

If only the branch moved between read and ref update, the writer re-reads once and retries. The Article version guard runs again after that re-read. Repeated branch movement fails closed.

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

Backend resolves the authenticated admin actor, requires `blog.manage`, and records `blog.article.create|update|publish|unpublish` in `admin_audit_log`.

Git commit and DB audit are not one distributed transaction. A successful Git commit is never falsely reported as failed merely because the secondary audit insert failed; the response exposes `auditRecorded=false` instead.

## 4. Management UX

The accepted 4E.4 authoring UI now exposes one state-driven canonical action:

```text
Draft                -> Save draft
First published save -> Publish article
Published Article    -> Update article
```

Local canonical validation runs before write. Successful saves replace editor state with the server-returned canonical Article/version and display the short commit SHA plus the explicit deployment-lag message.

Conflict errors instruct the editor to reload rather than overwrite remote changes.

## 5. Verification evidence — 2026-09-10

Founder-local focused verification:

```text
pnpm test:blog-publish -> 13/13 PASS
pnpm test:blog-manage  -> 46/46 PASS
```

Required service rebuilds:

```text
pnpm api      -> PASS / container started
pnpm frontend -> PASS / Nuxt + Nitro production build complete / container started
```

The existing duplicate-auto-import and chunk-size notices remain warnings and did not fail the build.

This closes the focused-test + build preflight. No additional rebuild is required before configuring runtime Git credentials unless runtime source changes.

## 6. Founder runtime verification — NEXT

With a real GitHub token stored only in local `.env`, verify in order:

```text
/manage/blog reports canonical Git/write-ready state
Save Draft creates exactly one canonical Git commit and stable Article id
second Draft save preserves id and advances updatedAt/version
first Publish assigns publishedAt
later published update preserves publishedAt
two-tab stale save returns conflict instead of overwriting
Git Article directory contains valid article.json + locale body files
audit receipt is recorded for authenticated actor
public Blog remains unchanged until a deployment/build includes the Git commit
```

For a temporary smoke Article, do not rebuild frontend after publishing it until the temporary Article is removed/reverted from the canonical branch. This prevents the test Article from entering deployed public Blog assets.

## 7. Deferred/non-blocking V1 option

Explicit emergency Arvan editorial publication metadata remains optional and is not implemented in this slice. Arvan remains media infrastructure and must not become an uncontrolled equal content source.

## 8. Current state

```text
4E.4 -> DONE / ACCEPTED
4E.5 media lane -> DONE / FOUNDER VERIFIED / ACCEPTED
4E.5 Git publication lane -> IMPLEMENTED / FOCUSED + BUILD VERIFIED / RUNTIME PROOF NEXT
4E.5 overall -> IN PROGRESS / NOT ACCEPTED
4E.6 -> NOT STARTED
```

Do not mark 4E.5 overall accepted until real canonical Git Save/Update/Publish/conflict/audit behavior is founder-verified and explicitly accepted.
