import { getPermittedManageSections } from "~/config/manage";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;

  const localePath = useLocalePath();
  const manageRoot = localePath("/manage");
  if (to.path !== manageRoot) return;

  const auth = useAuth();
  await auth.initialize();

  if (!auth.isLoggedIn.value) {
    return navigateTo({
      path: localePath("/login"),
      query: {
        next: to.fullPath || manageRoot,
      },
    });
  }

  const firstAdministrativeSection = getPermittedManageSections(auth.can)[0];
  return navigateTo(
    localePath(firstAdministrativeSection?.route ?? "/manage/profile"),
    { replace: true },
  );
});
