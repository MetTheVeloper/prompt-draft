export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return;

  const localePath = useLocalePath();
  return navigateTo(localePath("/manage/dashboard"), { replace: true });
});
