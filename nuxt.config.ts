import { publicWizardRoutes } from "./app/wizard/publicRoutes";
import { PUBLIC_DISCOVERY_ROUTES } from "./app/shared/public-discovery";
import { PUBLIC_ROUTE_PATHS, publicBlogPostPath } from "./app/utils/publicRoutes";
import { projectBlogPublicInventory } from "./shared/blog-public-inventory";
import { APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS } from "./shared/seo-route-policy";
import { readBlogRepositoryDirectorySync } from "./scripts/blog-repository";

const publicDiscoveryRoutes = PUBLIC_DISCOVERY_ROUTES.flatMap((route) => [
  route,
  `/fa${route}`,
]);

const legacyStaticGenerate = process.env.NUXT_LEGACY_STATIC_GENERATE === "true";

const publicBlogRoutes = (() => {
  const routes = [
    PUBLIC_ROUTE_PATHS.blog,
    `/fa${PUBLIC_ROUTE_PATHS.blog}`,
  ];

  if (!legacyStaticGenerate) return routes;

  for (const article of projectBlogPublicInventory(readBlogRepositoryDirectorySync())) {
    const articlePath = publicBlogPostPath(article.slug);
    if (article.availableLocales.includes("en")) routes.push(articlePath);
    if (article.availableLocales.includes("fa")) routes.push(`/fa${articlePath}`);
  }

  return routes;
})();

const clientOnlyRouteRules = Object.fromEntries(
  APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS.flatMap((route) => [
    [route, { ssr: false }],
    [`/fa${route}`, { ssr: false }],
  ]),
);

// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  // Milestone 21.5 hybrid rendering baseline:
  // SSR is the default for public acquisition surfaces. Client-heavy/private
  // application routes explicitly opt out in both EN and the accepted /fa
  // namespace.
  ssr: true,
  routeRules: clientOnlyRouteRules,
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
      // Browser-visible API origin. Phase 3 replaces the local default with the
      // real public API domain while retaining apiBaseInternal for SSR.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:4000",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
      // Staging safety switch. When true, app.vue emits a robots noindex meta
      // tag and Nitro middleware emits X-Robots-Tag at request time.
      noindex: process.env.NUXT_PUBLIC_NOINDEX || "false",
    },
  },
  nitro: {
    // Blog V1 canonical editorial content lives in Git under content/blog.
    // Nitro bundles it into .output/server so Docker runtime reads deployed
    // content locally and never queries GitHub per public request.
    serverAssets: [
      {
        baseName: "blog",
        dir: "./content/blog",
      },
    ],
    prerender: {
      // These routes are retained only for the deprecated static-export path.
      // In the current Docker/Nitro runtime, app/client-only routes must stay
      // request-time so server middleware can enforce X-Robots-Tag consistently.
      // Blog detail routes are projected explicitly from the same validated
      // Article.availableLocales inventory used by sitemap/llms; static export
      // must not depend on crawler discovery for canonical Article pages.
      routes: legacyStaticGenerate
        ? [
            ...publicWizardRoutes,
            ...publicDiscoveryRoutes,
            ...publicBlogRoutes,
            "/login",
            "/manage",
            "/manage/dashboard",
            "/manage/users",
            "/dashboard",
          ]
        : [],
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
    // Phase 4A public locale contract:
    // EN is the default unprefixed URL space; Persian uses /fa.
    strategy: "prefix_except_default",
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
