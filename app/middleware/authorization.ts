import type { AuthPermission } from "~/config/authorization";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const requiredPermission = to.meta.requiredPermission as
    | AuthPermission
    | undefined;

  if (!requiredPermission) return;

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
