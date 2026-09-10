import ManageBlogLinkModal from '~/components/manage/ManageBlogLinkModal.vue'

export type BlogLinkModalInsert = {
  label: string
  url: string
}

export function useBlogLinkModal() {
  const modal = useModal()
  const { t } = useI18n()

  function open(options: {
    initialLabel?: string
    onInsert: (value: BlogLinkModalInsert) => void | Promise<void>
  }) {
    return modal.open({
      header: {
        icon: 'link',
        title: t('manage.blog.markdown.linkModalTitle'),
        closeButton: true,
      },
      component: ManageBlogLinkModal,
      props: {
        initialLabel: options.initialLabel || '',
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
