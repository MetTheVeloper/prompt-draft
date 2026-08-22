export function useCatalogI18n(moduleKey: string) {
  const { t } = useI18n()

  function catalogText(path: string, fallback = '') {
    const key = `modules.${moduleKey}.catalog.${path}`
    const translated = t(key)
    return translated === key ? fallback : translated
  }

  return {
    catalogText,
  }
}
