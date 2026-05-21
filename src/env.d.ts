interface ImportMetaEnv {
  readonly PAYLOAD_URL: string;
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
