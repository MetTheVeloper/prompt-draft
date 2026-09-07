import { AUTH_PERMISSIONS } from "~/config/authorization";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const getRouteBaseName = useRouteBaseName();
  if (getRouteBaseName(to) !== "collage") return;

  const localePath = useLocalePath();
  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    return navigateTo({
      path: localePath("/login"),
      query: {
        next: to.fullPath || localePath("/collage"),
      },
    });
  }

  if (!auth.can(AUTH_PERMISSIONS.COLLAGE_VIEW)) {
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "You do not have permission to access this page.",
      }),
    );
  }
});
