import { getPermittedManageSections } from "~/config/manage";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const getRouteBaseName = useRouteBaseName();
  if (getRouteBaseName(to) !== "manage") return;

  const localePath = useLocalePath();
  const auth = useAuth();
  const { $i18n } = useNuxtApp();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    return navigateTo({
      path: localePath("/login"),
      query: {
        next: to.fullPath || localePath("/manage"),
      },
    });
  }

  const permittedSections = getPermittedManageSections(auth.can);
  const firstSection = permittedSections[0];

  if (!firstSection) {
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: $i18n.t("manage.errors.forbiddenTitle"),
        message: $i18n.t("manage.errors.forbiddenMessage"),
      }),
    );
  }

  return navigateTo(localePath(firstSection.route), { replace: true });
});
