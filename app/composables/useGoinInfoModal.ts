import GoinInfoModal from "~/components/economy/GoinInfoModal.vue";

export function useGoinInfoModal() {
  const modal = useModal();
  const { t } = useI18n();

  function open() {
    return modal.open({
      header: {
        icon: "paid",
        title: t("growth.goin.title"),
        subtitle: t("growth.goin.subtitle"),
        closeButton: true,
        color: "orange",
      },
      component: GoinInfoModal,
      options: {
        width: 640,
        maxHeight: "88vh",
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    });
  }

  return { open };
}
