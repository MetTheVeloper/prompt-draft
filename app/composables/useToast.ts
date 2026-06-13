type ToastMode = 'success' | 'error' | 'warning' | 'info'

type ToastData = {
  msg: string
  mode: ToastMode | ''
  duration: number
  show: boolean
  icon?: string
  style?: string
}

export const useToast = () => {
  const toastData = useState<ToastData>('toastData', () => ({
    msg: '',
    mode: '',
    duration: 0,
    show: false,
    icon: '',
    style: '',
  }))

  const toastDefaultDuration = 1000

  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const hideToast = () => {
    toastData.value.show = false
  }

  const showToast = (
    mode: ToastMode = 'info',
    msg: string,
    duration = toastDefaultDuration,
  ) => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }

    let color = 'blue'
    let icon = 'information'

    switch (mode) {
      case 'success':
        color = 'green'
        icon = 'tick-square'
        break

      case 'error':
        color = 'red'
        icon = 'warning-2'
        break

      case 'warning':
        color = 'orange'
        icon = 'warning-2'
        break

      case 'info':
      default:
        color = 'blue'
        icon = 'information'
        break
    }

    toastData.value = {
      mode,
      msg,
      duration,
      icon,
      style: `gr-${color}95 bc-${color}`,
      show: true,
    }

    toastTimer = setTimeout(() => {
      hideToast()
    }, duration)
  }

  return {
    toastData,
    toastDefaultDuration,
    showToast,
    hideToast,
  }
}