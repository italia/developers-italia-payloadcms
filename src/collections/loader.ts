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
import { SidebarQuery } from "@graphql/query/layout";
import { AllNewsQuery } from "@graphql/query/news";
import { AllResourcesQuery } from "@graphql/query/resource";
import { SearchPageContentQuery } from "@graphql/query/search";
import {
  AllGlobalSettingsQuery,
  SiteMetaTagsQuery,
} from "@graphql/query/settings";
import { ErrorPageQuery } from "@graphql/query/errorPage";
import { AllStoryCardQuery } from "@graphql/query/story";
import { AllWebinarQuery } from "@graphql/query/webinar";
import { LastItemsUpdateQuery } from "@graphql/query/catalogue";
import { executeAutoPagingQuery, executeQuery } from "@lib/datocms";
import {
  executeAutoPagingQuery as payloadPagingQuery,
  executeQuery as payloadQuery,
  payloadFetch,
} from "@lib/payloadcms";
import {
  STATIC_GLOBAL_SETTINGS_VALUE,
} from "@data/staticLayout";

const LOCALES = ["it", "en"] as const;
type Locale = (typeof LOCALES)[number];

const PAYLOAD_BLOCK_TYPE_MAP: Record<string, string> = {
  "hero": "HeroRecord",
  "news-feed": "NewsFeedRecord",
  "support-channels-section": "SupportChannelsSectionRecord",
  "faq-section": "FaqSectionRecord",
  "data-section": "DataSectionRecord",
  "use-case-container": "UseCaseContainerRecord",
  "topic-filter": "TopicFilterRecord",
  "support-cta-section": "SupportCtaSectionRecord",
  "structured-text-block": "StructuredTextRecord",
  "list-collection": "ListCollectionRecord",
  "catalogue-feed": "CatalogueFeedRecord",
  "action-card": "ActionCardRecord",
  "search-bar": "SearchBarRecord",
  "text-image": "TextImageRecord",
  "text-statistic": "TextStatisticRecord",
  "text-use-case": "TextUseCaseRecord",
  "text-accordion": "TextAccordionRecord",
  "webinar-description": "WebinarDescriptionRecord",
  "speaker": "SpeakerRecord",
  "intro-article": "IntroArticleRecord",
  "callout-link": "CalloutLinkRecord",
  "text-only": "TextOnlyRecord",
  "card-link-list": "CardLinkListRecord",
  "list-card-editorial-with-icon": "ListCardEditorialWithIconRecord",
  "ordered-list": "OrderedListRecord",
  "callout": "CalloutRecord",
  "quick-link-card": "QuickLinkCardRecord",
  "topics-block": "TopicsBlockRecord",
  "list-card-info": "ListCardInfoRecord",
  "list-blockquote": "ListBlockquoteRecord",
  "related-article": "RelatedArticleRecord",
  "image-block": "ImageBlockRecord",
  "news-tab": "NewsTabRecord",
  "story-tab": "StoryTabRecord",
  "article-navigation": "ArticleNavigationRecord",
  "article-list": "ArticleListRecord",
  "internal-link": "InternalLinkRecord",
  "download-link": "DownloadLinkRecord",
  "author-list": "AuthorListRecord",
  "icon-list-block": "IconListBlockRecord",
  "accordion-block": "AccordionBlockRecord",
  "statistic-block": "StatisticBlockRecord",
  "use-case-block": "UseCaseBlockRecord",
  "text-block": "TextBlockRecord",
  "card-link": "CardLinkRecord",
  "link-block": "LinkBlockRecord",
  "external-link": "ExternalLinkRecord",
  "supporting-brand": "SupportingBrandRecord",
  "menu-item": "MenuItemRecord",
  "mega-menu-item": "MegaMenuItemRecord",
  "brand": "BrandRecord",
  "brand-header": "BrandHeaderRecord",
  "menu-article-item": "MenuArticleItemRecord",
  "accordion-menu": "AccordionMenuRecord",
  "list-external-link": "ListExternalLinkRecord",
};

