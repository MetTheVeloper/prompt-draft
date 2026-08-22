export default {
  catalog: {
    categories: {
      profiles: "پروفایل موجودیت‌ها",
      content: "دستورهای محتوایی",
      utilities: "ابزارها",
    },
    blueprints: {
      personProfile: {
        label: "پروفایل شخص",
        description:
          "یک یا چند پروفایل شخص با شناسهٔ معنایی اصلی و فرادادهٔ اختیاری و قابل استفادهٔ مجدد بسازید.",
        groups: {
          person: {
            label: "شخص",
            description:
              "یک الگوی شخص را ویرایش کنید و سپس به تعداد لازم پروفایل شماره‌گذاری‌شده بسازید.",
            slots: {
              entity: { description: "شخص شمارهٔ #" },
              name: { description: "نام یا برچسب قابل استفادهٔ مجدد برای شخص شمارهٔ #" },
              reference: { description: "تصویر مرجع کمکی برای شخص شمارهٔ #" },
            },
          },
        },
      },
      animalProfile: {
        label: "پروفایل حیوان",
        description:
          "یک یا چند پروفایل حیوان با شناسهٔ معنایی اصلی و فرادادهٔ اختیاری و قابل استفادهٔ مجدد بسازید.",
        groups: {
          animal: {
            label: "حیوان",
            description:
              "یک الگوی حیوان را ویرایش کنید و سپس به تعداد لازم پروفایل شماره‌گذاری‌شده بسازید.",
            slots: {
              entity: { description: "حیوان شمارهٔ #" },
              name: { description: "نام یا برچسب قابل استفادهٔ مجدد برای حیوان شمارهٔ #" },
              reference: { description: "تصویر مرجع کمکی برای حیوان شمارهٔ #" },
            },
          },
        },
      },
      buildingProfile: {
        label: "پروفایل ساختمان",
        description:
          "یک یا چند پروفایل ساختمان با شناسهٔ معنایی اصلی و فرادادهٔ اختیاری و قابل استفادهٔ مجدد بسازید.",
        groups: {
          building: {
            label: "ساختمان",
            description:
              "یک الگوی ساختمان را ویرایش کنید و سپس به تعداد لازم پروفایل شماره‌گذاری‌شده بسازید.",
            slots: {
              entity: { description: "ساختمان شمارهٔ #" },
              name: { description: "نام یا برچسب قابل استفادهٔ مجدد برای ساختمان شمارهٔ #" },
              reference: { description: "تصویر مرجع کمکی برای ساختمان شمارهٔ #" },
            },
          },
        },
      },
      productProfile: {
        label: "پروفایل محصول",
        description:
          "یک یا چند پروفایل محصول با شناسهٔ معنایی اصلی و فرادادهٔ اختیاری و قابل استفادهٔ مجدد بسازید.",
        groups: {
          product: {
            label: "محصول",
            description:
              "یک الگوی محصول را ویرایش کنید و سپس به تعداد لازم پروفایل شماره‌گذاری‌شده بسازید.",
            slots: {
              entity: { description: "محصول شمارهٔ #" },
              name: { description: "نام یا برچسب قابل استفادهٔ مجدد برای محصول شمارهٔ #" },
              reference: { description: "تصویر مرجع کمکی برای محصول شمارهٔ #" },
            },
          },
        },
      },
      vehicleProfile: {
        label: "پروفایل وسیلهٔ نقلیه",
        description:
          "یک یا چند پروفایل وسیلهٔ نقلیه با شناسهٔ معنایی اصلی و فرادادهٔ اختیاری و قابل استفادهٔ مجدد بسازید.",
        groups: {
          vehicle: {
            label: "وسیلهٔ نقلیه",
            description:
              "یک الگوی وسیلهٔ نقلیه را ویرایش کنید و سپس به تعداد لازم پروفایل شماره‌گذاری‌شده بسازید.",
            slots: {
              entity: { description: "وسیلهٔ نقلیه شمارهٔ #" },
              name: { description: "نام یا برچسب قابل استفادهٔ مجدد برای وسیلهٔ نقلیه شمارهٔ #" },
              reference: { description: "تصویر مرجع کمکی برای وسیلهٔ نقلیه شمارهٔ #" },
            },
          },
        },
      },
      multiSubject: {
        label: "مجموعه سوژه‌ها",
        description:
          "یک مجموعهٔ سبک و قابل تنظیم از متغیرهای سوژه بسازید که هرکدام مستقل قابل هدف‌گذاری باشند.",
        groups: {
          subjects: {
            label: "سوژه",
            description:
              "یک الگوی سوژه را ویرایش کنید و آن را به متغیرهای سوژهٔ شماره‌گذاری‌شده گسترش دهید.",
            slots: {
              subject: { description: "سوژه شمارهٔ #" },
            },
          },
        },
      },
      customVariableSet: {
        label: "مجموعه متغیر سفارشی",
        description:
          "یک مجموعهٔ باز از متغیرها با کلید، مقدار و نوع معنایی قابل ویرایش بسازید.",
      },
      posterContent: {
        label: "محتوای پوستر",
        description:
          "شناسه‌های محتوایی قابل استفادهٔ مجدد برای یک پوستر تبلیغاتی یا هنری معمول بسازید.",
        slots: {
          brandName: { description: "نام برند یا برگزارکننده" },
          headline: { description: "تیتر اصلی" },
          subheadline: { description: "تیتر مکمل" },
          product: { description: "محصول یا شیء اصلی تبلیغ‌شده" },
          price: { description: "متن قیمت" },
          discount: { description: "متن تخفیف یا پیشنهاد" },
          callToAction: { description: "دعوت به اقدام" },
          primaryColor: { description: "رنگ اصلی قابل استفادهٔ مجدد" },
          secondaryColor: { description: "رنگ ثانویهٔ قابل استفادهٔ مجدد" },
        },
      },
      businessCard: {
        label: "کارت ویزیت",
        description:
          "متغیرهای رایج هویت و اطلاعات تماس را برای تایپوگرافی کارت ویزیت بسازید.",
        slots: {
          personName: { description: "نام نمایشی شخص" },
          jobTitle: { description: "عنوان شغلی یا نقش" },
          companyName: { description: "نام شرکت یا استودیو" },
          phone: { description: "شماره تلفن" },
          email: { description: "نشانی ایمیل" },
          website: { description: "وب‌سایت" },
          address: { description: "نشانی" },
          brandColor: { description: "رنگ اصلی برند" },
          brandFont: { description: "فونت برند یا مرجع نوشتاری" },
        },
      },
      garmentPrint: {
        label: "چاپ روی پوشاک",
        description:
          "یک شناسهٔ مرجع معنایی و دستورهای اختیاری چاپ برای طرحی که روی پوشاک اعمال می‌شود بسازید.",
        slots: {
          printArtwork: { description: "منبع طرح برای بازتولید روی پوشاک" },
          printPlacement: { description: "محل قرارگیری چاپ" },
          printMethod: { description: "روش چاپ و نحوهٔ یکپارچه‌شدن فیزیکی" },
          printScale: { description: "اندازهٔ نسبی چاپ" },
        },
      },
    },
  },
  ui: {
    types: {
      text: "متن",
      subject: "سوژه",
      reference: "مرجع",
      object: "شیء",
      color: "رنگ",
      font: "فونت",
      custom: "سفارشی",
    },
    blueprints: {
      placeholder: "بلوپرینت‌ها",
      configureSubtitle: "پیش از افزودن متغیرها به گراف پرامپت، آن‌ها را تنظیم کنید.",
      createVariables: "ساخت متغیرها",
      variables: "متغیرها",
      variable: "متغیر",
      customVariable: "متغیر سفارشی",
      template: "الگو",
      profiles: "پروفایل",
      remove: "حذف",
      key: "کلید",
      keyPattern: "الگوی کلید",
      type: "نوع",
      initialValue: "مقدار اولیه",
      initialValuePattern: "الگوی مقدار اولیه",
      validation: {
        invalidKey: "کلید متغیر معتبر نیست",
        reservedKey: "این کلید متغیر رزرو شده است",
        exists: "این کلید متغیر از قبل وجود دارد",
        duplicateKey: "کلید متغیر تکراری است",
        exactlyOneHash: "برای ساخت چند پروفایل، کلید باید دقیقاً یک # داشته باشد",
        maxOneHash: "کلید حداکثر می‌تواند یک # داشته باشد",
        valueMaxOneHash: "مقدار اولیه حداکثر می‌تواند یک # داشته باشد",
        invalidPattern: "الگوی کلید متغیر معتبر نیست",
        reservedPattern: "الگوی کلید متغیر رزرو شده است",
        duplicatePattern: "الگوی کلید متغیر تکراری است",
      },
    },
  },
}
