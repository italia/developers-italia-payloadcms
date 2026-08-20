interface ImportMetaEnv {
  readonly PAYLOAD_URL: string;
  readonly PUBLIC_PAYLOAD_URL: string;
  readonly PAYLOAD_API_KEY: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    recordId: string;
    lang: SiteLocale;
  }
}

// BI plugin with no types: registers the YouTube tech on the global video.js instance.
declare module "bootstrap-italia/dist/plugins/util/youtube-video" {
  export function initYoutubePlugin(videojs: unknown): void;
}
