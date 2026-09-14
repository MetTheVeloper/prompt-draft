# Telegram Publishing System — TG3 Prompt Archive Adapter

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15**

Date: 2026-09-15

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

## 3. Accepted public-safe Prompt prefill

The implementation was refined after the original TG3 draft so the accepted source-of-truth prefill is bilingual and channel-ready rather than Manage-locale-only.

Opening the Archive Telegram adapter derives only public presentation data from the persisted published Archive item:

```text
caption line 1 -> <Persian title> | <English title> 👇
then           -> Persian public description
separator      -> ---
then           -> English public description
separator      -> ---
then           -> normalized public hashtags from Archive tags

media          -> persisted public HTTPS Archive images in Archive order, capped by TG1 maxMedia

CTA 1          -> Get Prompt | دریافت پرامپت
                  startParam = prompt_<publicId>

CTA 2          -> گروه پرسش و پاسخ
                  fixed direct HTTPS URL = https://t.me/prompt_draft_group

album CTA text -> Preview Model: <preview model> | Optimized for: <optimization models>
```

The private/protected Prompt body is never copied into the Telegram caption, CTA, start parameter or model summary.

This refinement was implemented in:

```text
c0f3dbdadde2b3dc6a14e75c7a8e3aa009d87158
feat: improve Archive Telegram prefill
```

The shared Telegram contract was also extended/tested for credential-free direct HTTPS CTA URLs rather than creating Prompt-specific Telegram keyboard logic:

```text
ee48f98e0553dc0c8267f54d8514cb5559601a87
test: cover direct Telegram CTA URLs
```

TG1 remains responsible for resolving Mini App `startParam` CTAs into the configured bot/Mini App route. Direct HTTPS CTAs are validated by the shared Telegram post contract and passed through the shared publisher.

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

The adapter reuses the shared `TelegramPostComposer.vue`; publication still follows the TG1/TG2 path.

TG3 therefore inherits the shared behavior:

```text
text / caption editing
public HTTPS photo editing
multiple media up to backend limit
Mini App startParam CTAs resolved by TG1
validated direct HTTPS CTAs
live Prompt Draft-styled preview
idempotency identity reset only when the operator edits the draft
safe disabled state when Telegram server config is incomplete
```

The adapter lazy-loads safe Telegram configuration only when the super admin opens the Telegram Composer. Normal Archive users do not gain Telegram permissions or make privileged Telegram requests merely by viewing Archive.

## 7. Backend / database scope

The original TG3 adapter itself added no separate backend runtime or SQL persistence model. It consumes the accepted TG1 routes and shared publication ledger.

The later shared direct-CTA extension remains part of the single Telegram contract/publisher; it did not introduce a Prompt-specific backend path.

No Archive mutation is performed after Telegram publication, so TG3 cannot collapse multiple shared publication records back into the legacy scalar Telegram fields.

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

The adapter itself adds no parallel design system.

## 9. Archive management/image hardening — ACCEPTED

TG3 integration exposed several Archive-editor issues that were fixed before treating the operator surface as stable.

Canonical acceptance record:

```text
docs/strategy/PROMPT_ARCHIVE_MANAGEMENT_ACCEPTANCE.md
```

Accepted implementation checkpoints:

```text
0942b4ff469b6bd1aee8425cf5914b8c8d10102e
feat: expand Archive model metadata

5e12bb76cb71f475f12a52cb69067ba5576ad21e
fix: preserve Archive publication status on edits

61ec45217a0fd413513ab36bcc1609de6b728b2b
fix: sync Archive image batch preparation state
```

Founder-local verification on 2026-09-14 confirmed the Archive management/image workflow is fully correct, including status-preserving metadata/media edits and multi-image batch preparation without stale `Preparing` state.

This Archive checkpoint is **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED** and must not be reopened without a concrete regression.

## 10. TG3 founder-local acceptance evidence

Founder-local verification completed on 2026-09-15 against the current published Prompt Archive workflow.

Confirmed behavior:

```text
Telegram Archive prefill renders with the expected persisted Prompt presentation values
bilingual caption/title/description prefill is correct
persisted images and Telegram CTA/model prefill are correct
no TG3 prefill regression was observed
Archive Update changes preserves publication state
Archive Update changes immediately refreshes the Telegram Composer prefill from the newly persisted values
```

The last point is part of the accepted interaction contract: the Telegram adapter must consume current persisted Archive data rather than retaining a stale Composer snapshot after an operator update.

No real Telegram bot/channel delivery was required for this TG3 acceptance boundary; TG1 transport and TG2 shared Composer contracts were already separately accepted.

## 11. Acceptance boundary and next slice

Final state:

```text
TG1 -> DONE / ACCEPTED
TG2 -> DONE / ACCEPTED
TG3 -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-15
Archive management/image hardening -> DONE / ACCEPTED 2026-09-14
CE4.5 Shared Telegram Publishing Foundation -> DONE / ACCEPTED
```

The next active Campaign slice is:

```text
CE5 — /manage/marketing
  -> Campaign operator surface
  -> TG4 Campaign adapter reusing the same TelegramPostComposer + TG1 publisher
```

This documentation-only acceptance update requires no Docker rebuild.