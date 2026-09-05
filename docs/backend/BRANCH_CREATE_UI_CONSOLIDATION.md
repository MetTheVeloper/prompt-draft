# Branch Closure — Create UI Consolidation

Status: `DONE / LOCALLY VERIFIED`

Originally implemented on: `feature/create-ui-consolidation`
Integrated target: `feature/docker-local-api`
Base implementation checkpoint: `4c67b045abead7e2eb3d7cdc29865859a86ecf6b`

## Goal

Close the deferred UI/API-projection polish that followed the backend/Docker milestone series, without reopening the verified backend architecture.

The pass focused on `/create`, Manage Users, Manage Archive, and the admin user-detail read model.

## `/create` consolidation

Verified final action hierarchy:

```text
visible primary controls
  Drafts
  Cloud Save / Sync
  Public / Private visibility

secondary Global Menu (`⋮`)
  Share
  Download
  Manage previews
  Delete
```

Visibility is changed with the existing Draft visibility API through an `el-switch`.

The page does not create a second preview-management implementation. It reuses the established `DraftPreviewManagerModal` from the `/user` Draft workflow.

### Cloud metadata behavior

The active local Draft resolves its corresponding account-owned Cloud Draft summary after sync. Visibility and preview controls are enabled only when the active Draft has a real Cloud counterpart.

Existing local-first and Cloud sync behavior remains the underlying persistence path.

### Preview background

When the active Cloud Draft has preview media, position `0` / the primary preview becomes the `/create` page background.

Verified presentation contract:

```text
fullscreen page layer
width: 100%
height: 100vh
object-fit: cover
opacity: 0.4
pointer-events: none
theme-aware gradient using --themeBackground0 / --themeBackground
```

Changing the primary image through Preview Manager updates the active background state without introducing a separate media source of truth.

## Manage Users polish

`/manage/users` rows now render the reusable `el-avatar` before account name / user ID.

Contract:

```text
avatarUrl available -> user image
no avatarUrl        -> built-in el-avatar initials/person fallback
```

No separate image request is made per row.

## User Information modal expansion

The central User Information modal now uses the admin detail read model for a richer management view.

Displayed information includes:

```text
cover
avatar
username/account label
email
user ID
role
account status
total Draft count
public Draft count
private Draft count
active sessions
total XP
joined timestamp
last update/activity timestamp
```

The list endpoint remains lightweight; heavier admin-only fields belong to the detail endpoint loaded when Information is opened.

This preserves the collection/detail projection rule and avoids bloating every `/manage/users` list request.

## Manage Archive preview projection

Archive list rows now display the first/primary Archive preview image through `el-avatar` beside the item title.

The list API returns a lightweight `previewImageUrl` projection selected from the first persisted image by position.

Important performance rule:

```text
one Archive list request
-> summary metadata + first preview URL
-> no per-row image-detail request
-> no N+1 request pattern
```

The existing image count and full item/media detail paths remain unchanged.

## Backend/API projection changes

The consolidation deliberately extended existing read models rather than creating parallel endpoints.

Admin user detail projection adds cover metadata, Draft visibility counts, XP and update/activity information.

Archive list projection adds only the first preview URL needed by the table.

No new SQL migration was required for this pass; the fields/tables already existed in the verified Docker/backend schema.

## Main implementation surfaces

```text
app/components/create/DraftCloudSyncButton.vue
app/components/manage/AdminUserInformationModal.vue
app/pages/manage/users.vue
app/pages/manage/archive.vue
app/types/adminUsersApi.ts
app/types/adminArchiveApi.ts
backend/src/database.mjs
backend/src/adminArchive.mjs
```

## Verification

The user locally verified the resulting `/create`, `/manage/users`, User Information modal and `/manage/archive` behavior and explicitly accepted the UI result.

No remaining feature item from the original consolidation scope is known.

## Architectural decisions to carry forward

```text
reuse existing Global Menu / Global Modal systems
reuse DraftPreviewManagerModal instead of duplicating preview management
keep frequent Draft actions visible and low-frequency actions in `⋮`
keep collection API projections intentionally lightweight
add list thumbnails in the list query rather than per-row requests
use el-avatar as the common compact image/fallback primitive
preserve local-first Draft sync semantics
keep backend authorization authoritative
```

This document is the durable handoff record for the consolidation pass after its integration into the Docker/backend development line.
