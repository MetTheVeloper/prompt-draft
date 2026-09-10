import ManageBlogValidationModal from '~/components/manage/ManageBlogValidationModal.vue'
import type { BlogValidationIssue } from '~/shared/blog-article'

export function useBlogValidationModal() {
  const modal = useModal()
  const { t } = useI18n()

  function open(result: {
    ok: boolean
    issues: BlogValidationIssue[]
  }) {
    return modal.open({
      header: {
        icon: 'fact_check',
        title: t('manage.blog.editor.validationModalTitle'),
        closeButton: true,
      },
      component: ManageBlogValidationModal,
      props: {
        ok: result.ok,
        issues: result.issues,
      },
      options: {
        width: 560,
        maxHeight: '80vh',
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })
  }

  return { open }
}
