import type { AuthPermission } from "~/config/authorization";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const requiredPermission = to.meta.requiredPermission as
    | AuthPermission
    | undefined;

  if (!requiredPermission) return;

  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    const next = encodeURIComponent(to.fullPath || "/");
    return navigateTo(`/login?next=${next}`);
  }

  if (!auth.can(requiredPermission)) {
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "You do not have permission to access this page.",
      }),
    );
  }
});
