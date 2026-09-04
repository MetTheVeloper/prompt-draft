export default {
  manage: {
    title: "مدیریت",
    subtitle: "فضای مدیریت سیستم و امور مدیریتی.",
    sections: {
      dashboard: {
        label: "داشبورد",
        description: "نمای زنده‌ای از حساب‌ها، نشست‌ها، درفت‌های ابری و وضعیت مدیریت.",
      },
      users: {
        label: "کاربران",
        description: "مشاهده اطلاعات حساب‌ها و میزان استفاده فعلی از فضای ابری.",
      },
    },
    common: {
      actions: {
        refresh: "به‌روزرسانی",
        cancel: "انصراف",
        close: "بستن",
        done: "انجام شد",
        loadMore: "نمایش بیشتر",
      },
      roles: {
        user: "کاربر",
        admin: "مدیر",
        superAdmin: "مدیر ارشد",
        all: "همه نقش‌ها",
      },
      statuses: {
        active: "فعال",
        suspended: "تعلیق‌شده",
      },
      fields: {
        account: "حساب",
        userId: "شناسه کاربر",
        role: "نقش",
        status: "وضعیت",
        cloudDrafts: "درفت‌های ابری",
        activeSessions: "نشست‌های فعال",
        joined: "تاریخ عضویت",
        actions: "عملیات",
      },
    },
    dashboard: {
      liveSummary: "خلاصه زنده سرور",
      lastUpdated: "آخرین به‌روزرسانی: {date}",
      loading: "در حال بارگذاری داشبورد…",
      loadError: "خلاصه داشبورد قابل بارگذاری نیست.",
      cards: {
        totalUsers: {
          label: "کل کاربران",
          helper: "حساب‌های ثبت‌شده",
        },
        activeAccounts: {
          label: "حساب‌های فعال",
          helper: "حساب‌هایی که اجازه ورود دارند",
        },
        suspendedAccounts: {
          label: "حساب‌های تعلیق‌شده",
          helper: "حساب‌هایی که امکان ورودشان مسدود شده است",
        },
        newUsersToday: {
          label: "کاربران جدید امروز",
          helper: "از ساعت ۰۰:۰۰ به وقت UTC",
        },
        activeSessions: {
          label: "نشست‌های فعال",
          helper: "نشست‌های منقضی‌نشده حساب‌های فعال",
        },
        cloudDrafts: {
          label: "درفت‌های ابری",
          helper: "درفت‌هایی که اکنون روی سرور ذخیره شده‌اند",
        },
        draftsUpdatedToday: {
          label: "درفت‌های به‌روزشده امروز",
          helper: "به‌روزرسانی‌های سرور از ساعت ۰۰:۰۰ به وقت UTC",
        },
        adminActionsToday: {
          label: "عملیات مدیریتی امروز",
          helper: "تغییرات ثبت‌شده مدیریتی از ساعت ۰۰:۰۰ به وقت UTC",
        },
      },
    },
    users: {
      searchPlaceholder: "جستجو با نام کاربری یا ایمیل",
      loading: "در حال بارگذاری کاربران…",
      empty: "کاربری پیدا نشد.",
      loadError: "بارگذاری کاربران ناموفق بود.",
      updatedTitle: "کاربر به‌روزرسانی شد",
      actionFailedTitle: "عملیات ناموفق بود",
      actionFailedFallback: "عملیات مدیریتی انجام نشد.",
      selfManagementBlocked: "طبق قواعد ایمنی مدیریت، انجام این عملیات روی حساب خودتان مجاز نیست.",
      actions: {
        userActions: "عملیات کاربر",
        changeRole: "تغییر نقش",
        suspendAccount: "تعلیق حساب",
        unsuspendAccount: "رفع تعلیق حساب",
        revokeSessions: "لغو نشست‌ها",
        resetCloudData: "پاک‌سازی داده‌های ابری",
        information: "اطلاعات",
        deleteCloudDrafts: "حذف درفت‌های ابری",
      },
      roleChange: {
        title: "تغییر نقش کاربر",
        description: "نقش دسترسی جدید این حساب را انتخاب کنید. این تغییر روی مجوزهایی که برای درخواست‌های بعدی اعمال می‌شوند اثر می‌گذارد.",
        placeholder: "انتخاب نقش",
        failedTitle: "تغییر نقش ناموفق بود",
        failedFallback: "نقش کاربر قابل تغییر نبود.",
        success: "نقش {account} به {role} تغییر کرد.",
      },
      suspend: {
        title: "حساب تعلیق شود؟",
        description: "ورود این حساب مسدود می‌شود و همه نشست‌های فعلی آن بلافاصله لغو خواهند شد.",
        success: "حساب {account} تعلیق شد.",
      },
      unsuspend: {
        title: "تعلیق حساب برداشته شود؟",
        description: "این حساب دوباره اجازه ورود خواهد داشت. نشست‌هایی که قبلاً لغو شده‌اند بازیابی نمی‌شوند.",
        success: "حساب {account} دوباره امکان ورود دارد.",
      },
      revokeSessions: {
        title: "همه نشست‌ها لغو شوند؟",
        description: "همه نشست‌های ورود فعال این حساب بی‌اعتبار می‌شوند و کاربر باید روی هر دستگاه دوباره وارد شود.",
        success: "همه نشست‌های {account} لغو شدند.",
      },
      resetCloudData: {
        title: "داده‌های ابری پاک شوند؟",
        description: "همه درفت‌های ابری متعلق به این حساب برای همیشه حذف می‌شوند. خود حساب و رمز عبور آن حذف نخواهند شد.",
        success: "داده‌های ابری {account} پاک شدند.",
      },
      information: {
        title: "اطلاعات کاربر",
        loading: "در حال بارگذاری اطلاعات کاربر…",
        loadError: "بارگذاری اطلاعات کاربر ناموفق بود.",
      },
    },
    errors: {
      forbiddenTitle: "دسترسی ممنوع",
      forbiddenMessage: "اجازه دسترسی به فضای مدیریت را ندارید.",
    },
  },
};