// Fields defined as blocks with maxRows:1 in Payload — adapters expect a single object, not an array
const SINGLE_BLOCK_FIELDS = new Set([
  "cta",
  "text",
  "additionalContent",
  "link",
  "privacyPolicy",
]);

function normalizePayloadBlock(block: Record<string, unknown>): Record<string, unknown> {
  const { blockType, bg, ...rest } = block;
  const result: Record<string, unknown> = {
    ...rest,
    ...(blockType !== undefined && {
      componentName: PAYLOAD_BLOCK_TYPE_MAP[blockType as string] ?? blockType,
    }),
    ...(bg !== undefined && { backgroundColor: bg }),
  };

  for (const [key, val] of Object.entries(result)) {
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      typeof val[0] === "object" &&
      val[0] !== null &&
      "blockType" in (val[0] as object)
    ) {
      // Blocks array — recurse and optionally unwrap to single item
      const normalized = (val as Record<string, unknown>[]).map(normalizePayloadBlock);
      result[key] = SINGLE_BLOCK_FIELDS.has(key) ? (normalized[0] ?? null) : normalized;
    } else if (Array.isArray(val) && val.length === 0 && SINGLE_BLOCK_FIELDS.has(key)) {
      result[key] = null;
    } else if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      "value" in (val as object) &&
      "relationTo" in (val as object)
    ) {
      // Polymorphic relationship { value: doc, relationTo: collection } → { id }
      const rel = val as { value: { id: unknown } | null; relationTo: string };
      result[key] = rel.value ? { id: rel.value.id } : null;
    }
  }

  return result;
}

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
        content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
        localizedSlugs: slugMap.get(docId) ?? null,
        updatedAt: doc.updatedAt ?? null,
        publishedAt: doc.updatedAt ?? doc.createdAt ?? null,
      });
    }
  }

  return entries;
};

// ─── Article content (PayloadCMS REST, per-locale entries) ────────────────────

export const articleContentLoader = async () => {
  type ArticleDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    paragraph: string | null;
    content: unknown;
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    createdAt: string | null;
  };
  type ArticleList = { docs: ArticleDoc[]; hasNextPage: boolean };

  const entries = [];
  for (const locale of LOCALES) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const qs = `locale=${locale}&depth=3&limit=100&page=${page}&fallbackLocale=none`;
      const res = await payloadFetch<ArticleList>("/articles", qs);
      for (const doc of res.docs) {
        if (!doc.slug) continue;
        entries.push({
          id: `${doc.id}_${locale}`,
          docId: String(doc.id),
          locale,
          slug: doc.slug,
          title: doc.title ?? null,
          paragraph: doc.paragraph ?? null,
          content: doc.content ?? null,
          localizedSlugs: doc.localizedSlugs ?? null,
          updatedAt: doc.updatedAt ?? null,
          publishedAt: doc.createdAt ?? null,
        });
      }
      hasMore = res.hasNextPage;
      page++;
    }
  }
  return entries;
};

// ─── Insight content (PayloadCMS REST, per-locale entries) ────────────────────

export const insightContentLoader = async () => {
  type InsightDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    abstract: string | null;
    content: unknown[] | null;
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    createdAt: string | null;
  };
  type InsightList = { docs: InsightDoc[]; hasNextPage: boolean };

  const entries = [];
  for (const locale of LOCALES) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const qs = `locale=${locale}&depth=3&limit=100&page=${page}&fallbackLocale=none`;
      const res = await payloadFetch<InsightList>("/insights", qs);
      for (const doc of res.docs) {
        if (!doc.slug) continue;
        entries.push({
          id: `${doc.id}_${locale}`,
          docId: String(doc.id),
          locale,
          slug: doc.slug,
          title: doc.title ?? null,
          abstract: doc.abstract ?? null,
          content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
          localizedSlugs: doc.localizedSlugs ?? null,
          updatedAt: doc.updatedAt ?? null,
          publishedAt: doc.createdAt ?? null,
        });
      }
      hasMore = res.hasNextPage;
      page++;
    }
  }
  return entries;
};

