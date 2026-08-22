export function useCatalogI18n(moduleKey: string) {
  const { t } = useI18n()

  function catalogText(path: string, fallback = '') {
    const key = `modules.${moduleKey}.catalog.${path}`
    const translated = t(key)
    return translated === key ? fallback : translated
  }

  function uiText(path: string, fallback = '') {
    const key = `modules.${moduleKey}.ui.${path}`
    const translated = t(key)
    return translated === key ? fallback : translated
  }

  function propertyLabel(propertyId: string, fallback = '') {
    return catalogText(`properties.${propertyId}.label`, fallback)
  }

  function optionLabel(propertyId: string, value: string, fallback = '') {
    return catalogText(`properties.${propertyId}.options.${value}`, fallback)
  }

  function itemLabel(collection: string, id: string, fallback = '') {
    return catalogText(`${collection}.${id}.label`, fallback)
  }

  function itemDescription(collection: string, id: string, fallback = '') {
    return catalogText(`${collection}.${id}.description`, fallback)
  }

  return {
    catalogText,
    uiText,
    propertyLabel,
    optionLabel,
    itemLabel,
    itemDescription,
  }
}
