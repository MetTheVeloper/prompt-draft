# Telegram Publishing System — TG3 Prompt Archive Adapter

Status: **TG1 ACCEPTED / TG2 ACCEPTED / TG3 IMPLEMENTED / AWAITING FOUNDER-LOCAL BUILD + VISUAL VERIFICATION**

Date: 2026-09-13

Branch: `feature/growth-foundation`

Parent execution boundary: **CE4.5 — Shared Telegram Publishing Foundation**

## 1. Scope

TG3 connects the existing Prompt Archive management surface to the already accepted shared Telegram publishing subsystem:

```text
/manage/archive
  -> ArchiveTelegramAdapter
  -> same TelegramPostComposer from TG2
  -> same TG1 /api/admin/telegram/* publisher
  -> telegram_publications shared ledger
```

TG3 does not create a Prompt-specific Telegram publisher, Telegram API client, publication table, retry system or delivery state.

## 2. Availability boundary

The Archive adapter is presentation-gated to:

```text
super_admin with telegram.manage
AND
Prompt Archive item status = published
```

The frontend gate is convenience only. TG1 remains authoritative and re-checks exact `super_admin` authorization server-side for every Telegram publication mutation.

Draft and archived Prompt items are not offered as Telegram publication sources.

## 3. Public-safe prefill

Opening the Archive Telegram adapter prefills only public presentation data from the persisted published Archive item:

```text
localized public title
localized public description
persisted public HTTPS images, in Archive order, capped by TG1 maxMedia
one Prompt Draft Mini App CTA
```

The private/protected Prompt body is never copied into the Telegram caption, CTA or start parameter.

The selected Prompt Archive locale follows the currently active Manage locale:

```text
EN Manage -> English title + description
FA Manage -> Persian title + description
```

Changing locale recreates the Composer draft from the corresponding localized public projection.

## 4. Source identity and Mini App entry token

Shared publication source identity is:

```text
source.type = prompt_archive
source.id   = <Prompt Archive internal UUID>
```

This identifies the source item in the shared Telegram publication ledger without overloading the old one-message Archive metadata fields.

The TG3 Prompt CTA start parameter contract is:

```text
prompt_<publicId>
```

Example:

```text
Prompt public id 123
-> startParam = prompt_123
-> TG1 resolves the authoritative Mini App URL
```

The browser never submits an arbitrary CTA URL. TG1 remains the only layer that resolves the configured bot username + Mini App short name into the Telegram URL.

TG3 freezes only the outbound Prompt entry token shape. Telegram Mini App bootstrap/routing that consumes this token is a separate integration concern and must preserve Prompt Draft as the authority for unlock, copy, identity and Goin behavior.

## 5. Legacy Archive Telegram metadata reconciliation

Existing Archive fields remain compatibility/source metadata:

```text
telegram_message_id
telegram_url
channel
```

TG3 intentionally does **not** write these fields after a shared publication.

Reason:

```text
one Prompt may have multiple Telegram publications
telegram_publications is the shared delivery ledger
one scalar telegram_message_id cannot represent future publication history
```

Historical/legacy values may remain visible and editable under the existing Archive contract, but they are not the authority for TG1/TG2/TG3 publication state.

## 6. Composer behavior

The adapter reuses `TelegramPostComposer.vue` unchanged.

Therefore TG3 inherits the accepted TG2 behavior:

```text
text / caption editing
public HTTPS photo editing
multiple media up to backend limit
one or more safe Mini App CTAs
live Prompt Draft-styled preview
idempotency identity reset only when the operator edits the draft
server-controlled CTA URL resolution
safe disabled state when Telegram server config is incomplete
```

The adapter lazy-loads safe Telegram configuration only when the super admin opens the Telegram Composer. Normal Archive users do not gain Telegram permissions or make privileged Telegram requests merely by viewing Archive.

## 7. Backend / database scope

TG3 adds no backend runtime change and no SQL migration.

It consumes the accepted TG1 routes and persistence model unchanged.

No Archive mutation is performed after Telegram publication, so TG3 cannot accidentally collapse multiple shared publication records back into the legacy scalar Telegram fields.

## 8. UI / theme boundary

TG3 follows `UI_IMPLEMENTATION_GUIDELINES.md`:

```text
existing Manage page
existing TelegramPostComposer
existing el-* primitives
existing semantic theme colors
no new local design system
no page-specific theme override
```

The adapter adds no custom CSS.

## 9. Founder-local verification gate

Changed runtime scope is frontend-only.

Smallest required verification:

```powershell
cd G:\ZADAK\prompt-draft

git pull
pnpm frontend
```

No `pnpm api`, `db:schema` or `pnpm stack` is required for TG3.

Then, while logged in as `super_admin`, inspect a **published** Prompt Archive item in:

```text
/manage/archive?edit=<publicId>
/fa/manage/archive?edit=<publicId>
```

Required evidence:

```text
Telegram adapter appears only for a published Archive item
opening it renders the exact shared TG2 TelegramPostComposer
EN prefill uses English public title + description
FA prefill uses Persian public title + description
persisted public HTTPS Archive images are prefilled in order
CTA is prefilled and its safe start parameter is prompt_<publicId>
Prompt body is not copied into the Telegram caption or CTA
Light theme renders correctly
Dark theme renders correctly
when local Telegram config is missing, preview remains usable and Publish remains safely disabled
moving the Archive item back to draft removes/closes the Telegram adapter
existing legacy Telegram message id / URL are not mutated by opening or composing
```

A real Telegram bot/channel post is not required for TG3 acceptance when local Telegram configuration is intentionally absent.

## 10. Acceptance boundary

TG3 is not accepted until founder-local frontend build and visual/behavior evidence are clean.

After TG3 acceptance, CE4.5 is complete and the next Campaign slice is:

```text
CE5 — /manage/marketing
  -> Campaign operator surface
  -> TG4 Campaign adapter reusing the same TelegramPostComposer + TG1 publisher
```
