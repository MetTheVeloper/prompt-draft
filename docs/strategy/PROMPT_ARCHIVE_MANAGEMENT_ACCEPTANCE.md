# Prompt Archive Management + Image Workflow — Acceptance Checkpoint

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-14**

Date: 2026-09-14

Branch: `feature/growth-foundation`

Acceptance implementation HEAD before this documentation closure:

```text
61ec45217a0fd413513ab36bcc1609de6b728b2b
```

## 1. Scope accepted

This checkpoint closes the Prompt Archive operator workflow that was hardened while integrating the shared Telegram Archive adapter.

Accepted management scope:

```text
/manage/archive editor lifecycle
create vs edit save semantics
published/draft/archived status preservation
explicit status transitions
Archive model metadata
prepared-image browser pipeline
multi-image batch preparation
persisted image reorder/delete behavior
Arvan-backed persisted media workflow
```

This is an operator-management acceptance checkpoint. It does not make protected Archive detail public and does not alter the accepted public Prompt privacy/indexability contracts.

## 2. Publication-status contract

Metadata/media edits are ordinary edits. They must not silently change publication state.

Frozen behavior:

```text
new item / draft item
  -> primary action: Save as draft

published or archived item
  -> primary action: Update changes
  -> saving metadata preserves current status
  -> uploading prepared media preserves current status
  -> deleting persisted media preserves current status
  -> reordering persisted media preserves current status

status changes
  -> only explicit Publish / Move to draft / Archive / Restore draft actions may change status
```

Implementation checkpoint:

```text
5e12bb76cb71f475f12a52cb69067ba5576ad21e
fix: preserve Archive publication status on edits
```

The related EN/FA operator copy was aligned with the same rule so the UI no longer claims that image edits implicitly move a published item back to draft.

## 3. Accepted image preparation contract

Current browser-side Archive image preparation remains:

```text
accepted source formats  -> JPEG / PNG / WebP with matching extension
full image max edge      -> 2048
thumbnail max edge       -> 640
full output              -> WebP, quality 0.60
thumbnail output         -> WebP, quality 0.72
orientation handling     -> createImageBitmap imageOrientation where available, HTMLImageElement fallback
selection modes          -> file picker / drag-drop / clipboard paste
batch selection          -> supported
```

Prepared images remain local browser state until the Archive save flow persists them through the existing backend/storage path.

## 4. Multi-image batch synchronization fix

Founder testing exposed a state synchronization race in `ArchiveImageManager.vue` when multiple images were selected together.

Observed failure before the fix:

```text
image 1 -> could remain stuck at Preparing
image 2 -> could become Ready
primary save action -> remained blocked because stale processing state survived
```

Root cause:

```text
child emits update:modelValue
-> parent v-model update had not yet flushed back into the child prop
-> next batch iteration read stale items.value
-> the next mutation could reintroduce an earlier image's processing state
```

Accepted repair:

```text
61ec45217a0fd413513ab36bcc1609de6b728b2b
fix: sync Archive image batch preparation state
```

The component now flushes the parent/child v-model update with `nextTick()` before the next dependent batch mutation. Initial insertion, success and error paths all use the synchronized update path.

## 5. Founder-local acceptance evidence

Founder-local/manual verification completed on 2026-09-14 after the frontend implementation was rebuilt.

Verified behavior includes:

```text
published Archive item -> Update changes is the primary save action
published Archive item -> Move to draft remains a separate explicit action
metadata save          -> publication status is preserved
persisted media edits  -> publication status is preserved
new/draft item         -> Save as draft remains correct
multi-image selection  -> all selected images complete preparation correctly
batch preparation      -> no earlier image remains stuck in stale Preparing state
all images Ready       -> primary save action becomes available again
```

The founder explicitly confirmed the final multi-image test was fully correct. This workflow is therefore accepted and should not be reopened without a concrete regression.

## 6. Related implementation checkpoints

```text
0942b4ff469b6bd1aee8425cf5914b8c8d10102e
feat: expand Archive model metadata

5e12bb76cb71f475f12a52cb69067ba5576ad21e
fix: preserve Archive publication status on edits

61ec45217a0fd413513ab36bcc1609de6b728b2b
fix: sync Archive image batch preparation state
```

Telegram-specific prefill/publishing behavior is documented separately under the TG3 record. This acceptance closes Archive management/image behavior only; it must not be used to fabricate Telegram-specific verification evidence that was not part of this final image-workflow test.

## 7. Authority boundaries preserved

```text
Archive DB/backend state -> authoritative persisted item/status/media state
browser prepared images  -> transient editor state only
explicit status routes   -> only publication-state mutation path
Arvan storage            -> persisted Archive media storage
shared Telegram ledger   -> Telegram publication history/authority
legacy telegram fields   -> compatibility/source metadata only
```

Do not turn editor state into canonical state. Do not collapse shared Telegram publication history back into one legacy Archive Telegram scalar field.

Production/indexability invariants are unchanged:

```text
NUXT_PUBLIC_NOINDEX=true -> KEEP
prompt-draft.ir noindex  -> KEEP while SEO launch is deferred
grassic.ir noindex       -> KEEP
```

## 8. Verification/rebuild note

This acceptance update is documentation-only.

Per `DEVELOPMENT_WORKFLOW.md`:

```text
no Docker rebuild is required for this documentation closure
```

## 9. Transition

Archive management/image workflow is now closed.

The broader pre-scale execution order remains governed by `CAMPAIGN_ENGINE_STATUS.md` and the Telegram TG3 checkpoint. Archive acceptance by itself does not silently mark the entire TG3 Telegram adapter accepted; the remaining TG3-specific acceptance gate must be recorded explicitly before CE5 begins.