import {
  ArticlesIdxQuery,
  CataloguesIdxQuery,
  InsightsIdxQuery,
  NewsIdxQuery,
  PagesIdxQuery,
  ResourcesIdxQuery,
  StoriesIdxQuery,
  WebinarsIdxQuery,
} from "@graphql/query/indexing";
import { LayoutQuery, SidebarQuery } from "@graphql/query/layout";
import { AllNewsQuery } from "@graphql/query/news";
import { AllResourcesQuery } from "@graphql/query/resource";
import { SearchPageContentQuery } from "@graphql/query/search";
import {
  ArticlesSeoQuery,
  CataloguesSeoQuery,
  HomepageSeoQuery,
  InsightsSeoQuery,
  PagesSeoQuery,
  SearchSeoQuery,
  StoriesSeoQuery,
  WebinarsSeoQuery,
} from "@graphql/query/seo";
import {
  AllGlobalSettingsQuery,
  LocalesQuery,
  SiteMetaTagsQuery,
} from "@graphql/query/settings";
import {
  AllStoryCardQuery,
  AllWebinarQuery,
} from "@graphql/query/story";
import { ArticlesContentQuery } from "@graphql/query/article";
import { CataloguesContentQuery, LastItemsUpdateQuery } from "@graphql/query/catalogue";
import { InsightsContentQuery } from "@graphql/query/insight";
import { StoryItemsContentQuery } from "@graphql/query/story";
import { WebinarItemsContentQuery } from "@graphql/query/webinar";
import { executeAutoPagingQuery, executeQuery } from "@lib/datocms";
import {
  executeAutoPagingQuery as payloadPagingQuery,
  executeQuery as payloadQuery,
  payloadFetch,
} from "@lib/payloadcms";

const LOCALES = ["it", "en"] as const;
type Locale = (typeof LOCALES)[number];

type PayloadPageDoc = {
  id: number;
  slug: string | null;
  title: string | null;
  content: unknown[] | null;
  localizedSlugs: Record<string, string> | null;
  updatedAt: string | null;
  createdAt: string | null;
};

type PayloadPageList = {
  docs: PayloadPageDoc[];
  hasNextPage: boolean;
};

// ─── Helper: extract docs from executeAutoPagingQuery result ─────────────────
// executeAutoPagingQuery<Result> returns Result[] at runtime (the docs array)
// but TypeScript types it as the full query result type. Cast where needed.
function asDocs<T>(result: unknown): T[] {
  return result as T[];
}

// ─── News / Stories / Webinars (DatoCMS card collections — unchanged) ─────────

export const newsLoader = async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateLimit = oneYearAgo.toISOString();
  const response = await executeAutoPagingQuery(AllNewsQuery, {
    variables: { dateLimit },
  });
  return response?.allNewsItems || [];
};

export const storiesLoader = async () => {
  const response = await executeAutoPagingQuery(AllStoryCardQuery);
  return response?.allStoryItems || [];
};

export const webinarsLoader = async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateLimit = oneYearAgo.toISOString();
  const response = await executeAutoPagingQuery(AllWebinarQuery, {
    variables: { dateLimit },
  });
  return response?.allWebinarItems || [];
};

export const resourcesLoader = async () => {
  const response = await executeAutoPagingQuery(AllResourcesQuery);
  return response?.allResources || [];
};

// ─── Pages (PayloadCMS REST, per-locale entries) ──────────────────────────────

export const pagesLoader = async () => {
  const slugMap = new Map<string, Record<Locale, string>>();

  // First pass: collect all slugs per locale to build localizedSlugs
  const allLocalePages = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs: PayloadPageDoc[] = [];
      let pageNum = 1;
      let hasMore = true;
      while (hasMore) {
        const qs = `locale=${locale}&depth=3&limit=100&page=${pageNum}&fallbackLocale=none`;
        const res = await payloadFetch<PayloadPageList>("/pages", qs);
        docs.push(...res.docs);
        hasMore = res.hasNextPage;
        pageNum++;
      }
      return { locale, docs };
    }),
  );

  // Build slug map: id -> { it: slug, en: slug }
  for (const { locale, docs } of allLocalePages) {
    for (const doc of docs) {
      if (!doc.slug) continue;
      const id = String(doc.id);
      if (!slugMap.has(id)) slugMap.set(id, {} as Record<Locale, string>);
      const entry = slugMap.get(id);
      if (entry) entry[locale] = doc.slug;
    }
  }

  // Emit one entry per (document, locale)
  const entries: {
    id: string;
    docId: string;
    locale: Locale;
    slug: string | null;
    title: string | null;
    content: unknown[];
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    publishedAt: string | null;
  }[] = [];

  for (const { locale, docs } of allLocalePages) {
    for (const doc of docs) {
      if (!doc.slug) continue;
      const docId = String(doc.id);
      entries.push({
        id: `${docId}_${locale}`,
        docId,
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        content: doc.content ?? [],
        localizedSlugs: slugMap.get(docId) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.updatedAt ?? doc.createdAt ?? null,
      });
    }
  }

  return entries;
};

