import BlogImageLightboxModal from '~/components/blog/BlogImageLightboxModal.vue'

export type BlogImageLightboxInput = {
  src: string
  alt?: string
}

export function useBlogImageLightbox() {
  const modal = useModal()
  const { t } = useI18n()

  function open(input: BlogImageLightboxInput) {
    const src = typeof input.src === 'string' ? input.src.trim() : ''
    if (!src) return null

    const alt = typeof input.alt === 'string' ? input.alt.trim() : ''

    return modal.open({
      header: {
        icon: 'zoom_in',
        title: t('blog.imagePreview'),
        subtitle: alt || undefined,
        closeButton: true,
      },
      component: BlogImageLightboxModal,
      props: {
        src,
        alt,
      },
      options: {
        width: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })
  }

  return { open }
}
