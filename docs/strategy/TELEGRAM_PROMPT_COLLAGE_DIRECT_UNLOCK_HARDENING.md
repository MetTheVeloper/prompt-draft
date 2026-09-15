# Telegram Prompt Distribution Hardening — Client Collage + Direct Unlock

Last updated: 2026-09-16

Branch:

```text
feature/growth-foundation
```

Status: **PLANNED / IMPLEMENTATION NEXT / CE6 PAUSED DURING THIS HARDENING**

This document is the source of truth for the post-TG3 Prompt distribution hardening that must be completed before Campaign Engine CE6 continues.

---

## 1. Why this hardening exists

The accepted shared Telegram publisher behaves correctly for the Telegram Bot API contract:

```text
0 media  -> sendMessage + inline keyboard
1 media  -> sendPhoto + caption + inline keyboard
2..10    -> sendMediaGroup + separate CTA sendMessage
```

The multi-image behavior is a problem specifically for Prompt distribution. A Prompt commonly has several preview images, so its Telegram publication becomes two visible units:

```text
album + Prompt caption
separate CTA message + buttons
```

This weakens forwarding/distribution because the visual Prompt post can be forwarded independently from its CTA message.

Founder-local verification confirmed that the existing single-photo Campaign publication forwards as one useful Telegram post with its buttons intact. Therefore multi-image Prompt publications should be converted to a single-photo publication before they reach the shared Telegram publisher.

A second UX problem also exists in the Prompt Telegram entry flow. The accepted Prompt start parameter is:

```text
prompt_<publicId>
```

The current Telegram client routing sends it to the public SEO Prompt page:

```text
/prompt/<publicId>
```

That public page then sends the user to the protected application Prompt surface:

```text
/prompts?id=<publicId>
```

For Telegram traffic this extra SEO/public hop is unnecessary friction. The Telegram CTA should go directly to the protected/noindex Prompt acquisition + unlock surface.

---

## 2. Accepted product decisions

The following decisions are frozen for this hardening unless the Founder explicitly changes them.

### 2.1 Multi-image Prompt posts become a client-generated collage

For Prompt-origin Telegram publications:

```text
0 images -> existing text publication
1 image  -> existing single-photo publication
2+ images -> client-generated collage -> one managed Telegram image -> sendPhoto
```

The shared backend Telegram publisher remains generic and keeps its existing album capability. We are not deleting `sendMediaGroup` and we are not creating a Prompt-specific publisher.

The Prompt adapter/composer is responsible for reducing multiple Prompt previews to one generated collage before publication.

### 2.2 Collage rendering stays in the browser

Do not add a backend image renderer for this work.

The intended path is:

```text
Prompt persisted preview URLs
        ↓
shared Collage layout engine
        ↓
client Canvas rendering
        ↓
Blob / File
        ↓
existing managed image preparation
        ↓
existing POST /api/admin/media/images, scope=telegram
        ↓
Arvan Object Storage public HTTPS URL
        ↓
shared Telegram publisher
        ↓
sendPhoto + caption + inline keyboard
```

No generated collage should be uploaded while the operator is merely editing layout. Upload happens only during Publish, matching the existing managed-media anti-orphan behavior.

### 2.3 Reuse the existing `/collage` system; do not copy its algorithm

The existing Collage feature is already separated enough to be a real reuse candidate:

```text
app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageExport.ts
app/utils/collage/layout.ts
app/utils/collage/drawing.ts
app/utils/collage/shuffle.ts
app/constants/collage.ts
app/types/collage.ts
```

`useCollageRenderer` already delegates layout creation to `createCollageLayout(...)` and supports the accepted ratio/orientation/constraint/shuffle concepts.

`useCollageExport` already exposes:

```ts
getExportBlob(type, quality)
```

The Telegram integration must extract/reuse headless pieces where necessary instead of introducing a second collage implementation.

Existing `/collage` behavior must not regress as a side effect of this refactor.

### 2.4 Telegram composer gets compact Layout Tools

When a Prompt source has 2+ preview images, the Telegram composer should expose a compact collage configuration surface, preferably as a context/popover/menu panel rather than duplicating the full `/collage` page.

It should reuse the semantics already proven in `/collage`, including at minimum:

```text
Constraint Mode
  - Controlled
  - Free

Canvas Ratio
Canvas Orientation
  - Vertical
  - Horizontal

Shuffle Layout
Shuffle / rearrange image assignment
Reset collage layout
```

