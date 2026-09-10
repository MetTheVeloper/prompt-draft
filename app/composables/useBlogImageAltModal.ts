import ManageBlogImageAltModal from '~/components/manage/ManageBlogImageAltModal.vue'
import type { BlogMediaAsset } from '~/types/blogMedia'

export function useBlogImageAltModal() {
  const modal = useModal()
  const { t } = useI18n()

  function open(options: {
    asset: BlogMediaAsset
    initialAlt?: string
    onInsert: (alt: string) => void | Promise<void>
  }) {
    return modal.open({
      header: {
        icon: 'image',
        title: t('manage.blog.markdown.imageAltModalTitle'),
        closeButton: true,
      },
      component: ManageBlogImageAltModal,
      props: {
        asset: options.asset,
        initialAlt: options.initialAlt || options.asset.alt || '',
        onInsert: options.onInsert,
      },
      options: {
        width: 520,
        maxHeight: '80vh',
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })
  }

  return { open }
}