// ─── Story content (PayloadCMS REST, per-locale entries) ──────────────────────

export const storyContentLoader = async () => {
  type StoryDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    content: unknown[] | null;
    dateOfPublication: string | null;
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    createdAt: string | null;
  };
  type StoryList = { docs: StoryDoc[]; hasNextPage: boolean };

  const entries = [];
  for (const locale of LOCALES) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const qs = `locale=${locale}&depth=3&limit=100&page=${page}&fallbackLocale=none`;
      const res = await payloadFetch<StoryList>("/story-items", qs);
      for (const doc of res.docs) {
        if (!doc.slug) continue;
        entries.push({
          id: `${doc.id}_${locale}`,
          docId: String(doc.id),
          locale,
          slug: doc.slug,
          title: doc.title ?? null,
          content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
          dateOfPublication: doc.dateOfPublication ?? null,
          localizedSlugs: doc.localizedSlugs ?? null,
          updatedAt: doc.updatedAt ?? null,
          publishedAt: doc.createdAt ?? null,
        });
      }
      hasMore = res.hasNextPage;
      page++;
    }
  }
  return entries;
};

// ─── Webinar content (PayloadCMS REST, per-locale entries) ────────────────────

export const webinarContentLoader = async () => {
  type WebinarDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    paragraph: string | null;
    date: string | null;
    content: unknown[] | null;
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    createdAt: string | null;
  };
  type WebinarList = { docs: WebinarDoc[]; hasNextPage: boolean };

  const entries = [];
  for (const locale of LOCALES) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const qs = `locale=${locale}&depth=3&limit=100&page=${page}&fallbackLocale=none`;
      const res = await payloadFetch<WebinarList>("/webinar-items", qs);
      for (const doc of res.docs) {
        if (!doc.slug) continue;
        entries.push({
          id: `${doc.id}_${locale}`,
          docId: String(doc.id),
          locale,
          slug: doc.slug,
          title: doc.title ?? null,
          paragraph: doc.paragraph ?? null,
          date: doc.date ?? null,
          content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
          localizedSlugs: doc.localizedSlugs ?? null,
          updatedAt: doc.updatedAt ?? null,
          publishedAt: doc.createdAt ?? null,
        });
      }
      hasMore = res.hasNextPage;
      page++;
    }
  }
  return entries;
};

// ─── Catalogues (PayloadCMS REST, per-locale entries) ─────────────────────────

export const cataloguesLoader = async () => {
  type CatalogueDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    content: unknown[] | null;
    localizedSlugs: Record<string, string> | null;
    updatedAt: string | null;
    createdAt: string | null;
  };
  type CatalogueList = { docs: CatalogueDoc[]; hasNextPage: boolean };

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
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const qs = `locale=${locale}&depth=3&limit=100&page=${page}&fallbackLocale=none`;
      const res = await payloadFetch<CatalogueList>("/catalogues", qs);
      for (const doc of res.docs) {
        if (!doc.slug) continue;
        entries.push({
          id: `${doc.id}_${locale}`,
          docId: String(doc.id),
          locale,
          slug: doc.slug,
          title: doc.title ?? null,
          content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
          localizedSlugs: doc.localizedSlugs ?? null,
          updatedAt: doc.updatedAt ?? null,
          publishedAt: doc.createdAt ?? null,
          datesRegistry,
        });
      }
      hasMore = res.hasNextPage;
      page++;
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
  if (!response?.globalSetting) {
    return LOCALES.map((locale) => ({ id: locale, locale, value: STATIC_GLOBAL_SETTINGS_VALUE }));
  }
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
        value: (results[i].content || []).map((b) =>
          normalizePayloadBlock(b as Record<string, unknown>),
        ),
      })),
    },
  ];
};

