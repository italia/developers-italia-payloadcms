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
import { AllNewsQuery } from "@graphql/query/news";
import { AllResourcesQuery } from "@graphql/query/resource";
import { SiteMetaTagsQuery } from "@graphql/query/settings";
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
import { lexicalToHtml, lexicalToPlainText } from "@utils/lexicalUtils";

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
  "additional-content": "AdditionalContentRecord",
  "card-editorial-with-icon": "CardEditorialWithIconRecord",
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
  "Webinar-tab": "WebinarTabRecord",
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

// Fields defined as blocks with maxRows:1 in Payload — adapters expect a single object, not an array.
// Only field names that are unambiguously maxRows:1 everywhere they appear belong here — e.g. "statistics"
// is maxRows:1 on TextStatistic but a genuine multi-row list on StatisticBlock, so it's handled locally
// in TextAndStatisticsAdapter.astro instead of being added to this (name-only, not path-aware) set.
const SINGLE_BLOCK_FIELDS = new Set([
  "cta",
  "text",
  "additionalContent",
  "link",
  "privacyPolicy",
  "useCases",
  "subjects",
  "resources",
  "list",
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
      Array.isArray(val) &&
      val.length > 0 &&
      typeof val[0] === "object" &&
      val[0] !== null &&
      "value" in (val[0] as object) &&
      "relationTo" in (val[0] as object) &&
      !("blockType" in (val[0] as object))
    ) {
      // hasMany polymorphic relationship array: [{ value: doc, relationTo: "collection" }, …]
      // Flatten each item to the doc itself with a prefixed id ("articles:1", "story-items:4", …)
      // so that adapters can call linkResolver(item.id, locale) and access flat fields like item.title.
      type PolyRel = { value: Record<string, unknown> | null; relationTo: string };
      result[key] = (val as PolyRel[])
        .filter((rel) => rel.value != null)
        .map((rel) => ({
          ...(rel.value as Record<string, unknown>),
          id: `${rel.relationTo}:${(rel.value as Record<string, unknown>).id}`,
        }));
    } else if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      "value" in (val as object) &&
      "relationTo" in (val as object)
    ) {
      // Polymorphic relationship { value: doc, relationTo: collection }
      // Pre-compute the collection-prefixed linkMap key ("pages:13", "story-items:4", …)
      // and surface it as a flat { id } object — the same shape DatoCMS uses.
      // All adapters that call linkResolver(pointsTo.id, locale) will automatically
      // receive the correct prefixed key without any per-adapter changes.
      const rel = val as { value: { id: unknown } | null; relationTo: string };
      result[key] = rel.value != null
        ? { id: `${rel.relationTo}:${rel.value.id}` }
        : null;
    }
  }

  // Auto-convert Lexical richText JSON objects to HTML strings.
  // Excludes content/textContent (main rich body — deferred to Lexical renderer).
  const LEXICAL_KEEP_RAW = new Set(["content", "textContent"]);
  for (const [key, val] of Object.entries(result)) {
    if (
      !LEXICAL_KEEP_RAW.has(key) &&
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      (val as Record<string, unknown>)?.root &&
      ((val as Record<string, unknown>).root as Record<string, unknown>)?.type === "root"
    ) {
      result[key] = lexicalToHtml(val);
    }
  }

  // StructuredTextBlock: DatoCMS aliases "content" → "textContent"
  if (blockType === "structured-text-block" && "content" in result && !("textContent" in result)) {
    result.textContent = result.content;
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

// ─── Card collections (PayloadCMS REST) ──────────────────────────────────────
// Each loader fetches per locale then merges into one entry per document with
// allTitleLocales / allTopicLocales / … arrays — the same shape the DatoCMS
// mappers (mapNewsToCardEditorialNewsProps etc.) already expect.

type TopicDoc = { id: number | string; label?: string } | null;

function buildLocaleArray<T>(locale: string, value: T) {
  return [{ locale, value }];
}

function topicToLocaleArray(locale: string, topic: TopicDoc) {
  if (!topic) return [{ locale, value: null }];
  return [
    {
      locale,
      value: {
        id: String(topic.id),
        _allLabelLocales: [{ locale, value: topic.label ?? "" }],
      },
    },
  ];
}

// Merge per-locale doc arrays into one entry per document ID.
// The callback maps a locale + REST doc to the fields we need per locale.
function mergeByDocId<Raw extends { id: number | string }>(
  localeResults: { locale: string; docs: Raw[] }[],
  mapLocale: (locale: string, doc: Raw) => Record<string, unknown>,
  baseFrom?: (doc: Raw) => Record<string, unknown>,
): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();

  for (const { locale, docs } of localeResults) {
    for (const doc of docs) {
      const id = String(doc.id);
      if (!byId.has(id)) {
        byId.set(id, { id, ...(baseFrom ? baseFrom(doc) : {}) });
      }
      const entry = byId.get(id)!;
      const localePatch = mapLocale(locale, doc);
      for (const [k, v] of Object.entries(localePatch)) {
        const existing = entry[k] as unknown[];
        if (Array.isArray(existing) && Array.isArray(v)) {
          entry[k] = [...existing, ...(v as unknown[])];
        } else {
          entry[k] = v;
        }
      }
    }
  }

  return [...byId.values()];
}

