# Telegram Publishing System — TG4 Campaign Adapter

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15**

Date: 2026-09-15

Branch:

```text
feature/growth-foundation
```

Parent tracks:

```text
Campaign Engine V1
CE5 — Manage Marketing
Telegram Publishing System
```

Canonical companions:

```text
docs/strategy/CAMPAIGN_ENGINE_V1.md
docs/strategy/CAMPAIGN_ENGINE_API_RUNTIME_CONTRACT_V1.md
docs/strategy/CAMPAIGN_ENGINE_CE5_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

---

## 1. Scope

TG4 connects a published Campaign to the already accepted shared Telegram publishing subsystem.

Canonical path:

```text
/manage/marketing
  -> CampaignTelegramAdapter
  -> TelegramPostComposer
  -> TG1 shared backend TelegramPublisher
  -> telegram_publications
```

No Campaign-specific Bot API client, publication ledger, retry engine or publisher was introduced.

---

## 2. Immutable source rule

Telegram prefill is derived only from the current immutable published Campaign version:

```text
AdminCampaignDetail.publishedVersion.definition
```

The mutable Campaign draft is never used as the Telegram publication source.

The shared publication source identity is:

```text
source.type    = campaign
source.id      = Campaign UUID
source.version = immutable published version number
```

This keeps Telegram publication audit identity aligned with the exact Campaign version represented by the post.

---

## 3. Composer prefill

`CampaignTelegramAdapter.vue` reuses `TelegramPostComposer` and prefills:

```text
published EN/FA Campaign title
published EN/FA Campaign description
Campaign Mini App CTA
Prompt Draft Q&A group CTA
```

The current Campaign V1 definition does not define canonical persisted public Campaign media, so TG4 does not invent a Campaign-specific media field. Media remains a publication concern owned by the shared Telegram composer.

---

## 3.1 Shared managed image uploader hardening

Founder review identified the original raw-URL-only Telegram media UX as unsuitable for normal operator use.

TG4 therefore includes a shared managed-image hardening slice:

```text
ArchiveImageManager
        \
         -> ManagedImageUploader -> shared browser image preparation
        /
TelegramPostComposer
```

The accepted Archive interaction model is now reusable:

```text
file picker
drag + drop
clipboard paste
preview
reorder
remove / clear
JPEG / PNG / WebP validation
full WebP preparation
thumbnail preparation
```

`ArchiveImageManager.vue` is now a compatibility wrapper around the generic `ManagedImageUploader.vue`, so Prompt Archive keeps its existing workflow while future surfaces can reuse the same component with their own labels, limits and transport scope.

Telegram uses the uploader as the primary media UX. Existing public HTTPS URLs remain available only as an Advanced escape hatch so TG3 can still prefill persisted Archive images and operators can intentionally reference already-hosted media.

### Upload timing

Prepared Telegram images remain browser-local while composing.

They are uploaded only when the operator explicitly chooses Publish:

```text
PreparedManagedImage
  -> POST /api/admin/media/images
  -> scope = telegram
  -> server-controlled Object Storage key
  -> public HTTPS full image URL
  -> existing Telegram publication payload
  -> TG1 shared publisher
```

This avoids creating storage objects merely by opening/closing/resetting the composer.

### Storage-path authority

The browser cannot provide an arbitrary Object Storage path.

The backend owns an explicit managed-media scope registry. The first allowed scope is:

```text
telegram
  -> managed/telegram/<server-generated-id>/full.webp
  -> managed/telegram/<server-generated-id>/thumb.webp
```

Unknown scopes are rejected before storage access. The endpoint reuses the existing Arvan/S3 storage driver/configuration rather than creating a second storage authority.

The current Telegram backend authority remains super-admin-only, and the shared media endpoint uses the same boundary for the Telegram scope.

No database migration is required for this hardening slice. Telegram publication payloads continue to persist the resolved public HTTPS media URLs in the existing `telegram_publications` ledger, so existing publication retry semantics remain unchanged.

---

## 4. Campaign Mini App CTA

TG4 uses the shared Telegram Mini App CTA mechanism:

```text
campaign_<slug>
```

`app/plugins/telegram.client.ts` recognizes this start parameter and routes to:

```text
/campaign/<slug>?source=telegram&medium=campaign_channel
```

The Campaign public page converts only those exact query values into participation attribution:

```json
{
  "source": "telegram",
  "medium": "campaign_channel",
  "campaign": "<slug>",
  "metadata": {
    "placement": "telegram_channel"
  }
}
```

Telegram remains distribution/entry metadata only. Prompt Draft continues to decide authentication, eligibility, participation, attempts, completion, outcomes and rewards server-side.

The login flow preserves `route.fullPath`, so Telegram attribution survives the Campaign -> login -> Campaign return path before participation begins.

---

## 5. Manage Marketing integration

A Telegram action is exposed from the existing Campaign three-dot action menu only when:

```text
user has telegram.manage
AND
Campaign has a publishedVersion
```

Selecting it opens the shared composer inside the existing modal system. Draft-only Campaigns do not expose TG4 publication because they do not have an immutable publication source.

---

## 6. Implementation commits

TG4 Campaign adapter:

```text
acc6e5b6  feat: add Campaign Telegram adapter
d8528037  feat: route Telegram Campaign start params
c879a800  feat: capture Telegram Campaign attribution
d73085ee  feat: connect Campaigns to Telegram composer
```

Shared media hardening:

```text
aa555fc7  feat: add shared managed image uploader
374b9df1  fix: guard managed media storage config
```

---

## 7. Verification — accepted 2026-09-15

Founder-local verification confirmed the Campaign Telegram flow end-to-end against a dedicated Telegram test channel.

Accepted evidence:

```text
published Campaign exposes Telegram from /manage/marketing
shared composer opens with Campaign content and CTA
shared managed image uploader prepares local media
focused managed-media backend contract tests pass 3/3
real Telegram image post is delivered to the test channel
Join Campaign CTA is rendered on the real post
CTA opens the configured Telegram Mini App
Mini App resolves the intended public Campaign
server Campaign runtime remains authoritative after Telegram entry
```

The real delivery test intentionally used a non-production Telegram channel.

Canonical acceptance record:

```text
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_ACCEPTANCE.md
```

TG4 is accepted and no longer blocks CE5 aggregate verification.

Future TG4 regression scope is frontend + API, with no SQL migration:

```powershell
pnpm api
pnpm frontend
```

Focused managed-media contract check:

```powershell
docker compose exec api node --test src/adminManagedMediaRoute.test.mjs
```

Do not run `pnpm stack` or `db:schema` solely for TG4 media hardening.