export const searchLoader = async () => {
  const response = await executeQuery(SearchPageContentQuery);
  return response?.search
    ? [response.search]
    : [{ id: "search-empty", locales: [], allContentLocales: [] }];
};

export const layoutLoader = async () => {
  type LayoutGlobal = {
    variant: string;
    heading: string | null;
    logoSelect: string;
    organizations: unknown[] | null;
    listNavbarBrand: unknown[] | null;
    topicTitle: string | null;
    metaNavigation: unknown[] | null;
    topicLink: unknown[] | null;
    siteName: string;
    utilityTitle: string | null;
    tagline: string | null;
    utility: unknown[] | null;
    mailingListForm: unknown[] | null;
    navigationBar: unknown[] | null;
    navigationBarSecondary: unknown[] | null;
    showSitemapLink: boolean;
    smallPrint: unknown[] | null;
  };

  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<LayoutGlobal>(
        "/globals/layout",
        `locale=${locale}&depth=3&fallbackLocale=none`,
      ),
    ),
  );

  const base = results[0];

  const buildTextLocales = (getter: (r: LayoutGlobal) => string | null) =>
    LOCALES.map((locale, i) => ({ locale, value: getter(results[i]) ?? "" }));

  const buildBlocksLocales = (getter: (r: LayoutGlobal) => unknown[] | null) =>
    LOCALES.map((locale, i) => ({
      locale,
      value: (getter(results[i]) ?? []).map((b) =>
        normalizePayloadBlock(b as Record<string, unknown>),
      ),
    }));

  const buildSingleBlockLocales = (getter: (r: LayoutGlobal) => unknown[] | null) =>
    LOCALES.map((locale, i) => {
      const arr = getter(results[i]) ?? [];
      return {
        locale,
        value: arr[0] ? normalizePayloadBlock(arr[0] as Record<string, unknown>) : null,
      };
    });

  const layout = {
    variant: base.variant,
    siteName: base.siteName,
    logoSelect: base.logoSelect,
    showSitemapLink: base.showSitemapLink ?? false,
    locales: [...LOCALES],

    _allTaglineLocales: buildTextLocales((r) => r.tagline),
    _allHeadingLocales: buildTextLocales((r) => r.heading),
    _allTopicTitleLocales: buildTextLocales((r) => r.topicTitle),
    _allUtilityTitleLocales: buildTextLocales((r) => r.utilityTitle),

    _allListNavbarBrandLocales: buildBlocksLocales((r) => r.listNavbarBrand),
    allMainNavigation: buildBlocksLocales((r) => r.navigationBar),
    allSecondaryNavigation: buildBlocksLocales((r) => r.navigationBarSecondary),
    allMetaNavigation: buildBlocksLocales((r) => r.metaNavigation),
    _allOrganizationsLocales: buildBlocksLocales((r) => r.organizations),
    _allTopicLinkLocales: buildBlocksLocales((r) => r.topicLink),
    _allUtilityLocales: buildBlocksLocales((r) => r.utility),
    _allSmallPrintLocales: buildBlocksLocales((r) => r.smallPrint),

    _allMailingListFormLocales: buildSingleBlockLocales((r) => r.mailingListForm),
  };

  return [
    {
      id: "layout",
      layout,
      search: null,
      homepageId: "homepage",
    },
  ];
};

export const sidebarLoader = async () => {
  const response = await executeQuery(SidebarQuery);
  return response?.sidebarForArticle
    ? [{ ...response.sidebarForArticle, id: "sidebar" }]
    : [{ id: "sidebar" }];
};

export const localesLoader = async () => {
  return [{ id: "site-locales", locales: ["it", "en"] as const }];
};