// ─── News ─────────────────────────────────────────────────────────────────────

export const newsLoader = async () => {
  type NewsDoc = {
    id: number;
    title: string | null;
    link: string | null;
    paragraph: unknown;
    topic: TopicDoc;
    dateOfPublication: string | null;
    image: Record<string, unknown> | null;
    hasNextPage?: boolean;
  };
  type NewsList = { docs: NewsDoc[]; hasNextPage: boolean };

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateLimit = oneYearAgo.toISOString().split("T")[0]; // YYYY-MM-DD

  const localeResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs: NewsDoc[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const qs = `locale=${locale}&depth=1&limit=100&page=${page}&fallbackLocale=none&where[dateOfPublication][greater_than]=${dateLimit}`;
        const res = await payloadFetch<NewsList>("/news-items", qs).catch(() => ({ docs: [], hasNextPage: false }));
        docs.push(...res.docs);
        hasMore = res.hasNextPage;
        page++;
      }
      return { locale, docs };
    }),
  );

  return mergeByDocId(
    localeResults,
    (locale, doc) => ({
      allTitleLocales: buildLocaleArray(locale, doc.title ?? ""),
      allParagraphLocales: buildLocaleArray(locale, lexicalToHtml(doc.paragraph) ?? ""),
      allLinkLocales: buildLocaleArray(locale, doc.link ?? ""),
      allTopicLocales: topicToLocaleArray(locale, doc.topic),
    }),
    (doc) => ({
      publishedAt: doc.dateOfPublication ?? null,
      image: doc.image ?? null,
    }),
  );
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const storiesLoader = async () => {
  type StoryDoc = {
    id: number;
    title: string | null;
    paragraph: unknown;
    topic: TopicDoc;
    articleClassification: TopicDoc;
    dateOfPublication: string | null;
    image: Record<string, unknown> | null;
  };
  type StoryList = { docs: StoryDoc[]; hasNextPage: boolean };

  const localeResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs: StoryDoc[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const qs = `locale=${locale}&depth=1&limit=100&page=${page}&fallbackLocale=none`;
        const res = await payloadFetch<StoryList>("/story-items", qs).catch(() => ({ docs: [], hasNextPage: false }));
        docs.push(...res.docs);
        hasMore = res.hasNextPage;
        page++;
      }
      return { locale, docs };
    }),
  );

  return mergeByDocId(
    localeResults,
    (locale, doc) => ({
      allTitleLocales: buildLocaleArray(locale, doc.title ?? ""),
      allParagraphLocales: buildLocaleArray(locale, lexicalToHtml(doc.paragraph) ?? ""),
      allTopicLocales: topicToLocaleArray(locale, doc.topic),
    }),
    (doc) => ({
      publishedAt: doc.dateOfPublication ?? null,
      image: doc.image ?? null,
      articleClassification: doc.articleClassification
        ? { id: String((doc.articleClassification as { id: number | string }).id) }
        : null,
    }),
  );
};

// ─── Webinars ─────────────────────────────────────────────────────────────────

export const webinarsLoader = async () => {
  type WebinarDoc = {
    id: number;
    title: string | null;
    paragraph: unknown;
    date: string | null;
    topic: TopicDoc;
    image: Record<string, unknown> | null;
  };
  type WebinarList = { docs: WebinarDoc[]; hasNextPage: boolean };

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateLimit = oneYearAgo.toISOString().split("T")[0];

  const localeResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs: WebinarDoc[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const qs = `locale=${locale}&depth=1&limit=100&page=${page}&fallbackLocale=none&where[date][greater_than_equal]=${dateLimit}`;
        const res = await payloadFetch<WebinarList>("/webinar-items", qs).catch(() => ({ docs: [], hasNextPage: false }));
        docs.push(...res.docs);
        hasMore = res.hasNextPage;
        page++;
      }
      return { locale, docs };
    }),
  );

  return mergeByDocId(
    localeResults,
    (locale, doc) => ({
      allTitleLocales: buildLocaleArray(locale, doc.title ?? ""),
      allParagraphLocales: buildLocaleArray(locale, lexicalToHtml(doc.paragraph) ?? ""),
      allTopicLocales: topicToLocaleArray(locale, doc.topic),
    }),
    (doc) => ({
      publishedAt: doc.date ?? null,
      image: doc.image ?? null,
    }),
  );
};

