import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: false,
    theme: null,
    project: null,
    settings: {
      mainSize: 14,
      globalSize: 24,
    },
    uiState: 'loading',
  }),
  actions: {
    setValue(key, val) {
      this[key] = val;
    }
  },
});
