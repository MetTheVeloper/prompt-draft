import { AUTH_PERMISSIONS } from "~/config/authorization";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client || to.path !== "/collage") return;

  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    const next = encodeURIComponent(to.fullPath || "/collage");
    return navigateTo(`/login?next=${next}`);
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
