export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as any

  function getLocaleValue() {
    const value = i18n.locale

    return typeof value === 'string'
      ? value
      : value.value
  }

  function getLocalesValue() {
    const value = i18n.locales

    return Array.isArray(value)
      ? value
      : value?.value || []
  }

  function getLocaleMeta(value: string) {
    const normalizedLocale = String(value || 'en').split('-')[0]
    const localeMeta = getLocalesValue().find((item: any) => {
      if (typeof item === 'string') return item === normalizedLocale
      return item?.code === normalizedLocale
    })

    if (typeof localeMeta === 'object' && localeMeta) {
      return {
        lang: localeMeta.code || normalizedLocale,
        dir: localeMeta.dir === 'rtl' ? 'rtl' : 'ltr',
      }
    }

    return {
      lang: normalizedLocale,
      dir: normalizedLocale === 'fa' || normalizedLocale === 'ar' ? 'rtl' : 'ltr',
    }
  }

  function syncLocaleDom(value: string) {
    if (!import.meta.client) return

    const { lang, dir } = getLocaleMeta(value)

    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', dir)

    document.body.setAttribute('lang', lang)
    document.body.setAttribute('dir', dir)

    const teleports = document.getElementById('teleports')

    if (teleports) {
      teleports.setAttribute('lang', lang)
      teleports.setAttribute('dir', dir)
    }
  }

  function syncSoon(value: string) {
    syncLocaleDom(value)

    nextTick(() => {
      syncLocaleDom(value)

      requestAnimationFrame(() => {
        syncLocaleDom(value)
      })
    })
  }

  watch(
    () => getLocaleValue(),
    value => {
      syncSoon(value)
    },
    {
      immediate: true,
      flush: 'post',
    },
  )

  onNuxtReady(() => {
    syncSoon(getLocaleValue())
  })
})