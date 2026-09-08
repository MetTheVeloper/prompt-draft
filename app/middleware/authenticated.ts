export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const localePath = useLocalePath();
  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    return navigateTo({
      path: localePath("/login"),
      query: {
        next: to.fullPath || localePath("/"),
      },
    });
  }
});