// ─── Article content (PayloadCMS GraphQL, per-locale entries) ─────────────────

export const articleContentLoader = async () => {
  type ArticleDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    paragraph: string | null;
    content: unknown;
    localizedSlugs: unknown;
    updatedAt: string | null;
    createdAt: string | null;
  };

  const entries = [];
  for (const locale of LOCALES) {
    const docs = asDocs<ArticleDoc>(
      await payloadPagingQuery(ArticlesContentQuery, { variables: { locale } }),
    );
    for (const doc of docs) {
      if (!doc.slug) continue;
      entries.push({
        id: `${doc.id}_${locale}`,
        docId: String(doc.id),
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        paragraph: doc.paragraph ?? null,
        content: doc.content ?? null,
        localizedSlugs: (doc.localizedSlugs as Record<string, string>) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.createdAt ?? null,
      });
    }
  }
  return entries;
};

// ─── Insight content ──────────────────────────────────────────────────────────

export const insightContentLoader = async () => {
  type InsightDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    abstract: string | null;
    content: unknown[] | null;
    localizedSlugs: unknown;
    updatedAt: string | null;
    createdAt: string | null;
  };

  const entries = [];
  for (const locale of LOCALES) {
    const docs = asDocs<InsightDoc>(
      await payloadPagingQuery(InsightsContentQuery, { variables: { locale } }),
    );
    for (const doc of docs) {
      if (!doc.slug) continue;
      entries.push({
        id: `${doc.id}_${locale}`,
        docId: String(doc.id),
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        abstract: doc.abstract ?? null,
        content: doc.content ?? [],
        localizedSlugs: (doc.localizedSlugs as Record<string, string>) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.createdAt ?? null,
      });
    }
  }
  return entries;
};

// ─── Story content ────────────────────────────────────────────────────────────

export const storyContentLoader = async () => {
  type StoryDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    content: unknown[] | null;
    dateOfPublication: string | null;
    localizedSlugs: unknown;
    updatedAt: string | null;
    createdAt: string | null;
  };

  const entries = [];
  for (const locale of LOCALES) {
    const docs = asDocs<StoryDoc>(
      await payloadPagingQuery(StoryItemsContentQuery, { variables: { locale } }),
    );
    for (const doc of docs) {
      if (!doc.slug) continue;
      entries.push({
        id: `${doc.id}_${locale}`,
        docId: String(doc.id),
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        content: doc.content ?? [],
        dateOfPublication: doc.dateOfPublication ?? null,
        localizedSlugs: (doc.localizedSlugs as Record<string, string>) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.createdAt ?? null,
      });
    }
  }
  return entries;
};

// ─── Webinar content ──────────────────────────────────────────────────────────

export const webinarContentLoader = async () => {
  type WebinarDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    paragraph: string | null;
    date: string | null;
    content: unknown[] | null;
    localizedSlugs: unknown;
    updatedAt: string | null;
    createdAt: string | null;
  };

  const entries = [];
  for (const locale of LOCALES) {
    const docs = asDocs<WebinarDoc>(
      await payloadPagingQuery(WebinarItemsContentQuery, { variables: { locale } }),
    );
    for (const doc of docs) {
      if (!doc.slug) continue;
      entries.push({
        id: `${doc.id}_${locale}`,
        docId: String(doc.id),
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        paragraph: doc.paragraph ?? null,
        date: doc.date ?? null,
        content: doc.content ?? [],
        localizedSlugs: (doc.localizedSlugs as Record<string, string>) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.createdAt ?? null,
      });
    }
  }
  return entries;
};

// ─── Catalogues ───────────────────────────────────────────────────────────────

