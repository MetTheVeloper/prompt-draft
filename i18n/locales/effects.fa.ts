export default {
  title: "افکت‌ها",
  description: "یک استک مرتب از افکت‌های پس‌پردازش، سیگنال، افت کیفیت، حرکت گرافیکی، VFX و رابط کاربری بساز؛ بدون ورود به قلمرو دوربین، نورپردازی، استایل، تکسچر یا بک‌گراند.",

  groups: {
    core: {
      title: "استک افکت",
      description: "لایه‌های افکت مستقل بساز. هر لایه نوع افکت، شدت و جزئیات خودش را دارد.",
    },
    advanced: {
      title: "تنظیمات پیشرفته",
      description: "نکات کلی‌ای را اضافه کن که به یک لایه مشخص محدود نیستند.",
    },
    override: {
      title: "بازنویسی دستی",
      description: "خروجی تولیدشده‌ی افکت‌ها را با متن دلخواه جایگزین کن.",
    },
  },

  fields: {
    effectLayers: {
      label: "لایه‌های افکت",
      description: "مکانیزم‌های افکتی مرتب‌شده‌ای که روی تصویر اعمال می‌شوند. برای شدت‌های متفاوت از لایه‌های جدا استفاده کن.",
      editorTitle: "استک افکت",
      editorDescription: "حداکثر {max} لایه افکت مستقل اضافه کن.",
      emptyTitle: "هنوز افکتی اضافه نشده",
      emptyDescription: "یک لایه افکت اضافه کن یا از پریست‌ها استفاده کن.",
      layerTitle: "افکت {index}",
      actions: {
        add: "افزودن افکت",
        remove: "حذف افکت",
      },
      categories: {
        post_processing: "پس‌پردازش",
        analog_damage: "آنالوگ / آسیب",
        digital_signal: "دیجیتال / سیگنال",
        degradation: "افت کیفیت",
        motion_graphic: "حرکت / گرافیک",
        scene_vfx: "VFX صحنه",
        interface_overlay: "اورلی رابط کاربری",
        custom: "سفارشی",
      },
      type: {
        label: "نوع افکت",
        options: {
          vignette: "وینیت",
          highlight_bloom: "بلوم هایلایت",
          added_film_grain: "گرین فیلم افزوده‌شده",
          synthetic_chromatic_fringing: "فرینجینگ کروماتیک مصنوعی",
          light_leak_overlay: "اورلی نشت نور",
          dust_scratches_overlay: "اورلی گردوغبار و خش",
          film_burn_overlay: "اورلی سوختگی فیلم",
          glitch_displacement: "جابجایی گلیچ",
          rgb_channel_split: "جداسازی کانال RGB",
          datamosh_artifacts: "آرتیفکت Datamosh",
          pixel_sorting: "Pixel Sorting",
          scanlines: "خطوط اسکن",
          digital_noise: "نویز سیگنال دیجیتال",
          vhs_signal_artifacts: "آرتیفکت سیگنال VHS",
          signal_warping: "اعوجاج سیگنال",
          jpeg_compression: "فشرده‌سازی JPEG",
          pixelation: "پیکسلی‌سازی",
          color_banding: "Color Banding",
          speed_lines: "خطوط سرعت",
          motion_trails: "رد حرکت",
          floating_particles: "VFX ذرات شناور",
          magical_particles: "VFX ذرات جادویی",
          sparkle_overlay: "اورلی درخشش",
          energy_aura: "VFX هاله انرژی",
          hud_overlay: "اورلی HUD",
          data_readout_overlay: "اورلی اطلاعات رابط",
          custom: "سفارشی",
        },
      },
      intensity: {
        label: "شدت",
        options: {
          subtle: "ملایم",
          restrained: "کنترل‌شده",
          balanced: "متعادل",
          strong: "قوی",
          extreme: "شدید",
        },
      },
      custom: {
        label: "افکت سفارشی",
        placeholder: "مکانیزم افکت را توضیح بده، مثلا liquid-glass distortion",
      },
      details: {
        label: "جزئیات لایه",
        placeholder: "توضیح اختیاری برای همین لایه افکت",
      },
    },
    extraDetails: {
      label: "جزئیات کلی افکت‌ها",
      description: "یادداشت‌ها و محدودیت‌های مشترک برای کل استک افکت.",
      placeholder: "هر قاعده یا ارتباط کلی بین افکت‌ها را بنویس",
    },
    customText: {
      label: "خروجی سفارشی افکت‌ها",
      description: "بخش افکت‌ها را به‌طور کامل با متن دلخواه جایگزین کن.",
      placeholder: "دستور کامل افکت‌ها را بنویس",
    },
  },

  presets: {
    subtle_post_finish: {
      label: "پس‌پردازش ملایم",
      description: "ترکیب کنترل‌شده‌ی وینیت، بلوم و گرین افزوده‌شده.",
    },
    analog_damage: {
      label: "آسیب آنالوگ",
      description: "نشت نور به‌همراه گردوغبار و خش فیلم.",
    },
    digital_glitch: {
      label: "گلیچ دیجیتال",
      description: "جابجایی گلیچ، جداسازی RGB و خطوط اسکن ملایم.",
    },
    vhs_signal: {
      label: "سیگنال VHS",
      description: "آرتیفکت ردیابی، خطوط اسکن و نویز سیگنال.",
    },
    degraded_digital: {
      label: "دیجیتال تخریب‌شده",
      description: "فشرده‌سازی JPEG همراه با پیکسلی‌سازی کنترل‌شده.",
    },
    motion_graphic: {
      label: "حرکت گرافیکی",
      description: "خطوط سرعت و رد حرکت کامپوزیت‌شده.",
    },
    magical_vfx: {
      label: "VFX جادویی",
      description: "ذرات، درخشش و هاله انرژی کامپوزیت‌شده.",
    },
    hud_interface: {
      label: "رابط HUD",
      description: "گرافیک HUD و نمایش اطلاعات روی تصویر.",
    },
  },
}