If image reordering can reuse the existing Telegram/managed uploader ordering affordance cleanly, reuse it. Otherwise expose the smallest dedicated reorder control needed by the collage preview.

Do not silently change the default behavior of the standalone `/collage` page. Telegram may have its own initial collage preset, but that preset must use the same underlying contracts.

### 2.5 Telegram preview must preview the real publish artifact

For a multi-image Prompt in collage mode, the right-side Telegram preview must display the generated collage as the single Telegram photo, not the old album preview.

Changing ratio/orientation/constraint/shuffle must update the local preview without network upload.

### 2.6 Prompt Telegram CTA goes directly to the noindex unlock/acquisition surface

Keep the accepted start parameter stable:

```text
prompt_<publicId>
```

Change only its Mini App route resolution:

```text
CURRENT:
prompt_<publicId> -> /prompt/<publicId>

TARGET:
prompt_<publicId> -> /prompts?id=<publicId>
```

`/prompts` is already an application/noindex route in `shared/seo-route-policy.ts`.

The public SEO Prompt route remains unchanged and continues to exist for web discovery, search, sharing and ordinary public browsing:

```text
/prompt/<publicId>
/fa/prompt/<publicId>
```

Telegram distribution must not require a visit to that public route before unlock.

Do not invent a second unlock page if `/prompts?id=<publicId>` continues to be the accepted protected Prompt surface.

---

## 3. Existing infrastructure to reuse

### 3.1 Shared Telegram composer

```text
app/components/manage/TelegramPostComposer.vue
```

It already owns:

- caption editing,
- prepared local media,
- external persisted media URLs,
- CTA inputs,
- Telegram preview,
- idempotency key regeneration,
- deferred upload during Publish,
- call to the shared Admin Telegram API.

Do not fork this component into a Prompt-only composer.

Prompt-specific collage behavior should be activated from the existing source identity, not by creating another publishing stack.

### 3.2 Prompt adapter

```text
app/components/manage/ArchiveTelegramAdapter.vue
```

It remains the Prompt Archive -> Telegram adapter and continues to prefill immutable/persisted Prompt data.

### 3.3 Managed media pipeline

Reuse:

```text
app/components/manage/ManagedImageUploader.vue
app/composables/useAdminManagedMedia.ts
app/utils/managedImageProcessing.ts
backend/src/adminManagedMediaRoute.mjs
```

The browser may turn a collage Blob into a named `File`, then reuse the existing managed image preparation pipeline so the generated Telegram collage receives the same WebP/thumbnail/storage treatment as other managed Telegram images.

The server remains responsible for allow-listed scope and derived Object Storage keys.

### 3.4 Shared Telegram backend publisher

Reuse unchanged unless a concrete contract gap is discovered:

```text
backend/src/telegramPublisher.mjs
backend/src/telegramPublishing.mjs
backend/src/adminTelegramRoute.mjs
```

The target outcome is that Prompt collage publication arrives at the publisher with exactly one photo URL, naturally selecting the existing `sendPhoto` path.

---

## 4. Important preflight risk: remote images and Canvas CORS

Prompt Archive prefills persisted public HTTPS image URLs, while the standalone Collage page primarily works with browser-loaded image inputs.

Before implementation, verify that persisted Arvan preview URLs can be fetched/decoded client-side and drawn onto Canvas without tainting the Canvas export path.

Required preflight:

1. Load representative persisted Prompt full/thumbnail URLs through the proposed client collage loader.
2. Render them to Canvas.
3. Confirm `canvas.toBlob(...)` / existing `getExportBlob(...)` succeeds.
4. Confirm the resulting Blob can pass through managed image preparation.

If Object Storage CORS prevents this, do **not** silently add backend rendering or production storage configuration changes. Stop, document the exact failure, and choose the smallest explicitly approved remedy. The architecture should remain client-rendered even if a minimal authenticated fetch/proxy transport eventually becomes necessary.

---

## 5. Implementation slices

### Slice H1 — Reusable Collage core audit/refactor

Goal: make the proven Collage layout/render/export path consumable by Telegram without changing `/collage` behavior.

Tasks:

1. Identify the smallest reusable state/config object for image collage rendering.
2. Reuse `createCollageLayout`, renderer drawing logic, aspect-ratio constants and shuffle logic.
3. Extract a reusable Layout Tools UI component only where doing so reduces duplication and preserves the existing page behavior.
4. Keep video, branding, watermark, text overlay and unrelated `/collage` features out of Telegram scope.
5. Add focused regression coverage for any extracted layout/config helpers.

Acceptance:

- standalone `/collage` still behaves as before,
- Telegram can create/render a collage using the same layout contracts,
- no duplicated layout algorithm exists.

### Slice H2 — Prompt collage mode inside Telegram composer

Goal: make multi-image Prompt publications preview as one locally generated photo.

Tasks:

1. Detect Prompt source + 2 or more Prompt preview images.
2. Initialize local Telegram collage state.
3. Render the collage in-browser from the source images.
4. Add compact Layout Tools context/popover UI.
5. Wire ratio/orientation/constraint/shuffle/reset controls.
6. Update Telegram preview to show the generated single-image artifact.
7. Ensure reset restores the adapter-provided initial state.

Acceptance:

- 2+ Prompt images automatically enter the intended collage flow,
- operator can tune layout without leaving the composer,
- no upload occurs while editing,
- Campaign and manual composer behavior remains unchanged unless explicitly applicable.

### Slice H3 — Client export + deferred managed upload

Goal: publish the generated collage through the already accepted managed-media pipeline.

Tasks:

1. Export the current Telegram collage Canvas to Blob.
2. Convert/wrap it as a browser `File` with a supported image MIME/extension.
3. Reuse `prepareManagedImage` / managed image contracts to create uploadable full + thumbnail blobs.
4. Upload only during Publish using scope `telegram`.
5. Cache the uploaded generated collage URL for retry within the same composer session, matching current prepared-media behavior.
6. Invalidate the cached generated URL whenever the collage inputs/layout change.
7. Submit exactly one generated collage URL as Prompt publication media.

Acceptance:

- Prompt with 2+ previews reaches backend publisher as one photo,
- backend naturally uses `sendPhoto`,
- caption + inline CTA are one Telegram post,
- no unnecessary new storage system or endpoint is introduced.

### Slice H4 — Direct Telegram Prompt unlock routing

Goal: remove the unnecessary public SEO hop for Telegram traffic.

Tasks:

1. Keep `prompt_<publicId>` startParam unchanged.
2. Change `app/plugins/telegram.client.ts` Prompt mapping to:

```text
/prompts?id=<publicId>
```

3. Preserve Campaign start-param routing unchanged.
4. Verify authentication/login return behavior does not lose the Prompt id/context.
5. Add/extend a focused client routing contract test so the Prompt mapping cannot regress to Home or the public SEO route accidentally.

Acceptance:

- Telegram Get Prompt opens the protected/noindex Prompt surface directly,
- public `/prompt/<id>` remains unchanged for SEO/web discovery,
- Campaign CTA still opens the correct Campaign route.

### Slice H5 — Founder-local end-to-end verification

Use a real published Prompt with several persisted preview images.

Required verification matrix:

```text
Prompt 0 images  -> text publication still works
Prompt 1 image   -> existing single-photo path still works
Prompt 2+ images -> one collage photo post, not Telegram album + CTA message
Campaign         -> existing accepted single-image behavior unchanged
```

For a representative 4-5 image Prompt:

1. Open Telegram composer from `/manage/archive`.
2. Confirm generated collage preview appears.
3. Exercise Layout Tools:
   - Free / Controlled
   - ratio
   - orientation
   - shuffle layout
   - rearrangement/shuffle images
   - reset
4. Publish to the test Telegram channel.
5. Confirm the channel receives one photo post containing caption + CTA buttons.
6. Forward that post and confirm the complete actionable post forwards together.
7. Tap `Get Prompt`.
8. Confirm Mini App opens directly on `/prompts?id=<publicId>` (or localized equivalent produced by the existing app routing rules), not `/prompt/<publicId>` and not Home.
9. Confirm the existing Goin unlock/copy flow remains functional.
10. Re-test one Campaign Telegram CTA to ensure TG4 routing did not regress.

After Founder-local verification, record an acceptance checkpoint in docs.

---

## 6. Verification/rebuild discipline

Follow `docs/strategy/DEVELOPMENT_WORKFLOW.md`.

This architecture is intentionally frontend-first and should require no backend runtime change if the existing managed-media and shared Telegram contracts are sufficient.