// ─── Resources ────────────────────────────────────────────────────────────────

export const resourcesLoader = async () => {
  type ResourceBlock = {
    blockType: string;
    label?: string;
    url?: string;
    description?: string;
    doc?: { url?: string; filename?: string; format?: string };
  };
  type CategoryDoc = { id: number | string; label?: string };
  type ResourceDoc = {
    id: number;
    resource: ResourceBlock[] | ResourceBlock | null;
    category: CategoryDoc[] | null;
    typeResource: CategoryDoc | null;
  };
  type ResourceList = { docs: ResourceDoc[]; hasNextPage: boolean };

  const localeResults = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs: ResourceDoc[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const qs = `locale=${locale}&depth=1&limit=100&page=${page}&fallbackLocale=none`;
        const res = await payloadFetch<ResourceList>("/resources", qs).catch(() => ({ docs: [], hasNextPage: false }));
        docs.push(...res.docs);
        hasMore = res.hasNextPage;
        page++;
      }
      return { locale, docs };
    }),
  );

  return mergeByDocId(
    localeResults,
    (locale, doc) => {
      const block = Array.isArray(doc.resource)
        ? doc.resource[0]
        : doc.resource;

      const resourceValue = block
        ? block.blockType === "external-link"
          ? {
              id: block.label ?? "",
              componentName: "ExternalLinkRecord",
              label: block.label ?? "",
              url: block.url ?? "",
              description: block.description ?? null,
            }
          : {
              id: block.label ?? "",
              componentName: "DownloadLinkRecord",
              label: block.label ?? "",
              description: block.description ?? null,
              doc: block.doc ?? null,
            }
        : undefined;

      const categories = (doc.category ?? []).map((cat) => ({
        id: String(cat.id),
        _allLabelLocales: [{ locale, value: cat.label ?? "" }],
      }));

      return {
        allResourceLocales: [{ locale, value: resourceValue }],
        allCategoryLocales: [{ locale, value: categories }],
        allTypeResourceLocales: [
          {
            locale,
            value: doc.typeResource
              ? {
                  _allLabelLocales: [{ locale, value: (doc.typeResource as CategoryDoc).label ?? "" }],
                }
              : null,
          },
        ],
      };
    },
    () => ({}),
  );
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
    paragraph: unknown;
    content: unknown[] | null;
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
          paragraph: lexicalToHtml(doc.paragraph) ?? null,
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

// ─── Insight content (PayloadCMS REST, per-locale entries) ────────────────────

export const insightContentLoader = async () => {
  type InsightDoc = {
    id: number;
    slug: string | null;
    title: string | null;
    abstract: unknown;
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
          abstract: lexicalToPlainText(doc.abstract) ?? null,
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
    paragraph: unknown;
    content: unknown[] | null;
    dateOfPublication: string | null;
    articleClassification: { id: number | string; label?: string | null } | null;
    topic: { id: number | string; label?: string | null } | null;
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
          paragraph: lexicalToHtml(doc.paragraph) ?? null,
          content: (doc.content ?? []).map((b) => normalizePayloadBlock(b as Record<string, unknown>)),
          dateOfPublication: doc.dateOfPublication ?? null,
          articleClassificationId: doc.articleClassification
            ? String(doc.articleClassification.id)
            : null,
          category: doc.articleClassification?.label ?? null,
          topicLabel: doc.topic?.label ?? null,
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
    paragraph: unknown;
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
          paragraph: lexicalToHtml(doc.paragraph) ?? null,
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

// ─── Globals (PayloadCMS REST) ────────────────────────────────────────────────

export const globalSettingsLoader = async () => {
  type GlobalSettingDoc = {
    lastUpdateLabel: string | null;
    siteName: string | null;
    links: { blockType: string; label: string; url: string }[] | null;
  };

  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<GlobalSettingDoc>(
        "/globals/global-setting",
        `locale=${locale}&depth=1&fallbackLocale=none`,
      ).catch(() => null),
    ),
  );

  return LOCALES.map((locale, i) => {
    const doc = results[i];
    if (!doc) {
      return { id: locale, locale, value: STATIC_GLOBAL_SETTINGS_VALUE };
    }
    return {
      id: locale,
      locale,
      value: {
        siteName: doc.siteName ?? "",
        lastUpdateLabel: doc.lastUpdateLabel ?? "",
        links: (doc.links ?? []).map((link) => ({
          label: link.label,
          url: link.url,
        })),
      },
    };
  });
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
  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<SearchGlobal>(
        "/globals/search",
        `locale=${locale}&depth=3&fallbackLocale=none`,
      ).catch(() => null),
    ),
  );

  const locales = LOCALES.filter((_, i) => results[i]?.slug);
  if (locales.length === 0) {
    return [{ id: "search-empty", locales: [], allContentLocales: [] }];
  }

  return [
    {
      id: "search",
      locales,
      allContentLocales: LOCALES.map((locale, i) => ({
        locale,
        value: (results[i]?.content ?? []).map((b) =>
          normalizePayloadBlock(b as Record<string, unknown>),
        ),
      })),
    },
  ];
};

