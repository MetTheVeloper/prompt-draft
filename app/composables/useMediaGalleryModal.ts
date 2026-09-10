import MediaGallery from '~/components/manage/MediaGallery.vue'
import type { BlogMediaAsset } from '~/types/blogMedia'

export function useMediaGalleryModal() {
  const modal = useModal()
  const { t } = useI18n()

  function open(options: {
    initialAsset?: BlogMediaAsset | null
    onSelect: (asset: BlogMediaAsset) => void | Promise<void>
  }) {
    return modal.open({
      header: {
        icon: 'photo_library',
        title: t('manage.blog.media.title'),
        subtitle: t('manage.blog.media.subtitle'),
        closeButton: true,
      },
      component: MediaGallery,
      props: {
        initialAsset: options.initialAsset || null,
        onConfirm: options.onSelect,
      },
      options: {
        width: 980,
        maxHeight: '90vh',
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })
  }

  return { open }
}
