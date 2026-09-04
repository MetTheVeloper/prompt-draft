import EmailRequirementModal from "~/components/auth/EmailRequirementModal.vue";

export type EmailRequirementOptions = {
  from: string;
  onCompleted?: () => void | Promise<void>;
};

export function useEmailRequirement() {
  const { t } = useI18n();
  const auth = useAuth();
  const modal = useModal();

  async function requireEmail(options: EmailRequirementOptions) {
    if (auth.isLoggedIn.value && auth.hasProfileField("email")) {
      await options.onCompleted?.();
      return true;
    }

    modal.open({
      header: {
        icon: "mail",
        title: t("auth.emailRequirement.title"),
        subtitle: t("auth.emailRequirement.subtitle"),
        color: "prim",
        closeButton: true,
      },
      descriptions: t("auth.emailRequirement.description"),
      component: EmailRequirementModal,
      props: {
        from: options.from,
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

  return {
    requireEmail,
  };
}
