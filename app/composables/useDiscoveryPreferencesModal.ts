import DiscoveryPreferencesModal from '~/components/growth/DiscoveryPreferencesModal.vue'
import type { DiscoveryInterestKey } from '~/composables/useDiscoveryPreferences'

export type DiscoveryPreferencesModalOptions = {
  onSaved?: (interests: DiscoveryInterestKey[]) => void | Promise<void>
}

export function useDiscoveryPreferencesModal() {
  const modal = useModal()

  function open(options: DiscoveryPreferencesModalOptions = {}) {
    return modal.open({
      header: null,
      component: DiscoveryPreferencesModal,
      props: {
        onSaved: options.onSaved,
      },
      options: {
        width: 720,
        maxHeight: '90vh',
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })
  }

  return {
    open,
  }
}