export const cataloguesLoader = async () => {
  type CatalogueDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    content: unknown[] | null;
    localizedSlugs: unknown;
    updatedAt: string | null;
    createdAt: string | null;
  };

  type UpdatesDocs = { docs: { createdAt: string }[] };
  type UpdatesResult = {
    NewsItems: UpdatesDocs;
    StoryItems: UpdatesDocs;
    WebinarItems: UpdatesDocs;
    Resources: UpdatesDocs;
  };

  // Fetch last-update dates for catalogue feed badges (locale-independent)
  const updatesData = (await payloadQuery(LastItemsUpdateQuery, {
    variables: { locale: "it" },
  })) as unknown as UpdatesResult;
  const datesRegistry = {
    news: updatesData?.NewsItems?.docs?.[0]?.createdAt,
    story: updatesData?.StoryItems?.docs?.[0]?.createdAt,
    webinar: updatesData?.WebinarItems?.docs?.[0]?.createdAt,
    resource: updatesData?.Resources?.docs?.[0]?.createdAt,
  };

  const entries = [];
  for (const locale of LOCALES) {
    const docs = asDocs<CatalogueDoc>(
      await payloadPagingQuery(CataloguesContentQuery, { variables: { locale } }),
    );
    for (const doc of docs) {
      if (!doc.slug) continue;
      entries.push({
        id: `${doc.id}_${locale}`,
        docId: String(doc.id),
        locale,
        slug: doc.slug,
        title: doc.title ?? null,
        content: doc.content ?? [],
        localizedSlugs: (doc.localizedSlugs as Record<string, string>) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.createdAt ?? null,
        datesRegistry,
      });
    }
  }
  return entries;
};

// ─── Globals (DatoCMS — unchanged) ───────────────────────────────────────────

export const globalSettingsLoader = async () => {
  type LocaleValue = { locale: string; value: unknown };
  type LinkValue = { locale: string; value: { label: string; url: string }[] };
  type GlobalSettingRaw = {
    globalSetting: Record<string, LocaleValue[] | LinkValue[]>;
  };
  type LocaleMap = Record<string, Record<string, unknown>>;

  function transformGlobalSettings(data: GlobalSettingRaw) {
    const localesMap: LocaleMap = {};
    const fieldMapping: Record<string, string> = {
      _allSiteNameLocales: "siteName",
      _allLastUpdateLabelLocales: "lastUpdateLabel",
      _allLinksLocales: "links",
    };
    Object.entries(fieldMapping).forEach(([datoKey, zodKey]) => {
      const translations = (data.globalSetting[datoKey] || []) as LocaleValue[];
      translations.forEach((item) => {
        if (!localesMap[item.locale]) localesMap[item.locale] = {};
        if (zodKey === "links") {
          const links = (item.value as { label: string; url: string }[]) || [];
          localesMap[item.locale][zodKey] = links.map((link) => ({
            label: link.label,
            url: link.url,
          }));
        } else {
          localesMap[item.locale][zodKey] = item.value;
        }
      });
    });
    return Object.entries(localesMap).map(([locale, values]) => ({
      id: locale,
      locale,
      value: values,
    }));
  }

  const response = await executeQuery(AllGlobalSettingsQuery);
  if (!response?.globalSetting) return [];
  return transformGlobalSettings(response);
};

export const homepageLoader = async () => {
  type HomepageGlobal = {
    id: number;
    title: string | null;
    content: unknown[] | null;
    updatedAt: string;
    createdAt: string;
  };

  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<HomepageGlobal>(
        "/globals/homepage",
        `locale=${locale}&depth=3&fallbackLocale=none`,
      ),
    ),
  );

  const base = results[0];
  return [
    {
      id: String(base.id),
      title: base.title,
      publishedAt: base.updatedAt || base.createdAt,
      updatedAt: base.updatedAt,
      allContentLocales: LOCALES.map((locale, i) => ({
        locale,
        value: results[i].content || [],
      })),
    },
  ];
};

export const searchLoader = async () => {
  const response = await executeQuery(SearchPageContentQuery);
  return response?.search ? [response.search] : [];
};

export const layoutLoader = async () => {
  const response = await executeQuery(LayoutQuery);
  if (!response?.homepage?.id) return [];
  return [
    {
      id: "layout",
      layout: response?.layout,
      search: response?.search,
      homepageId: response?.homepage?.id,
    },
  ];
};

export const sidebarLoader = async () => {
  const response = await executeQuery(SidebarQuery);
  if (!response?.sidebarForArticle) return [];
  return [{ ...response.sidebarForArticle, id: "sidebar" }];
};

export const localesLoader = async () => {
  const response = await executeQuery(LocalesQuery);
  if (!response?.site?.locales) return [];
  return [{ id: "site-locales", locales: response.site.locales }];
};

