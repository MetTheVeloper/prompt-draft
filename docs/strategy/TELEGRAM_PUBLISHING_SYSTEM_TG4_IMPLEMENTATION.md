# Telegram Publishing System — TG4 Campaign Adapter

Status: **IMPLEMENTED / FOUNDER-LOCAL VERIFICATION PENDING**

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

The current Campaign V1 definition does not define canonical persisted public Campaign media, so TG4 does not invent a parallel image/media field. Operators may still add media through the shared composer before publishing.

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

```text
acc6e5b6  feat: add Campaign Telegram adapter
d8528037  feat: route Telegram Campaign start params
c879a800  feat: capture Telegram Campaign attribution
d73085ee  feat: connect Campaigns to Telegram composer
```

---

## 7. Verification gate

TG4 is not accepted until founder-local verification confirms at minimum:

```text
1. published Campaign shows Telegram in the three-dot menu
2. draft-only Campaign does not expose the TG4 action
3. Telegram composer opens from /manage/marketing
4. caption uses the published immutable version, not unsaved/saved draft edits
5. source is campaign + Campaign UUID + published version
6. Campaign CTA is campaign_<slug>
7. publishing goes through the existing shared Telegram publisher
8. Telegram Mini App CTA opens the correct public Campaign
9. login return preserves the Telegram entry context
10. starting participation records Telegram attribution without changing runtime authority
11. EN/FA and mobile/tablet/desktop composer behavior remain usable
```

Frontend-only implementation scope:

```powershell
pnpm frontend
```

Do not rebuild API or the full stack for this TG4 implementation.
