# Prompt Archive — Stage 2

This patch adds the `/prompts` gallery only. Prompt detail rendering for `/prompts?id=<id>` is intentionally deferred to the next stage.

## New files

- `app/pages/prompts.vue`
- `app/components/prompts/PromptCard.vue`
- `app/composables/usePromptArchive.ts`
- `scripts/i18n-patches/en.prompts.ts`
- `scripts/i18n-patches/fa.prompts.ts`

## Existing files replaced by this patch

- `app/config/navigation.ts` — adds `/prompts` to the header navigation.
- `scripts/generate-offline-manifest.ts` — excludes `public/prompts/**` from the installable offline package. Viewed WebP images are still runtime-cached by the existing service worker.

If either existing file has local changes, merge the small relevant changes instead of blindly replacing it.

## Required Stage 1 files

This patch expects these to already exist:

- `app/types/promptArchive.ts`
- `public/data/prompts.json`
- `public/prompts/<id>/*.webp`

## i18n merge

Merge the new patches using the existing helper:

```bash
pnpm tsx scripts/merge-i18n.ts --locale en --patch scripts/i18n-patches/en.prompts.ts --write
pnpm tsx scripts/merge-i18n.ts --locale fa --patch scripts/i18n-patches/fa.prompts.ts --write
```

## Gallery behavior

- Search: title, full prompt text, tags, and message ID.
- Filters: generator model and tag.
- Sort: newest / oldest.
- Initial render: 24 cards, then load more in batches of 24.
- Preview images use native lazy loading.
- Telegram button opens the original channel post.
- `/prompts?id=<id>` detail rendering is not implemented in this stage.
