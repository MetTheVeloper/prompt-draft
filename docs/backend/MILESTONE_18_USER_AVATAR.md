# Milestone 18 — User Avatar Foundation

Status: `IMPLEMENTED / AWAITING LOCAL VERIFICATION`

Branch: `feature/docker-local-api`

## Goal

Add optional user avatars on top of the image-processing and Arvan Object Storage foundation established by Milestone 17.

User accounts have no default stored avatar. When no uploaded image exists, the reusable EL avatar component renders initials derived from the account label and falls back to a person icon when no label is available.

## Data model

Migration:

```text
backend/sql/015_user_avatar.sql
```

Adds nullable user fields:

```text
avatar_url
avatar_storage_key
```

Both fields are NULL by default and constrained to be either both present or both absent.

## Storage

The first avatar implementation deliberately reuses the already-configured backend-only S3/Arvan storage substrate from Milestone 17.

Object layout:

```text
avatars/<user-uuid>/<immutable-avatar-uuid>.webp
```

Objects use:

```text
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
x-amz-acl: public-read   # with the current storage configuration
```

Storage credentials remain backend-only. No credential or signed upload configuration is exposed to the browser.

Replacement semantics:

```text
upload new immutable object
-> persist new URL/key on users row
-> best-effort delete previous object
```

Removal semantics:

```text
clear DB avatar state first
-> best-effort delete old object
```

A storage cleanup failure therefore does not leave a user pointing at a deleted or incomplete new avatar.

## Browser image preparation

Utility:

```text
app/utils/userAvatarImage.ts
```

Accepted inputs:

```text
JPEG / JPG
PNG
WebP
```

Preparation contract:

```text
center-crop to square
resize to exactly 400 x 400
WebP output
quality = 0.60
```

Unlike Prompt Archive media, avatar output is intentionally always exactly 400x400. Small source images can therefore be upscaled to satisfy the avatar contract.

Backend validation does not trust the browser blindly. The raw upload route validates:

```text
Content-Type = image/webp
maximum body size = 2 MiB
RIFF/WEBP structure
actual decoded WebP header dimensions = 400 x 400
```

## API

Authenticated self-service route:

```text
GET    /api/profile/avatar
POST   /api/profile/avatar
DELETE /api/profile/avatar
```

GET returns the current avatar URL or null.

POST accepts the prepared raw WebP body.

DELETE clears the user's avatar.

This state is intentionally kept as a separate profile-media boundary rather than expanding every login/register/auth response with media data.

Frontend state:

```text
app/composables/useUserAvatar.ts
```

The composable provides shared reactive avatar state to Header and Profile Menu, so save/remove updates both immediately without a page refresh.

## EL Avatar component

Reusable component:

```text
app/components/el/avatar.vue
```

Display precedence:

```text
valid image src
-> initials from name/account label
-> person icon
```

Sizing intentionally follows the same size resolver used by `el-button`:

```text
same size keyword/number
-> same dimension(...).button.height
```

Supported size semantics mirror the button scale:

```text
tiny
mini
normal
medium
big
-3 .. +3
numeric size
```

This guarantees a FAB and `el-avatar` using the same logical size can share the same height. The signed-in Header profile trigger uses zero button padding around the avatar so the visual avatar itself defines the FAB footprint.

## Product integration

### Header

Logged out:

```text
existing Login FAB remains unchanged
```

Logged in:

```text
profile FAB visual is replaced by el-avatar
click still opens the same Profile Menu
```

### Profile Menu

Adds:

```text
current avatar / initials preview
Choose avatar
Change avatar
prepared 400x400 preview
Save avatar
Cancel prepared avatar
Remove avatar
```

File selection does not upload immediately. The user previews the processed result first, then explicitly saves it.

### Manage users

Admin user read models now expose:

```text
avatarUrl
```

`AdminUserInformationModal` uses the shared `el-avatar` component. The main users table can reuse the same field/component later without another backend/schema change.

## Local verification gate

This milestone is not DONE until the user verifies the following locally.

### 1. Pull, rebuild, schema

```powershell
git pull
docker compose up -d --build db api
docker compose exec api npm run db:schema
```

Expected migration output includes:

```text
015_user_avatar.sql
```

### 2. Empty/default state

Open the Profile Menu for an account that has never uploaded an avatar.

Expected:

```text
no stored avatar URL
el-avatar shows initials from username/email
Header uses the same initials avatar instead of the old account-circle FAB
```

### 3. Prepare and save

Choose a non-square JPEG/PNG/WebP.

Expected before save:

```text
center-cropped square preview
400x400 prepared output
no storage upload until Save avatar is clicked
```

Save it.

Expected Network request:

```text
POST /api/profile/avatar
Content-Type: image/webp
200 OK
```

Header and Profile Menu should update immediately without refresh.

### 4. Database

Inspect the current user:

```sql
SELECT id, username, email, avatar_url, avatar_storage_key
FROM users
WHERE id = '<current-user-uuid>';
```

Expected:

```text
avatar_url -> Arvan public URL
avatar_storage_key -> avatars/<user-uuid>/<uuid>.webp
```

### 5. Public image and dimensions

Open `avatar_url` directly and confirm it loads without Prompt Draft authentication.

The resulting file must be WebP and 400x400.

### 6. Replacement

Choose and save a different image.

Expected:

```text
new immutable URL/key
new image visible immediately
old object cleanup attempted after DB switch
```

### 7. Removal

Use Remove avatar.

Expected:

```text
DELETE /api/profile/avatar -> 200
avatar_url = NULL
avatar_storage_key = NULL
Header/Profile Menu immediately return to initials/icon fallback
```

### 8. Manage reuse

Open a user's Information modal under `/manage/users`.

Expected:

```text
uploaded avatar shown when present
same initials/icon fallback when absent
```

### 9. Authorization

Anonymous requests to `/api/profile/avatar` must return 401.

### 10. Release invariant

```powershell
pnpm generate
```

Only after the user explicitly confirms the behavior and final generation should this document become:

```text
Status: DONE / LOCALLY VERIFIED
```
