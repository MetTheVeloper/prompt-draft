// app/plugins/collect-missing-i18n-keys.client.ts

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return

  const missingKeys = new Set<string>()
  const originalWarn = console.warn

  const dump = async () => {
    const list = [...missingKeys].sort()
    const text = list.join('\n')

    console.clear()
    console.table(list)

    try {
      await navigator.clipboard.writeText(text)
      console.info(`Copied ${list.length} missing i18n keys to clipboard.`)
    } catch {
      console.info(text)
    }

    return list
  }

  ;(window as any).__missingI18nKeys = missingKeys
  ;(window as any).dumpMissingI18nKeys = dump

  console.warn = (...args) => {
    const text = args.map(String).join(' ')

    const match = text.match(
      /'([^']+)'\s+key in\s+'([^']+)'\s+locale messages/
    )

    if (match) {
      const key = match[1]
      const locale = match[2]

      if (locale === 'en') {
        missingKeys.add(key)
      }
    }

    originalWarn(...args)
  }
})