export default {
  manage: {
    sections: {
      economy: {
        label: "اقتصاد",
        description: "مدیریت ارزش مرجع Goin، پاداش‌های صدور و سیاست‌های مصرف.",
      },
    },
    economy: {
      loading: "در حال بارگذاری تنظیمات اقتصاد…",
      loadError: "بارگذاری تنظیمات اقتصاد انجام نشد.",
      saveError: "ذخیره تنظیمات اقتصاد انجام نشد.",
      saved: "تنظیمات اقتصاد ذخیره شد.",
      unchanged: "هیچ تنظیم اقتصادی تغییر نکرد.",
      lastUpdated: "آخرین تغییر: {date}",
      neverUpdated: "در حال استفاده از سیاست seed‌شده اقتصاد",
      simulationNotice: "Goin یک واحد داخلی آزمایشی است. مقدار تومانی زیر فقط metadata مرجع برای شبیه‌سازی است و به معنی خرید، نقدکردن یا تضمین بازخرید نیست.",
      historyNotice: "تغییر سیاست فقط روی صدورهای بعدی و اولین unlockهای بعدی اثر می‌گذارد. رویدادهای قبلی ledger و قیمت unlockهای تاریخی دوباره قیمت‌گذاری نمی‌شوند.",
      summary: {
        referenceValue: {
          label: "ارزش مرجع",
          helper: "تومان آزمایشی به ازای هر Goin",
        },
        issuanceRule: {
          label: "قانون صدور",
          helper: "نسخه فعلی سیاست پاداش",
        },
        sinkRule: {
          label: "قانون مصرف",
          helper: "نسخه فعلی سیاست خرج",
        },
        promptUnlock: {
          label: "Unlock پرامپت",
          helper: "اولین کپی معنادار",
        },
      },
      sections: {
        reference: {
          title: "مرجع واحد",
          description: "ارزش مرجع آزمایشی Goin نسبت به تومان را تنظیم کنید. این مقدار هیچ قابلیت تبدیل واقعی به پول ایجاد نمی‌کند.",
        },
        issuance: {
          title: "صدور Goin",
          description: "مقدار Goin صادرشده برای reward eventهای بعدی را مشخص کنید. تغییر هر مقدار نسخه قانون صدور را افزایش می‌دهد.",
        },
        sinks: {
          title: "مصرف Goin",
          description: "هزینه فعلی اولین unlock برای اکشن‌های قابل خرج را تنظیم کنید. تغییر sink نسخه قانون مصرف را افزایش می‌دهد.",
        },
      },
      fields: {
        referenceValueToman: {
          label: "ارزش مرجع (تومان به ازای هر Goin)",
          helper: "عدد صحیح مثبت. مقدار پیش‌فرض فعلی شبیه‌سازی ۲۵۰ تومان است.",
        },
        accountCreated: {
          label: "ساخت حساب",
          helper: "Goin صادرشده هنگام ثبت reward مربوط به ساخت حساب.",
        },
        profileEmailAdded: {
          label: "افزودن ایمیل",
          helper: "Goin صادرشده هنگام ثبت reward مربوط به اضافه شدن ایمیل.",
        },
        referralJoined: {
          label: "ورود کاربر معرفی‌شده",
          helper: "Goin صادرشده برای کاربری که از طریق referral وارد شده است.",
        },
        referralReward: {
          label: "پاداش معرف",
          helper: "Goin صادرشده برای معرف در referral موفق.",
        },
        draftCreated: {
          label: "ساخت درفت",
          helper: "در V1 عمداً صفر است تا loop ساده برای farming ایجاد نشود.",
        },
        promptArchiveUnlock: {
          label: "اولین Unlock آرشیو پرامپت",
          helper: "برای هر کاربر و هر پرامپت فقط یک‌بار کم می‌شود؛ کپی‌های بعدی بعد از unlock رایگان می‌مانند.",
        },
      },
      validation: {
        reference: "ارزش مرجع باید یک عدد صحیح مثبت باشد.",
        nonNegative: "مقادیر Goin باید عدد صحیح بزرگ‌تر یا مساوی صفر باشند.",
      },
      actions: {
        save: "ذخیره سیاست اقتصاد",
        saving: "در حال ذخیره سیاست اقتصاد…",
        reload: "بارگذاری دوباره تنظیمات",
      },
      units: {
        goin: "goin",
        toman: "تومان",
        ruleVersion: "قانون v{version}",
      },
    },
  },
};
