import { publicWizardRoutes } from "./app/wizard/publicRoutes";

const publicDiscoveryRoutes = [
  "/discover/portrait-photography",
  "/discover/3d-sculpture",
  "/discover/illustration-animation",
  "/discover/posters-editorial",
  "/discover/product-fashion",
  "/discover/cinematic-game-art",
];

const legacyStaticGenerate = process.env.NUXT_LEGACY_STATIC_GENERATE === "true";

// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  // Milestone 21.5 hybrid rendering baseline:
  // SSR is the default for public acquisition surfaces. Client-heavy/private
  // application routes explicitly opt out below until SSR provides real value.
  ssr: true,
  routeRules: {
    "/create": { ssr: false },
    "/collage": { ssr: false },
    "/vectorizer": { ssr: false },
    "/history": { ssr: false },
    "/dashboard": { ssr: false },
    "/login": { ssr: false },
    "/manage": { ssr: false },
    "/manage/**": { ssr: false },
    "/wizard": { ssr: false },
    "/wizard/**": { ssr: false },

    // These are public today, but their current query-parameter contracts are
    // not the final canonical acquisition routes. Keep them client-oriented
    // until the public Prompt/Creator route work in the SEO phase.
    "/prompts": { ssr: false },
    "/user": { ssr: false },
  },
  spaLoadingTemplate: true,
  experimental: {
    spaLoadingTemplateLocation: 'body',
  },
  runtimeConfig: {
    // Private server-only API origin. In Docker this resolves through the
    // Compose service network (http://api:4000) and is never exposed to clients.
    apiBaseInternal:
      process.env.NUXT_API_BASE_INTERNAL ||
      process.env.NUXT_PUBLIC_API_BASE ||
      "http://127.0.0.1:4000",
    public: {
      // Browser-visible API origin. Phase 3 will replace the local default with
      // the real public API domain while retaining apiBaseInternal for SSR.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:4000",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
  },
  nitro: {
    prerender: {
      routes: [
        ...publicWizardRoutes,
        ...(legacyStaticGenerate ? publicDiscoveryRoutes : []),
        "/login",
        "/manage",
        "/manage/dashboard",
        "/manage/users",
        "/dashboard",
      ],
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@capacitor-community/media',
        '@capacitor/app',
        '@capacitor/core',
        '@capacitor/filesystem',
        '@capacitor/share',
        '@ffmpeg/ffmpeg',
        '@vueuse/core',
        'moment-jalaali', // CJS
        'qrcode',
      ],
      exclude: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/core',
      ]
    }
  },

  devServer: {
    host: "localhost",
    port: 3030,
  },

  css: [
    "~/assets/css/material-symbols.css",
    "~/assets/css/zkit.scss",
    "~/assets/css/style.css",
    "~/assets/css/app.scss",
  ],

  app: {
    head: {
      title: "Prompt Draft",
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
          name: "description",
          content: "Discover curated visual prompts, build structured drafts, and turn inspiration into reusable prompt workflows with Prompt Draft.",
        },
        {
          property: "og:site_name",
          content: "Prompt Draft",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "theme-color",
          content: "#000000",
        },
        { name: 'mobile-web-app-capable', content: 'yes' },
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