export const errorPageLoader = async () => {
  const response = await executeQuery(AllGlobalSettingsQuery);
  if (!response?.globalSetting) return [];
  return [
    {
      id: "error-page",
      globalSetting: response.globalSetting,
    },
  ];
};

export const siteMetaTagsLoader = async () => {
  const response = await executeQuery(SiteMetaTagsQuery);
  if (!response?.site?.faviconMetaTags) return [];
  return [{ id: "site-meta-tags", faviconMetaTags: response.site.faviconMetaTags }];
};

export const globalSeoLoader = async () => {
  const localesRes = await executeQuery(LocalesQuery);
  const locales = localesRes?.site?.locales || ["it"];

  const allLocalesResults = await Promise.all(
    locales.map(async (locale) => {
      const [
        homepageRes,
        articlesRes,
        insightsRes,
        cataloguesRes,
        pagesRes,
        storiesRes,
        webinarsRes,
        searchRes,
      ] = await Promise.all([
        executeQuery(HomepageSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(ArticlesSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(InsightsSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(CataloguesSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(PagesSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(StoriesSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(WebinarsSeoQuery, { variables: { locale } }),
        executeAutoPagingQuery(SearchSeoQuery, { variables: { locale } }),
      ]);

      type SeoRecord = {
        id: string;
        metaTags: unknown[];
        seo: unknown;
        updatedAt: string;
      };
      const mapEntry = (record: SeoRecord) => ({
        id: `${record.id}_${locale}`,
        recordId: record.id,
        locale,
        metaTags: record.metaTags,
        seo: record.seo,
        updatedAt: record.updatedAt,
      });

      return [
        ...(homepageRes?.homepage ? [mapEntry(homepageRes.homepage)] : []),
        ...(articlesRes?.allArticles?.map(mapEntry) || []),
        ...(insightsRes?.allInsights?.map(mapEntry) || []),
        ...(cataloguesRes?.allCatalogues?.map(mapEntry) || []),
        ...(pagesRes?.allPages?.map(mapEntry) || []),
        ...(storiesRes?.allStoryItems?.map(mapEntry) || []),
        ...(webinarsRes?.allWebinarItems?.map(mapEntry) || []),
        ...(searchRes?.search ? [mapEntry(searchRes.search)] : []),
      ];
    }),
  );

  return allLocalesResults.flat();
};

// ─── Search index (all documents) ────────────────────────────────────────────

export const allDocumentsLoader = async () => {
  // Query each locale and merge — the search index stores all locale variants.
  const localeResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const [
        articlesRes,
        insightsRes,
        storiesRes,
        newsRes,
        webinarsRes,
        resourcesRes,
        cataloguesRes,
        pagesRes,
      ] = await Promise.all([
        payloadPagingQuery(ArticlesIdxQuery, { variables: { locale } }),
        payloadPagingQuery(InsightsIdxQuery, { variables: { locale } }),
        payloadPagingQuery(StoriesIdxQuery, { variables: { locale } }),
        payloadPagingQuery(NewsIdxQuery, { variables: { locale } }),
        payloadPagingQuery(WebinarsIdxQuery, { variables: { locale } }),
        payloadPagingQuery(ResourcesIdxQuery),
        payloadPagingQuery(CataloguesIdxQuery, { variables: { locale } }),
        payloadPagingQuery(PagesIdxQuery, { variables: { locale } }),
      ]);

      const tag = (docs: unknown) =>
        asDocs<{ id: number }>(docs).map((d) => ({ ...d, locale }));

      return {
        articles: tag(articlesRes),
        insights: tag(insightsRes),
        stories: tag(storiesRes),
        news: tag(newsRes),
        webinars: tag(webinarsRes),
        resources: asDocs<unknown>(resourcesRes),
        catalogues: tag(cataloguesRes),
        pages: tag(pagesRes),
      };
    }),
  );

  return [
    {
      id: "all-documents",
      allArticles: localeResults.flatMap((r) => r.articles),
      allInsights: localeResults.flatMap((r) => r.insights),
      allStoryItems: localeResults.flatMap((r) => r.stories),
      allNewsItems: localeResults.flatMap((r) => r.news),
      allWebinarItems: localeResults.flatMap((r) => r.webinars),
      allResources: localeResults.flatMap((r) => r.resources),
      allCatalogues: localeResults.flatMap((r) => r.catalogues),
      allPages: localeResults.flatMap((r) => r.pages),
    },
  ];
};