Expected normal verification scope:

```text
frontend/shared UI/client logic changed -> pnpm frontend
backend unchanged                       -> do not run pnpm api just for reassurance
```

Run focused tests before requesting a Docker rebuild when possible.

If implementation discovers a real backend contract gap, document it first and expand rebuild scope only to the service actually changed.

Do not run `pnpm stack` unless topology/shared runtime genuinely changes.

Note: the frontend Dockerfile now has a separate `pnpm fetch` dependency cache layer. After the first cache-warming build, ordinary source-only frontend rebuilds should reuse dependency fetch cache while still rebuilding the Nuxt bundle.

---

## 7. Non-goals / forbidden side effects

This hardening must not:

- create a Prompt-specific Telegram backend publisher,
- create a second managed-media/storage system,
- create a backend collage renderer by default,
- remove generic Telegram album support,
- alter Campaign business/runtime authority,
- alter Campaign measurement/reconciliation logic,
- reopen CE6.1 as part of this work,
- remove the public SEO Prompt route,
- change production DNS/Tunnel/Worker settings,
- change `NUXT_PUBLIC_NOINDEX=true`,
- enable production indexability,
- change Goin authority or introduce a second wallet/unlock ledger.

Telegram remains only a distribution and entry surface. Prompt Draft remains the authority for unlock/payment/copy behavior.

---

## 8. CE6 coordination checkpoint

At the time this document was created, `CAMPAIGN_ENGINE_STATUS.md` reports:

```text
CE6 Measurement & Reconciliation -> IN PROGRESS
CE6.1 Measurement Summary        -> IMPLEMENTED / VERIFICATION PENDING
```

Founder direction is to pause further CE6 implementation while this Telegram Prompt hardening is completed.

A future implementation chat must still re-read the latest branch before any write, because parallel work may have changed HEAD. Do not overwrite or revert CE6.1 changes.

Once this hardening is Founder-local verified and documented, CE6 may resume from its then-current canonical status.

---

## 9. Source-of-truth reading list for the implementation chat

Read these from the latest `feature/growth-foundation` HEAD before implementation:

```text
docs/strategy/DEVELOPMENT_WORKFLOW.md
docs/strategy/UI_IMPLEMENTATION_GUIDELINES.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG1_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG2_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG3_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PUBLISHING_SYSTEM_TG4_IMPLEMENTATION.md
docs/strategy/TELEGRAM_PROMPT_COLLAGE_DIRECT_UNLOCK_HARDENING.md
```

Then audit current implementations of:

```text
app/pages/collage.vue
app/composables/collage/useCollagePage.ts
app/composables/collage/useCollageRenderer.ts
app/composables/collage/useCollageExport.ts
app/utils/collage/**
app/constants/collage.ts
app/types/collage.ts

app/components/manage/ArchiveTelegramAdapter.vue
app/components/manage/TelegramPostComposer.vue
app/components/manage/ManagedImageUploader.vue
app/composables/useAdminManagedMedia.ts
app/utils/managedImageProcessing.ts
app/plugins/telegram.client.ts

app/pages/prompt/[id].vue
app/pages/prompts.vue
shared/seo-route-policy.ts

backend/src/telegramPublisher.mjs
backend/src/telegramPublishing.mjs
backend/src/adminManagedMediaRoute.mjs
```

Do not assume the file list is exhaustive if latest HEAD has evolved.

---

## 10. Definition of Done

This hardening is complete only when all of the following are true:

```text
[ ] Existing /collage behavior remains intact.
[ ] Telegram Prompt multi-image layout reuses the established Collage engine.
[ ] Compact Layout Tools are available in Prompt Telegram composer.
[ ] Collage is rendered fully client-side.
[ ] Generated collage is not uploaded before Publish.
[ ] Existing managed-media pipeline stores the final Telegram collage.
[ ] Prompt with 2+ images publishes as one Telegram photo post.
[ ] Caption and CTA keyboard belong to that same Telegram post.
[ ] Forwarded Prompt post remains actionable.
[ ] prompt_<publicId> routes directly to /prompts?id=<publicId>.
[ ] Public /prompt/<publicId> route is preserved.
[ ] Existing Goin unlock/copy flow still works.
[ ] Campaign Telegram publishing/routing still works.
[ ] No CE6.1 work is reverted or overwritten.
[ ] Founder-local E2E verification is recorded.
```