type SearchGlobal = {
  isSearchEnabled: boolean | null;
  searchLabel: string | null;
  slug: string | null;
  content: unknown[] | null;
};

export const layoutLoader = async () => {
  type LayoutGlobal = {
    variant: string;
    heading: unknown;
    logoSelect: { url: string } | null;
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

  const [results, searchResults] = await Promise.all([
    Promise.all(
      LOCALES.map((locale) =>
        payloadFetch<LayoutGlobal>(
          "/globals/layout",
          `locale=${locale}&depth=3&fallbackLocale=none`,
        ),
      ),
    ),
    Promise.all(
      LOCALES.map((locale) =>
        payloadFetch<SearchGlobal>(
          "/globals/search",
          `locale=${locale}&fallbackLocale=none`,
        ),
      ),
    ),
  ]);

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
    logoSelect: base.logoSelect?.url ?? "",
    showSitemapLink: base.showSitemapLink ?? false,
    locales: [...LOCALES],

    _allTaglineLocales: buildTextLocales((r) => r.tagline),
    _allHeadingLocales: buildTextLocales((r) => lexicalToHtml(r.heading) ?? null),
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

  const search = {
    id: "search",
    isSearchEnabled: searchResults[0]?.isSearchEnabled ?? false,
    _allSearchLabelLocales: LOCALES.map((locale, i) => ({
      locale,
      value: searchResults[i]?.searchLabel ?? "",
    })),
  };

  return [
    {
      id: "layout",
      layout,
      search,
      homepageId: "homepage",
    },
  ];
};

export const sidebarLoader = async () => {
  type SidebarGlobal = {
    headerLabel: string | null;
    openLabel: string | null;
    closeLabel: string | null;
    menu: unknown[] | null;
  };

  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<SidebarGlobal>(
        "/globals/sidebar-for-article",
        `locale=${locale}&depth=2&fallbackLocale=none`,
      ),
    ),
  );

  const buildTextLocales = (getter: (r: SidebarGlobal) => string | null) =>
    LOCALES.map((locale, i) => ({ locale, value: getter(results[i]) ?? "" }));

  const buildBlocksLocales = (getter: (r: SidebarGlobal) => unknown[] | null) =>
    LOCALES.map((locale, i) => ({
      locale,
      value: (getter(results[i]) ?? []).map((b) =>
        normalizePayloadBlock(b as Record<string, unknown>),
      ),
    }));

  return [
    {
      id: "sidebar",
      _allHeaderLabelLocales: buildTextLocales((r) => r.headerLabel),
      _allOpenLabelLocales: buildTextLocales((r) => r.openLabel),
      _allCloseLabelLocales: buildTextLocales((r) => r.closeLabel),
      _allMenuLocales: buildBlocksLocales((r) => r.menu),
    },
  ];
};

export const localesLoader = async () => {
  return [{ id: "site-locales", locales: ["it", "en"] as const }];
};

export const errorPageLoader = async () => {
  type GlobalSettingErrorDoc = {
    title: string | null;
    paragraph: unknown;
    labelCta: string | null;
    image: { url: string; width?: number | null; height?: number | null; alt?: string | null } | null;
  };

  const results = await Promise.all(
    LOCALES.map((locale) =>
      payloadFetch<GlobalSettingErrorDoc>(
        "/globals/global-setting",
        `locale=${locale}&depth=1&fallbackLocale=none`,
      ).catch(() => null),
    ),
  );

  const buildTextLocales = (getter: (r: GlobalSettingErrorDoc) => string | null) =>
    LOCALES.map((locale, i) => {
      const doc = results[i];
      return { locale, value: (doc ? getter(doc) : null) ?? "" };
    });

  const image = results.find((r) => r?.image)?.image ?? null;
  const hasData = results.some((r) => r !== null);

  return [
    {
      id: "error-page",
      globalSetting: hasData
        ? {
            _allTitleLocales: buildTextLocales((r) => r.title),
            _allParagraphLocales: buildTextLocales((r) => lexicalToHtml(r.paragraph)),
            _allLabelCtaLocales: buildTextLocales((r) => r.labelCta),
            image,
          }
        : null,
      homepageId: "homepage",
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
