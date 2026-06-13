export const useClipboard = () => {
  const { showToast } = useToast()

  const copyText = async (text: string | number) => {
    if (!import.meta.client) return

    const value = String(text)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(value)
        showToast('success', 'با موفقیت کپی شد')
      } catch {
        showToast('error', 'کپی انجام نشد')
      }

      return
    }

    const textArea = document.createElement('textarea')
    textArea.value = value
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      showToast(
        successful ? 'success' : 'error',
        successful ? 'با موفقیت کپی شد' : 'کپی نشد',
      )
    } catch {
      showToast('error', 'خطایی در کپی کردن پیش آمده')
    }

    document.body.removeChild(textArea)
  }

  return {
    copyText,
  }
}