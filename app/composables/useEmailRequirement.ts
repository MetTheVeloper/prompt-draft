import EmailRequirementModal from "~/components/auth/EmailRequirementModal.vue";

export type EmailRequirementOptions = {
  from: string;
  onCompleted?: () => void | Promise<void>;
};

export function useEmailRequirement() {
  const auth = useAuth();
  const modal = useModal();

  async function requireEmail(options: EmailRequirementOptions) {
    if (auth.isLoggedIn.value && auth.hasProfileField("email")) {
      await options.onCompleted?.();
      return true;
    }

    modal.open({
      header: null,
      component: EmailRequirementModal,
      props: {
        from: options.from,
        onCompleted: options.onCompleted,
      },
      options: {
        width: 470,
        maxHeight: "90vh",
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
