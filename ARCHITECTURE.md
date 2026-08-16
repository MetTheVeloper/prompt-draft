# Prompt Archive — Stage 1

## Repository placement

- `app/pages/prompts.vue`: static Nuxt route for both list and query-driven detail view (`/prompts?id=503`).
- `app/components/prompts/*`: gallery/list/detail UI components.
- `app/composables/usePromptArchive.ts`: fetch, search, filters, selected-id lookup.
- `app/types/promptArchive.ts`: archive schema types.
- `public/data/prompts.json`: archive metadata and full prompt text.
- `public/prompts/<telegram-message-id>/<index>.webp`: optimized media associated with the Telegram prompt post.

## Model boundary

Telegram message `394`, published at `2025-12-26T13:03:34+03:30`, announces the switch from DALL·E to GPT-Image-1.

- Prompt message IDs before `394`: `dall-e`
- Prompt message IDs after `394`: `gpt-image-1`

The announcement itself is not a prompt item.

## Media

The current dataset contains all media associated with each prompt post/album. It does not yet classify each image as `reference/input` vs `generated preview`; that distinction is intentionally deferred because Telegram albums are inconsistent and automatic classification would be error-prone.

Images are converted to WebP, maximum 1280 px on the longest edge, quality 82.

## PWA/offline behavior

`generate-offline-manifest.ts` currently includes every generated public file. Before merging the prompt images into the repository, exclude `/prompts/**` from the offline package manifest so the gallery does not inflate the explicit offline download by ~30 MB. Keep `/data/prompts.json` in the offline package. The existing service worker already runtime-caches `.webp` files as they are viewed.
