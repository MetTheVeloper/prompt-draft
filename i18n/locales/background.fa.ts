export default {
  title: "پس‌زمینه",
  description:
    "پس‌زمینه‌ی پشت سوژه را با یک مفهوم کلی محافظه‌کارانه و کنترل‌های سمنتیک مستقل می‌سازد.",
  groups: {
    core: {
      title: "پایه‌ی پس‌زمینه",
      description:
        "یک پریست انتخاب کن یا مفهوم کلی، نوع ساختاری و محیط پس‌زمینه را مستقل تعریف کن.",
    },
    construction: {
      title: "ساختار پس‌زمینه",
      description:
        "سازمان‌دهی فضایی، متریال قابل مشاهده‌ی بک‌دراپ و میزان جزئیات پس‌زمینه را تعریف کن.",
    },
    content: {
      title: "المان‌های پس‌زمینه",
      description:
        "المان‌های فرعی‌ای را اضافه کن که باید در پس‌زمینه دیده شوند اما توجه را از سوژه‌ی اصلی نگیرند.",
    },
    advanced: {
      title: "جزئیات پیشرفته",
      description:
        "دستورهای اختیاری مخصوص پس‌زمینه را که در کنترل‌های ساختاری پوشش داده نشده‌اند اضافه کن.",
    },
    override: {
      title: "بازنویسی سفارشی",
      description: "خروجی ساخته‌شده‌ی پس‌زمینه را با متن دلخواه خودت جایگزین کن.",
    },
  },
  fields: {
    backgroundConcept: {
      label: "مفهوم پس‌زمینه",
      description:
        "یک لنگر معنایی کلی برای پس‌زمینه. پریست‌ها این مقدار را پر می‌کنند اما می‌توانی مستقل تغییرش بدهی.",
      placeholder: "یک مفهوم پس‌زمینه انتخاب کن",
      customPlaceholder: "مفهوم سفارشی پس‌زمینه را توصیف کن...",
      options: {
        clean_background: "پس‌زمینه تمیز",
        studio_background: "پس‌زمینه استودیویی",
        indoor_environment: "محیط داخلی",
        outdoor_environment: "محیط بیرونی",
        natural_environment: "محیط طبیعی",
        urban_environment: "محیط شهری",
        architectural_environment: "محیط معماری",
        material_background: "پس‌زمینه متریالی",
        abstract_background: "پس‌زمینه انتزاعی",
        graphic_background: "پس‌زمینه گرافیکی",
        pattern_background: "پس‌زمینه پترن",
        mixed_media_background: "پس‌زمینه میکس‌مدیا",
        transparent_background: "پس‌زمینه شفاف",
        custom: "سفارشی",
      },
    },
    backgroundType: {
      label: "نوع پس‌زمینه",
      description:
        "نوع بک‌دراپ را مستقل از استایل، نورپردازی، دوربین و افکت‌ها مشخص کن.",
      placeholder: "نوع پس‌زمینه را انتخاب کن",
      customPlaceholder: "نوع سفارشی پس‌زمینه را توصیف کن...",
      options: {
        environment: "محیط",
        studio: "استودیو",
        surface: "سطح",
        abstract: "انتزاعی",
        graphic: "گرافیکی",
        pattern: "پترن",
        mixed_media: "میکس‌مدیا",
        transparent: "شفاف",
        custom: "سفارشی",
      },
    },
    setting: {
      label: "محیط",
      description:
        "فضای فیزیکی یا زمینه‌ی محیطی را بدون اضافه کردن استایل بصری یا رفتار نور تعریف کن.",
      placeholder: "یک محیط انتخاب کن",
      customPlaceholder: "محیط سفارشی را توصیف کن...",
      options: {
        indoor: "داخلی",
        outdoor: "بیرونی",
        natural: "طبیعی",
        urban: "شهری",
        architectural: "معماری",
        public: "فضای عمومی",
        residential: "مسکونی",
        commercial: "تجاری",
        industrial: "صنعتی",
        sports: "ورزشی",
        performance: "اجرا / صحنه",
        futuristic: "محیط ساخته‌شده آینده‌نگر",
        custom: "سفارشی",
      },
    },
    spatialStructure: {
      label: "ساختار فضایی",
      description:
        "نحوه‌ی سازمان‌دهی فضای پس‌زمینه در پشت و اطراف سوژه را کنترل کن.",
      placeholder: "یک ساختار فضایی انتخاب کن",
      customPlaceholder: "ساختار فضایی سفارشی را توصیف کن...",
      options: {
        seamless: "یکپارچه / بدون درز",
        flat: "تخت / صفحه‌ای",
        open: "باز",
        layered: "لایه‌ای",
        enclosed: "محصور",
        expansive: "گسترده",
        horizon_based: "مبتنی بر خط افق",
        framed: "قاب‌شده اطراف سوژه",
        repeating: "تکرارشونده",
        structured: "ساختارمند",
        asymmetrical: "نامتقارن",
        custom: "سفارشی",
      },
    },
    backgroundMaterial: {
      label: "متریال پس‌زمینه",
      description:
        "متریال خود بک‌دراپ قابل مشاهده را مشخص کن. بافت کلی تصویر یا سوژه متعلق به ماژول Texture است.",
      placeholder: "متریال پس‌زمینه را انتخاب کن",
      customPlaceholder: "متریال سفارشی بک‌دراپ را توصیف کن...",
      options: {
        seamless_paper: "کاغذ یکپارچه استودیو",
        paper: "کاغذ",
        fabric: "پارچه",
        concrete: "بتن",
        stone: "سنگ",
        wood: "چوب",
        metal: "فلز",
        glass: "شیشه",
        plaster: "گچ",
        painted_wall: "دیوار رنگ‌شده",
        custom: "سفارشی",
      },
    },
    detailDensity: {
      label: "تراکم جزئیات",
      description:
        "مقدار اطلاعات بصری پس‌زمینه را بدون تغییر خود محیط کنترل کن.",
      placeholder: "تراکم جزئیات پس‌زمینه را انتخاب کن",
      customPlaceholder: "سطح سفارشی جزئیات پس‌زمینه را توصیف کن...",
      options: {
        minimal: "مینیمال",
        restrained: "کنترل‌شده",
        balanced: "متعادل",
        detailed: "پرجزئیات",
        dense: "متراکم",
        custom: "سفارشی",
      },
    },
    backgroundElements: {
      label: "المان‌های پس‌زمینه",
      description:
        "اشیا یا نشانه‌های محیطی فرعی‌ای را انتخاب کن که باید پشت سوژه دیده شوند.",
      placeholder: "المان‌های پس‌زمینه را انتخاب کن",
      customPlaceholder: "المان‌های سفارشی دیگری برای پس‌زمینه توصیف کن...",
      options: {
        vegetation: "پوشش گیاهی",
        architecture: "معماری",
        furniture: "مبلمان",
        crowd: "افراد دوردست / جمعیت",
        signage: "تابلوها و علائم",
        skyline: "خط آسمان شهری",
        mountains: "کوه‌ها",
        water: "آب",
        clouds: "ابرها",
        shelves: "قفسه‌ها",
        windows: "پنجره‌ها",
        machinery: "ماشین‌آلات",
        arena_seating: "صندلی‌های استادیوم",
        horizon: "خط افق قابل مشاهده",
        contextual_props: "پراپ‌های محیطی",
        custom: "سفارشی",
      },
    },
    extraDetails: {
      label: "جزئیات اضافه پس‌زمینه",
      description:
        "دستورهای مخصوص پس‌زمینه را که در فیلدهای سمنتیک ساختاری جا نمی‌گیرند اضافه کن.",
      placeholder: "جزئیات اختیاری پس‌زمینه را اضافه کن...",
    },
    customText: {
      label: "بازنویسی سفارشی پس‌زمینه",
      description:
        "وقتی حالت Custom فعال باشد، این متن جای خروجی ساخته‌شده‌ی پس‌زمینه را می‌گیرد.",
      placeholder: "یک دستور کامل سفارشی برای پس‌زمینه بنویس...",
    },
  },
  presets: {
    clean_background: {
      label: "پس‌زمینه تمیز",
      description: "یک پس‌زمینه یکپارچه مینیمال با جزئیات بصری بسیار کم.",
    },
    studio_background: {
      label: "پس‌زمینه استودیویی",
      description: "بک‌دراپ استودیویی داخلی کنترل‌شده با کاغذ یکپارچه.",
    },
    indoor_environment: {
      label: "محیط داخلی",
      description: "یک محیط داخلی عمومی، لایه‌ای و با جزئیات متعادل.",
    },
    outdoor_environment: {
      label: "محیط بیرونی",
      description: "یک محیط بیرونی عمومی، باز و با جزئیات متعادل.",
    },
    natural_environment: {
      label: "محیط طبیعی",
      description: "یک محیط طبیعی لایه‌ای با پوشش گیاهی به‌عنوان نشانه‌ی فرعی.",
    },
    urban_environment: {
      label: "محیط شهری",
      description: "یک محیط شهری لایه‌ای با معماری به‌عنوان نشانه‌ی فرعی.",
    },
    architectural_environment: {
      label: "محیط معماری",
      description: "یک محیط ساختارمند و معماری‌محور با جزئیات متعادل.",
    },
    material_background: {
      label: "پس‌زمینه متریالی",
      description: "یک سطح تخت و کنترل‌شده که آماده‌ی انتخاب متریال بک‌دراپ است.",
    },
    abstract_background: {
      label: "پس‌زمینه انتزاعی",
      description: "یک بک‌دراپ انتزاعی عمومی بدون تحمیل استایل بصری خاص.",
    },
    graphic_background: {
      label: "پس‌زمینه گرافیکی",
      description: "یک بک‌دراپ گرافیکی تخت با جزئیات متعادل.",
    },
    pattern_background: {
      label: "پس‌زمینه پترن",
      description: "یک بک‌دراپ تکرارشونده مبتنی بر پترن با جزئیات متعادل.",
    },
    mixed_media_background: {
      label: "پس‌زمینه میکس‌مدیا",
      description: "یک بک‌دراپ میکس‌مدیا لایه‌ای با جزئیات متعادل.",
    },
    transparent_background: {
      label: "پس‌زمینه شفاف",
      description: "پس‌زمینه شفاف بدون القای محتوای محیطی اضافه.",
    },
  },
};
