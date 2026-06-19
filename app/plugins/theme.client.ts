export default defineNuxtPlugin(() => {
  const { initTheme, syncThemeWithOS, isThemeReady } = useTheme()

  onNuxtReady(() => {
    initTheme()
    // syncThemeWithOS()
  })
})