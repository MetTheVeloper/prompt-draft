export default {
  app: {
    navigation: {
      history: "تاریخچه",
    },
  },
  history: {
    title: "تاریخچه",
    subtitle: "اجرای موفق Wizard که توسط Prompt Draft ذخیره شده‌اند.",
    loading: "در حال بارگذاری تاریخچه...",
    loadingMore: "در حال بارگذاری موارد بیشتر...",
    actions: {
      refresh: "به‌روزرسانی",
      retry: "تلاش دوباره",
      loadMore: "نمایش بیشتر",
      back: "بازگشت به تاریخچه",
      open: "باز کردن",
      copy: "کپی پرامپت",
      copied: "کپی شد",
    },
    empty: {
      title: "هنوز تاریخچه‌ای وجود ندارد",
      description: "اجرای موفق Wizard بعد از ذخیره شدن در اینجا نمایش داده می‌شود.",
    },
    error: {
      title: "تاریخچه در دسترس نیست",
      description: "Prompt Draft نتوانست اجراهای ذخیره‌شده Wizard را از backend دریافت کند.",
      loadMore: "بارگذاری صفحه بعدی تاریخچه ناموفق بود.",
    },
    run: {
      wizard: "{id} · نسخه {version}",
    },
    detail: {
      title: "اجرای ذخیره‌شده",
      loading: "در حال بارگذاری اجرا...",
      errorTitle: "اجرا در دسترس نیست",
      errorDescription: "این اجرای ذخیره‌شده Wizard قابل دریافت نیست.",
      output: "پرامپت نهایی",
      snapshot: "Snapshot ذخیره‌شده",
    },
  },
};