export const errorPageLoader = async () => {
  const response = await executeQuery(ErrorPageQuery);
  return [
    {
      id: "error-page",
      globalSetting: response?.globalSetting ?? null,
      homepageId: response?.homepage?.id ?? undefined,
    },
  ];
};

export const siteMetaTagsLoader = async () => {
  const response = await executeQuery(SiteMetaTagsQuery);
  return [{ id: "site-meta-tags", faviconMetaTags: response?.site?.faviconMetaTags ?? [] }];
};

export const globalSeoLoader = async () => {
  type PayloadSeoDoc = {
    id: number;
    seo: {
      title?: string | null;
      description?: string | null;
      image?: { url?: string; alt?: string; width?: number; height?: number } | null;
    } | null;
    updatedAt: string;
    createdAt: string;
  };

  type PayloadSeoList = {
    docs: PayloadSeoDoc[];
    hasNextPage: boolean;
  };

  type HomepageSeoGlobal = Omit<PayloadSeoDoc, "id">;

  const mapDoc = (id: string, locale: string, doc: Partial<PayloadSeoDoc>) => ({
    id: `${id}_${locale}`,
    recordId: id,
    locale,
    metaTags: [] as unknown[],
    seo: doc.seo ?? null,
    updatedAt: doc.updatedAt ?? doc.createdAt ?? "",
  });

  const fetchAllSeo = async (endpoint: string, locale: string): Promise<PayloadSeoDoc[]> => {
    const docs: PayloadSeoDoc[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await payloadFetch<PayloadSeoList>(
        endpoint,
        `locale=${locale}&depth=1&limit=100&page=${page}&fallbackLocale=none`,
      );
      docs.push(...res.docs);
      hasMore = res.hasNextPage;
      page++;
    }
    return docs;
  };

  const allLocalesResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const [homepageRes, pagesRes, articlesRes, insightsRes, cataloguesRes, storiesRes, webinarsRes] =
        await Promise.all([
          payloadFetch<HomepageSeoGlobal>(
            "/globals/homepage",
            `locale=${locale}&depth=1&fallbackLocale=none`,
          ),
          fetchAllSeo("/pages", locale),
          fetchAllSeo("/articles", locale),
          fetchAllSeo("/insights", locale),
          fetchAllSeo("/catalogues", locale),
          fetchAllSeo("/story-items", locale),
          fetchAllSeo("/webinar-items", locale),
        ]);

      return [
        mapDoc("homepage", locale, homepageRes),
        ...pagesRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
        ...articlesRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
        ...insightsRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
        ...cataloguesRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
        ...storiesRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
        ...webinarsRes.map((doc) => mapDoc(String(doc.id), locale, doc)),
      ];
    }),
  );

  const flat = allLocalesResults.flat();
  if (flat.length === 0) {
    return [{ id: "_empty", recordId: "_empty", locale: "it", metaTags: [], seo: null, updatedAt: "" }];
  }
  return flat;
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

// ─── SEO Default (per-locale fallbacks + site-wide fields) ───────────────────

export const seoDefaultLoader = async () => {
  type SeoDefaultGlobal = {
    siteName: string | null;
    fallbackTitle: string | null;
    fallbackDescription: string | null;
    titleSuffix: string | null;
    ogImage: { url: string; alt?: string } | null;
    favicon: { url: string } | null;
  };

  return Promise.all(
    LOCALES.map(async (locale) => {
      const res = await payloadFetch<SeoDefaultGlobal>(
        "/globals/seo-default",
        `locale=${locale}&depth=1&fallbackLocale=none`,
      );
      return {
        id: locale,
        locale,
        siteName: res.siteName ?? "",
        fallbackTitle: res.fallbackTitle ?? "",
        fallbackDescription: res.fallbackDescription ?? "",
        titleSuffix: res.titleSuffix ?? "",
        ogImage: res.ogImage ?? null,
        favicon: res.favicon ?? null,
      };
    }),
  );
};
