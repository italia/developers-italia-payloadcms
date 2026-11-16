import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import { resolve } from "path";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL,
  i18n: {
    defaultLocale: "it",
    locales: ["it", "en"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("component-inventory") &&
        !page.includes("/search") &&
        !page.includes("/ricerca"),
      i18n: {
        defaultLocale: "it",
        locales: {
          it: "it",
          en: "en",
        },
      },
    }),
    react(),
  ],
  adapter: vercel(),
  redirects: {
    "/": {
      status: 301,
      destination: "/it",
    },
  },
  vite: {
    // Client components build image URLs from the CMS address: make it always
    // available, falling back to PAYLOAD_URL when PUBLIC_PAYLOAD_URL is not set
    // in the build environment (otherwise the URLs start with "undefined").
    define: {
      "import.meta.env.PUBLIC_PAYLOAD_URL": JSON.stringify(
        process.env.PUBLIC_PAYLOAD_URL || process.env.PAYLOAD_URL || "",
      ),
    },
    ssr: {
      noExternal: ["dataviz-components", "graph-italia-components"],
    },
    resolve: {
      alias: {
        "/^@(.*)$/": resolve("./src/*"),
        "@splidejs/splide/src/css/core/index": resolve(
          "node_modules/@splidejs/splide/src/css/core/index.scss",
        ),
        "@bootstrap-src": "/node_modules/bootstrap-italia/src",
      },
    },
  },
  build: {
    inlineStylesheets: "always",
  },
});
