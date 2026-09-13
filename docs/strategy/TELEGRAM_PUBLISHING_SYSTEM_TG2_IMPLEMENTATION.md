# Telegram Publishing System — TG2 Composer + Manage Surface

Status: **DONE / FOUNDER-LOCAL BUILD + VISUAL VERIFIED / ACCEPTED 2026-09-13**

Date: 2026-09-13

Branch: `feature/growth-foundation`

Parent execution boundary: **CE4.5 — Shared Telegram Publishing Foundation**

## 1. Scope

TG2 adds the first operator-facing surface on top of the accepted TG1 shared publisher:

```text
/manage/telegram
  -> shared TelegramPostComposer
  -> TG1 /api/admin/telegram/*
  -> TelegramPublisher
```

TG2 does not add a second publisher, a second persistence model, a Campaign-specific Telegram path or Prompt-specific Telegram delivery logic.

## 2. Reusable Composer

`app/components/manage/TelegramPostComposer.vue` is the shared V1 composer intended for:

```text
TG2 manual publishing
TG3 Prompt Archive prefill
TG4 Campaign prefill
```

It accepts source identity and optional prefilled caption/media/CTA values while always publishing through `useAdminTelegram()` and TG1.

Supported composition:

```text
text-only post
single public HTTPS photo
2-10 public HTTPS photos
1-8 Mini App CTAs
optional album CTA message
live Prompt Draft-styled preview
```

The browser never submits an arbitrary Telegram destination URL or arbitrary CTA URL. It submits only CTA label + safe `startParam`; TG1 resolves the authoritative Mini App URL.

## 3. Idempotency behavior

The Composer owns one client idempotency key for the current unchanged draft.

```text
unchanged draft + uncertain client/network response
  -> same idempotency key on retry
  -> TG1 converges on the existing publication

operator edits draft
  -> new idempotency key
```

This keeps normal manual editing convenient without defeating TG1 duplicate-delivery protection.

## 4. `/manage/telegram`

The management page provides:

```text
safe non-secret Telegram configuration status
shared manual Composer
latest publication history
source/status/attempt/media/CTA summary
last known delivery error
manual Retry only for definite `failed` state
no Retry action for `delivery_unknown`
```

When Telegram server configuration is incomplete, the Composer stays disabled and explains why. TG2 does not require real bot credentials merely to render or verify the UI.

## 5. Authorization

Frontend UX gating adds:

```text
telegram.manage
```

Only `super_admin` receives it through the existing `*` wildcard, so normal admins do not see the Telegram Manage section and cannot pass page middleware.

This frontend permission is not security authority. TG1 remains authoritative and still checks:

```text
user.role === 'super_admin'
```

server-side for every `/api/admin/telegram/*` request.

## 6. UI / localization

TG2 follows `UI_IMPLEMENTATION_GUIDELINES.md`:

- existing `el-flex`, `el-button`, `el-text`, `el-text-field`, `el-divider` primitives;
- semantic theme colors only;
- scoped CSS only for preview image geometry;
- no parallel local design system;
- responsive wrapping through existing flex utilities;
- English and Persian strings live in dedicated Manage locale fragments and merge through `i18n/i18n.config.ts`.

Light/Dark and EN/FA were founder-visual verified before acceptance.

## 7. Backend / database scope

TG2 introduces no backend runtime change and no SQL migration.

It consumes the accepted TG1 routes:

```text
GET  /api/admin/telegram/config
GET  /api/admin/telegram/publications
POST /api/admin/telegram/publications
POST /api/admin/telegram/publications/:id/retry
```

Therefore TG2 verification did not require `pnpm api`, `db:schema`, or `pnpm stack`.

## 8. Founder-local verification evidence

Founder-local verification was completed on 2026-09-13 with the smallest required frontend scope:

```powershell
cd G:\ZADAK\prompt-draft

git pull
pnpm locale:audit:parity
pnpm frontend
```

Observed localization audit:

```text
Missing in EN:        0
Dynamic key patterns: 0
Hardcoded candidates: 0
```

The existing repository-wide FA parity backlog remained present (`Missing in FA: 111`, `Extra in FA: 183`) and was not introduced by TG2. The TG2 EN/FA surface itself rendered correctly in founder screenshots.

Frontend production build completed successfully through client, SSR server and Nitro output. Existing non-blocking warnings remained limited to the known Nuxt module-preload sourcemap warning, large chunk warnings and the orphan `cloudflared` container warning.

Founder visual evidence confirmed:

```text
Telegram section appears for super_admin
/manage/telegram renders in EN and FA
Light and Dark themes both render correctly
configuration status is readable
missing local Telegram env produces Not configured / پیکربندی نشده
Publish is safely disabled while server configuration is absent
Composer caption/media/CTA controls render correctly
Prompt Draft preview renders correctly
publication-history empty state renders correctly
```

No production bot token, production channel configuration or real Telegram delivery was required for this TG2 acceptance gate.

## 9. Acceptance

TG2 is accepted:

```text
TG1 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-13
TG2 -> DONE / FOUNDER-LOCAL BUILD + VISUAL VERIFIED / ACCEPTED 2026-09-13
```

Next slice:

```text
TG3 — Prompt Archive adapter -> same TelegramPostComposer + same TG1 publisher
```
