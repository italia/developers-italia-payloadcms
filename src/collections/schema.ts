import type {
  ArticleIndexPayloadFragmentType,
  CatalogueIndexPayloadFragmentType,
  InsightIndexPayloadFragmentType,
  NewsIndexPayloadFragmentType,
  PageIndexPayloadFragmentType,
  StoryIndexPayloadFragmentType,
  WebinarIndexPayloadFragmentType,
} from "@graphql/fragment/indexing";
import type {
  NewsItemFragmentType,
  ResourceFragmentType,
  StoryCardFragmentType,
  TagFragmentType,
  WebinarItemFragmentType,
} from "@graphql/fragment/commonFragments";
import type { ErrorRecordFragmentType } from "@graphql/fragment/globalSettings";
import type { HomepageRecordFragmentType } from "@graphql/fragment/homepage";
import type { SidebarFragmentType } from "@graphql/fragment/layout";
import type { SearchRecordFragmentType } from "@graphql/fragment/search";
import type { SeoFieldFragmentType } from "@graphql/fragment/seoFragments";
import type { SiteLocale } from "@graphql/types";
import { z } from "astro:content";

// ─── Shared per-locale entry base ─────────────────────────────────────────────
// Every content collection entry represents one locale of one Payload document.

const localeEnum = z.enum(["it", "en"] as const);

const payloadLocaleEntryBase = z.object({
  id: z.string(),                                    // "${docId}_${locale}"
  docId: z.string(),                                 // Payload integer ID as string
  locale: localeEnum,
  slug: z.string().nullable(),
  title: z.string().nullable(),
  localizedSlugs: z.any(),   // JSON string from REST or object; not used by page routes
  updatedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

// ─── Content collections ───────────────────────────────────────────────────────

export const articleSchema = payloadLocaleEntryBase.extend({
  content: z.array(z.any()),
  paragraph: z.string().nullable(),
});

// Insight / Story / WebinarItem / Catalogue all have typed block arrays.
export const insightSchema = payloadLocaleEntryBase.extend({
  content: z.array(z.any()),
  abstract: z.string().nullable(),
});

export const storyContentSchema = payloadLocaleEntryBase.extend({
  paragraph: z.string().nullable(),
  content: z.array(z.any()),
  dateOfPublication: z.string().nullable(),
  articleClassificationId: z.string().nullable(),
  category: z.string().nullable(),
  topicLabel: z.string().nullable(),
  image: z
    .object({
      url: z.string(),
      alt: z.string(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    })
    .nullable(),
});

export const webinarContentSchema = payloadLocaleEntryBase.extend({
  content: z.array(z.any()),
  date: z.string().nullable(),
  paragraph: z.string().nullable(),
});

export const catalogueSchema = payloadLocaleEntryBase
  .extend({
    content: z.array(z.any()),
    datesRegistry: z.object({
      news: z.string().optional(),
      story: z.string().optional(),
      webinar: z.string().optional(),
      resource: z.string().optional(),
    }),
  });

// Pages are loaded via REST per locale — same per-locale entry shape.
export const pageSchema = payloadLocaleEntryBase.extend({
  content: z.array(z.any()),
});

// ─── Card / list collections (still DatoCMS-sourced, unchanged) ───────────────

export const newsSchema = z.custom<NewsItemFragmentType>();
export const storySchema = z.custom<StoryCardFragmentType>();
export const webinarSchema = z.custom<WebinarItemFragmentType>();
export const resourceSchema = z.custom<ResourceFragmentType>();

// ─── Globals ──────────────────────────────────────────────────────────────────

export const homepageSchema = z.custom<HomepageRecordFragmentType>();
export const searchSchema = z.custom<SearchRecordFragmentType>();

export const globalSettingsSchema = z.object({
  id: z.string(),
  locale: z.string(),
  value: z.object({
    siteName: z.string().optional().default(""),
    lastUpdateLabel: z.string().optional().default(""),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      )
      .default([]),
  }),
});

export const layoutSchema = z.object({
  id: z.string(),
  layout: z.any(),
  search: z.any().nullable(),
  homepageId: z.string().optional(),
});

export const sidebarSchema = z.custom<SidebarFragmentType>();

export const localesSchema = z.object({
  id: z.string(),
  locales: z.array(z.custom<SiteLocale>()),
});

export const errorPageSchema = z.object({
  id: z.string(),
  globalSetting: z.custom<ErrorRecordFragmentType>().nullable(),
  homepageId: z.string().optional(),
});

export const siteMetaTagsSchema = z.object({
  id: z.string(),
  faviconMetaTags: z.array(z.custom<TagFragmentType>()),
});

export const globalSeoSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  locale: z.string(),
  metaTags: z.array(z.custom<TagFragmentType>()),
  seo: z.custom<SeoFieldFragmentType>().nullable(),
  updatedAt: z.string().optional().default(""),
});

// ─── Search index ─────────────────────────────────────────────────────────────

export const allDocumentsSchema = z.object({
  id: z.string(),
  allArticles: z.array(z.custom<ArticleIndexPayloadFragmentType>()),
  allInsights: z.array(z.custom<InsightIndexPayloadFragmentType>()),
  allStoryItems: z.array(z.custom<StoryIndexPayloadFragmentType>()),
  allNewsItems: z.array(z.custom<NewsIndexPayloadFragmentType>()),
  allWebinarItems: z.array(z.custom<WebinarIndexPayloadFragmentType>()),
  allResources: z.array(z.any()),
  allCatalogues: z.array(z.custom<CatalogueIndexPayloadFragmentType>()),
  allPages: z.array(z.custom<PageIndexPayloadFragmentType>()),
});

// ─── SEO Default ─────────────────────────────────────────────────────────────

export const seoDefaultSchema = z.object({
  id: z.string(),
  locale: z.string(),
  siteName: z.string(),
  fallbackTitle: z.string(),
  fallbackDescription: z.string(),
  titleSuffix: z.string().optional().default(""),
  ogImage: z.object({ url: z.string(), alt: z.string().optional() }).nullable(),
  favicon: z.object({ url: z.string() }).nullable(),
});
