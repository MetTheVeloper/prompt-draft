import type { Ref } from "vue";
import { computed, watch } from "vue";

type ModulePanelCollapseGuardOptions = {
  expanded: Ref<boolean>;
  isCustomMode: () => boolean;
  getCustomValue: () => unknown;
};

/**
 * Keep a module panel open while Custom Override is active but still empty.
 *
 * The guard is intentionally presentation-only: it does not mutate custom mode,
 * authored values, compiler output, or persisted panel state. It only prevents
 * the editor surface that requires user input from being hidden.
 */
export function useModulePanelCollapseGuard(
  options: ModulePanelCollapseGuardOptions,
) {
  const isCollapseLocked = computed(() => {
    if (!options.isCustomMode()) return false;
    return !String(options.getCustomValue() ?? "").trim();
  });

  watch(
    isCollapseLocked,
    (locked) => {
      if (locked) options.expanded.value = true;
    },
    { immediate: true },
  );

  function togglePanel() {
    if (options.expanded.value && isCollapseLocked.value) return;
    options.expanded.value = !options.expanded.value;
  }

  return {
    isCollapseLocked,
    togglePanel,
  };
}
