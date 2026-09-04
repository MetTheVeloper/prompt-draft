import { getPermittedManageSections } from "~/config/manage";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client || to.path !== "/manage") return;

  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    return navigateTo(`/login?next=${encodeURIComponent(to.fullPath || "/manage")}`);
  }

  const permittedSections = getPermittedManageSections(auth.can);
  const firstSection = permittedSections[0];

  if (!firstSection) {
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "You do not have permission to access the management workspace.",
      }),
    );
  }

  return navigateTo(firstSection.route, { replace: true });
});
