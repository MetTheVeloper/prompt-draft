export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return;

  return navigateTo("/manage/dashboard", { replace: true });
});
