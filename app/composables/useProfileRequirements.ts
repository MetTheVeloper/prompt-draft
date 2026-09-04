import ProfileRequirementModal from "~/components/auth/ProfileRequirementModal.vue";
import type { AuthProfileField } from "~/types/auth";

export type ProfileRequirementOptions = {
  title?: string;
  subtitle?: string;
  description?: string;
  onCompleted?: () => void | Promise<void>;
};

function normalizeFields(fields: AuthProfileField[]) {
  return [...new Set(fields)].filter((field) => {
    return field === "username" || field === "email";
  });
}

export function useProfileRequirements() {
  const { t } = useI18n();
  const auth = useAuth();
  const modal = useModal();

  function getMissingProfileFields(fields: AuthProfileField[]) {
    const required = normalizeFields(fields);

    if (!auth.user.value) return required;

    return required.filter((field) => !auth.hasProfileField(field));
  }

  function isProfileSatisfied(fields: AuthProfileField[]) {
    return getMissingProfileFields(fields).length === 0;
  }

  function requireProfileFields(
    fields: AuthProfileField[],
    options: ProfileRequirementOptions = {},
  ) {
    if (!auth.isLoggedIn.value) return false;

    const missingFields = getMissingProfileFields(fields);

    if (!missingFields.length) {
      void options.onCompleted?.();
      return true;
    }

    modal.open({
      header: {
        icon: "person_add",
        title: options.title || t("auth.profileCompletion.title"),
        subtitle: options.subtitle || t("auth.profileCompletion.subtitle"),
        color: "prim",
        closeButton: true,
      },
      descriptions:
        options.description || t("auth.profileCompletion.description"),
      component: ProfileRequirementModal,
      props: {
        fields: missingFields,
        onCompleted: options.onCompleted,
      },
      options: {
        width: 520,
        maxHeight: "85vh",
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    });

    return false;
  }

  function completeMissingIdentity(options: ProfileRequirementOptions = {}) {
    return requireProfileFields(["username", "email"], options);
  }

  return {
    getMissingProfileFields,
    isProfileSatisfied,
    requireProfileFields,
    completeMissingIdentity,
  };
}
