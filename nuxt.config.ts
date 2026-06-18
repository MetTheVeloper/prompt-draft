// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  ssr: false,

  devServer: {
    host: "localhost",
    port: 3030,
  },

  css: [
    "~/assets/css/zkit.scss",
    // '~/assets/css/scss.scss',
    "~/assets/css/style.css",
    "~/assets/css/app.scss",
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: "en",
        dir: "ltr",
      },
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.ico",
        },
        {
          rel: "manifest",
          href: "/manifest.json",
        },
        {
          rel: "apple-touch-icon",
          href: "/pwa-192x192.png",
        },
      ],
      meta: [
        {
          name: "theme-color",
          content: "#000000",
        },
        {
          name: "apple-mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "apple-mobile-web-app-title",
          content: "Prompt Draft",
        },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
      ],
      script: [
        {
          src: 'https://telegram.org/js/telegram-web-app.js?62',
          tagPosition: 'head',
        },
      ],
    },
  },

  modules: ["@nuxtjs/i18n", "@pinia/nuxt"],

  i18n: {
    strategy: "no_prefix",
    defaultLocale: "en",

    locales: [
      {
        code: "en",
        name: "English",
        language: "en-US",
        dir: "ltr",
      },
      {
        code: "fa",
        name: "فارسی",
        language: "fa-IR",
        dir: "rtl",
      },
    ],
  },
});
