# Branch Closure — Create UI Consolidation

Status: `DONE / LOCALLY VERIFIED`

Branch: `feature/create-ui-consolidation`
Base branch: `feature/docker-local-api`
Base checkpoint: `4c67b045abead7e2eb3d7cdc29865859a86ecf6b`
Closed: 2026-09-06

## Purpose

This branch is a post-Milestone-20 UI consolidation pass. It does not introduce a new product data model or a new numbered backend milestone. Its job is to expose already-existing Cloud Draft visibility/media capabilities cleanly in `/create`, reduce action-row clutter, and finish deferred admin/list projections for Users and Prompt Archive.

The branch intentionally reuses existing project systems instead of creating parallel UI or API paths.

## Verified scope

The user locally tested and explicitly accepted all items below.

### `/create` action hierarchy

The high-frequency controls remain directly visible:

```text
Drafts
Cloud Save / Sync
Public / Private visibility
```

Lower-frequency actions are grouped under the shared Global Menu (`⋮`):

```text
Share
Download
Manage previews
Delete
```

This keeps the create header responsive and follows the project's existing menu architecture.

### `/create` Draft visibility

Cloud Draft visibility is visible and editable directly from `/create` through the existing owner visibility API.

```text
private <-> public
```

The UI uses the existing backend ownership/authorization boundary. A local Draft must exist in Cloud before server-only visibility/media actions can be used.

No second visibility state or client-only publication model was introduced.

### Preview Manager reuse

`/create` reuses the same central `DraftPreviewManagerModal` already used by `/user`.

There is one preview-management workflow for:

```text
listing preview images
adding preview images
changing the primary image
removing preview images
```

No create-specific duplicate Preview Manager was created.

### Draft preview background in `/create`

When the active Cloud Draft has a primary preview image (`position = 0`), it can be used as the full-screen visual background for `/create`.

Verified presentation contract:

```text
width: 100%
height: 100vh
object-fit: cover
opacity: approximately 0.40
pointer-events: none
theme-compatible foreground/background gradient
```

Changing the primary preview through Preview Manager updates the current create-session background without introducing a separate media source of truth.

### Manage Users row avatar

`/manage/users` now displays the existing user `avatarUrl` with reusable `el-avatar` before account name/ID.

Fallback behavior remains centralized inside `el-avatar`:

```text
image
-> initials
-> person icon
```

The Users list endpoint already contained `avatarUrl`, so no extra per-row request was added.

### User Information modal projection

The admin User Information detail surface was expanded to reflect the current account/profile data available to the backend.

The detail projection now includes/administers presentation of:

```text
avatar
cover
username
email
user id
role
account status
total Draft count
public Draft count
private Draft count
active session count
total XP
joined date
updated date / latest persisted activity timestamp
```

The heavier fields are returned only by the user-detail endpoint. The list endpoint remains a lightweight summary projection.

Important privacy distinction: this is an authorized admin read model. It does not change the public user-profile privacy contract.

### Manage Archive row preview

`/manage/archive` now shows the first Archive image beside the title using `el-avatar` as a compact thumbnail surface.

The thumbnail is projected directly by the Archive list query:

```text
first image ordered by position, then id
thumbnail_url
-> full_url fallback
-> source_path fallback
```

This was deliberately implemented in the list projection to avoid an N+1 pattern. The UI does not fetch Archive detail/media separately for every row.

## API projection rule established by this branch

For list/admin surfaces, return the smallest presentation projection that avoids extra per-row requests.

Examples from this branch:

```text
Users list
  -> avatarUrl already present

User detail modal
  -> cover + detailed counts + XP + timestamps only in detail projection

Archive list
  -> one previewImageUrl projected in the collection query
```

Do not solve list presentation by issuing one detail request per row.

## Schema impact

No SQL migration was required.

The branch uses schema already established through migration `019_archive_user_draft_promotion.sql`.

Therefore the next real schema change remains:

```text
020_*.sql
```

## Main implementation areas

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

The create consolidation was intentionally concentrated around the existing Cloud Draft action component instead of introducing a large page-level rewrite.

## Architecture decisions preserved

```text
reuse Global Menu rather than inventing another action-menu system
reuse DraftPreviewManagerModal rather than creating a create-only media manager
backend remains authoritative for visibility and admin data
list/detail API projections remain deliberately separate
avoid N+1 list requests
do not add schema when existing persisted data is sufficient
keep Nuxt static-generation architecture unchanged
```

## Verification

The user locally verified the completed `/create`, `/manage/users`, User Information modal and `/manage/archive` behavior and explicitly confirmed that the branch scope works as intended.

No known in-scope product item remains open in this branch.

## Relationship to `feature/docker-local-api`

`feature/docker-local-api` is the completed backend/platform foundation through Milestone 20. This branch starts from its final checkpoint and adds only the deferred UI/API-projection consolidation described above.

When studying the history later, read in this order:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
docs/backend/BRANCH_CREATE_UI_CONSOLIDATION.md
```
