export default defineNuxtPlugin(() => {
  const route = useRoute()
  const getRouteBaseName = useRouteBaseName()
  const { t } = useI18n()

  const baseRouteName = computed(() => getRouteBaseName(route) || String(route.name || ''))
  const policy = computed(() => {
    if (baseRouteName.value === 'index') {
      return {
        enabled: true,
        title: 'Prompt Draft',
        description: t('growth.home.description'),
        canonicalPath: '/',
      }
    }

    if (baseRouteName.value === 'guide') {
      return {
        enabled: true,
        title: t('guide.title'),
        description: t('guide.description'),
        canonicalPath: '/guide',
      }
    }

    return {
      enabled: false,
      title: 'Prompt Draft',
      description: '',
      canonicalPath: '',
    }
  })

  usePublicSeo({
    enabled: () => policy.value.enabled,
    title: () => policy.value.title,
    description: () => policy.value.description,
    canonicalPath: () => policy.value.canonicalPath,
  })
})
