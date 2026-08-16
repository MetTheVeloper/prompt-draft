import type {
  PromptArchiveItem,
  PromptArchivePayload,
} from '~/types/promptArchive'

const ARCHIVE_URL = '/data/prompts.json'

export function usePromptArchive() {
  const payload = useState<PromptArchivePayload | null>(
    'prompt-archive-payload',
    () => null,
  )
  const pending = useState('prompt-archive-pending', () => false)
  const error = useState<string>('prompt-archive-error', () => '')

  const items = computed<PromptArchiveItem[]>(() => payload.value?.items || [])

  async function load(options: { force?: boolean } = {}) {
    if (payload.value && !options.force) return payload.value
    if (pending.value) return payload.value

    pending.value = true
    error.value = ''

    try {
      payload.value = await $fetch<PromptArchivePayload>(ARCHIVE_URL, {
        cache: options.force ? 'no-store' : 'default',
      })

      return payload.value
    } catch (cause) {
      console.error('[prompt archive] Failed to load archive:', cause)
      error.value = cause instanceof Error
        ? cause.message
        : 'prompt-archive-load-failed'

      return null
    } finally {
      pending.value = false
    }
  }

  return {
    payload,
    items,
    pending,
    error,
    load,
  }
}
