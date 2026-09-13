# Telegram Publishing System — TG1 Shared Backend Foundation

Status: **TG1 BACKEND IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-13

Branch: `feature/growth-foundation`

Parent execution boundary: **CE4.5 — Shared Telegram Publishing Foundation**

## 1. Scope

TG1 establishes one source-neutral Telegram publishing backend for later use by:

```text
/manage/telegram   -> manual drafts in TG2
/manage/archive    -> Prompt adapter in TG3
/manage/marketing  -> Campaign adapter in CE5 / TG4
```

TG1 does not add frontend UI and does not automatically publish Prompts or Campaigns.

Frozen architecture remains:

```text
Telegram = Preview + CTA
Mini App = Entry point
Prompt Draft = all business logic
```

## 2. Telegram contract re-audit

Implementation was re-audited against the current official Telegram Bot API / Mini App contracts before coding.

Important consequences for V1:

- channel-post CTAs use ordinary inline URL buttons that point at a direct Mini App link;
- the backend builds `https://t.me/<bot>/<short_name>?startapp=<token>` and never trusts a browser-supplied destination URL;
- Telegram `web_app` inline buttons are not used for channel posts;
- `sendMediaGroup` does not carry `reply_markup`, so multi-photo publication is represented as one album plus one immediately-following CTA message;
- one shared publication may therefore own multiple Telegram message identities.

## 3. Persistence

Migration:

```text
backend/sql/032_telegram_publishing_foundation.sql
```

Tables:

```text
telegram_publications
telegram_publication_attempts
telegram_publication_messages
```

`telegram_publications` is the authoritative shared publication ledger. It is deliberately not stored only on Prompt Archive or Campaign rows.

Source identities are:

```text
manual
prompt_archive
campaign
```

There is no unique source constraint, so one source item may have multiple publications over time.

The payload snapshot contains normalized public post data and resolved CTA links, never the Telegram bot token.

## 4. Idempotency and retry safety

Every create/publish request requires a caller idempotency key.

Behavior:

```text
same key + same payload hash
  -> return existing publication
  -> never send again automatically

same key + different payload hash
  -> conflict

explicit Telegram API rejection
  -> failed
  -> manual retry may be requested

network timeout / unreadable response / ambiguous transport result
  -> delivery_unknown
  -> blind retry is blocked

album sent but CTA cannot be confirmed
  -> delivery_unknown
  -> already-known album message IDs are preserved
  -> blind retry is blocked
```

Publication creation uses database uniqueness plus `INSERT ... ON CONFLICT DO NOTHING`, so concurrent calls with the same idempotency key converge on one publication identity.

A `publishing` state is also not retryable. Reconciliation/stale-attempt recovery may be hardened later before CE7 if operational evidence requires it.

## 5. Shared post contract

TG1 accepts a normalized draft shape conceptually equivalent to:

```json
{
  "idempotencyKey": "...",
  "source": {
    "type": "manual | prompt_archive | campaign",
    "id": "...",
    "version": "..."
  },
  "post": {
    "caption": "...",
    "media": [
      { "type": "photo", "url": "https://..." }
    ],
    "ctas": [
      { "label": "...", "startParam": "..." }
    ],
    "multiMediaCtaText": "..."
  }
}
```

TG1 intentionally supports public HTTPS photo media only. It does not accept arbitrary browser-provided CTA URLs.

Current limits:

```text
0-10 photos
caption <= 1024 chars when media exists
text-only message <= 4096 chars
1-8 CTAs
Mini App startParam <= 512 chars
```

## 6. Bot API publication forms

```text
0 media
  -> sendMessage + inline URL keyboard

1 photo
  -> sendPhoto + caption + inline URL keyboard

2-10 photos
  -> sendMediaGroup (caption on first media)
  -> sendMessage with inline URL keyboard
```

All Telegram message identities are persisted in `telegram_publication_messages` with stable ordinals and `content` / `cta` roles.

For a public `@channelusername`, the backend also records a public `https://t.me/<channel>/<message_id>` URL. Numeric/private chat destinations intentionally do not invent a public URL.

## 7. Authorization and audit

Admin routes are exact `super_admin` only on the server. A normal `admin` is rejected even though `super_admin` has the wider wildcard authorization model elsewhere.

Routes:

```text
GET  /api/admin/telegram/config
GET  /api/admin/telegram/publications?limit=20
POST /api/admin/telegram/publications
POST /api/admin/telegram/publications/:id/retry
```

The public config endpoint never returns `TELEGRAM_BOT_TOKEN`.

Privileged mutations use the existing `admin_audit_log` with actions:

```text
telegram.publication_created
telegram.publication_retry_requested
telegram.publication_published
telegram.publication_failed
telegram.publication_delivery_unknown
```

## 8. Runtime configuration

Server-only environment variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
TELEGRAM_BOT_USERNAME
TELEGRAM_MINI_APP_SHORT_NAME
```

They are passed only to the API container. No real credential is committed.

When configuration is incomplete, publish/retry fails closed with `TELEGRAM_NOT_CONFIGURED`; config inspection remains safe and only reports non-secret public routing information.

## 9. Legacy Prompt Archive reconciliation

Current Archive schema was re-audited before TG1.

Migration `019_archive_user_draft_promotion.sql` already separated `public_id` from the historical Telegram identity and made `telegram_message_id` / `telegram_url` optional.

Therefore TG1 does not mutate those legacy Archive fields.

TG3 will later adapt `/manage/archive` to this shared publisher and may reconcile a successful Prompt publication back into those compatibility fields where useful. Those fields must not become the future publication ledger and cannot represent all multi-message/multi-publication history.

## 10. TG1 verification gate

TG1 changes backend runtime, Docker API environment and SQL migration only. No frontend rebuild is required.

Founder-local verification:

```powershell
cd G:\ZADAK\prompt-draft

git pull
pnpm api

docker compose exec api npm run db:schema

docker compose exec api node --test src/telegramPublishing.test.mjs
```

Safe auth-boundary smoke with no Telegram credentials required:

```powershell
curl.exe -i "http://localhost:4000/api/admin/telegram/config"
```

Expected without auth:

```text
HTTP 401
```

Do not configure a production bot/channel or send a real Telegram post merely to satisfy TG1 verification. Transport behavior is covered by deterministic fake-fetch tests; real-channel smoke can happen later under founder control.

## 11. Next slice after acceptance

After TG1 founder-local acceptance:

```text
TG2 — shared TelegramPostComposer + /manage/telegram
```

TG2 must consume this API rather than creating another Telegram publishing path.
