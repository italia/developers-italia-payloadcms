import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

import type { SiteLocale } from "@graphql/types";
import type { BreadcrumbStep, LocaleMap, SiteMap } from "@utils/linkMap/processItems";
import { PLATFORMS_STORY_CLASS_IDS } from "@utils/storyClassification";

dotenv.config({ override: false });

const BASE = process.env.PAYLOAD_URL;
const KEY = process.env.PAYLOAD_API_KEY;

if (!BASE || !KEY) {
  console.error("Missing required env vars: PAYLOAD_URL and PAYLOAD_API_KEY");
  process.exit(1);
}

async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE}/api/graphql`, {
    method: "POST",
    headers: {
      Authorization: `users API-Key ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const { data, errors } = (await res.json()) as {
    data: T;
    errors?: { message: string }[];
  };
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(", "));
  return data;
}

const LOCALES: SiteLocale[] = ["en", "it"];
const HOMEPAGE_ID = "homepage";
const SEARCH_ID = "search";
const LIMIT = 100;
const outputPath = `src/data/linkMap.json`;

// ---------------------------------------------------------------------------
// Raw GQL queries — Payload CMS schema
// ---------------------------------------------------------------------------

const HomepageQuery = `
  query HomepageLinks($locale: LocaleInputType) {
    Homepage(locale: $locale) { title }
  }
`;

const SearchQuery = `
  query SearchLinks($locale: LocaleInputType) {
    Search(locale: $locale) { slug title }
  }
`;

const PagesQuery = `
  query PagesLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    Pages(locale: $locale, limit: $limit, page: $page) {
      docs { id title localizedSlugs }
      hasNextPage
    }
  }
`;

const ArticlesQuery = `
  query ArticlesLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    Articles(locale: $locale, limit: $limit, page: $page) {
      docs { id title localizedSlugs parent(locale: $locale) { id } }
      hasNextPage
    }
  }
`;

const InsightsQuery = `
  query InsightsLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    Insights(locale: $locale, limit: $limit, page: $page) {
      docs { id title localizedSlugs parent(locale: $locale) { id } }
      hasNextPage
    }
  }
`;

const CataloguesQuery = `
  query CataloguesLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    Catalogues(locale: $locale, limit: $limit, page: $page) {
      docs {
        id title localizedSlugs parent(locale: $locale) { id }
        content {
          ... on CatalogueFeed {
            tabs {
              ... on CatalogueTab {
                newsPageTabType
                filterStory(locale: $locale) { id }
              }
            }
          }
        }
      }
      hasNextPage
    }
  }
`;

const StoryItemsQuery = `
  query StoryItemsLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    StoryItems(locale: $locale, limit: $limit, page: $page) {
      docs {
        id title localizedSlugs parent(locale: $locale) { id }
        articleClassification(locale: $locale) { id }
      }
      hasNextPage
    }
  }
`;

const WebinarItemsQuery = `
  query WebinarItemsLinks($locale: LocaleInputType, $limit: Int, $page: Int) {
    WebinarItems(locale: $locale, limit: $limit, page: $page) {
      docs { id title localizedSlugs parent(locale: $locale) { id } }
      hasNextPage
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayloadDoc = {
  id: number;
  title: string;
  /** JSON.stringify({en: "slug", it: "slug-it"}) stored by beforeRead hook */
  localizedSlugs: unknown;
  parent?: { id: number } | null;
  /** Story items only: the StoryClass (News / Platforms). */
  articleClassification?: { id: number | string } | null;
  /** Catalogues only: the CatalogueFeed blocks with their tabs. */
  content?: { tabs?: CatalogueTab[] | null }[] | null;
};

/** A tab of a catalogue's CatalogueFeed: which model it lists and, for
 * stories, which StoryClass it is filtered on. */
type CatalogueTab = {
  newsPageTabType?: string | null;
  filterStory?: { id: number | string } | null;
};

type NormalizedItem = {
  id: string;
  slugByLocale: Partial<Record<SiteLocale, string>>;
  titleByLocale: Partial<Record<SiteLocale, string>>;
  parentIdByLocale: Partial<Record<SiteLocale, string>>;
  classIdByLocale: Partial<Record<SiteLocale, string>>;
  tabsByLocale: Partial<Record<SiteLocale, CatalogueTab[]>>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the localizedSlugs JSON field into a locale→slug map. */
function parseSlugMap(raw: unknown): Partial<Record<SiteLocale, string>> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Partial<Record<SiteLocale, string>>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch {
      return {};
    }
  }
  return {};
}

/** Fetch all docs for one collection and locale, handling Payload pagination. */
async function fetchAllDocs(
  query: string,
  collectionKey: string,
  locale: SiteLocale,
): Promise<PayloadDoc[]> {
  const all: PayloadDoc[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await gqlFetch<Record<string, { docs: PayloadDoc[]; hasNextPage: boolean }>>(
      query,
      { locale, limit: LIMIT, page },
    );
    const data = result[collectionKey];
    all.push(...data.docs);
    hasNextPage = data.hasNextPage;
    page++;
  }

  return all;
}

/**
 * Merge docs from every locale into a single NormalizedItem per id.
 * slugByLocale is taken from localizedSlugs (locale-independent JSON field).
 * titleByLocale and parentIdByLocale are locale-specific.
 */
function normalize(docsByLocale: Partial<Record<SiteLocale, PayloadDoc[]>>): NormalizedItem[] {
  const byId = new Map<string, NormalizedItem>();

  for (const locale of LOCALES) {
    for (const doc of docsByLocale[locale] ?? []) {
      const id = String(doc.id);
      let item = byId.get(id);
      if (!item) {
        item = {
          id,
          slugByLocale: parseSlugMap(doc.localizedSlugs),
          titleByLocale: {},
          parentIdByLocale: {},
          classIdByLocale: {},
          tabsByLocale: {},
        };
        byId.set(id, item);
      }
      item.titleByLocale[locale] = doc.title;
      if (doc.parent?.id != null) {
        item.parentIdByLocale[locale] = String(doc.parent.id);
      }
      if (doc.articleClassification?.id != null) {
        item.classIdByLocale[locale] = String(doc.articleClassification.id);
      }
      if (doc.content) {
        item.tabsByLocale[locale] = doc.content.flatMap((block) => block?.tabs ?? []);
      }
    }
  }

  return [...byId.values()];
}

/** Return the locales where this item has a slug (i.e. actually exists). */
function itemLocales(item: NormalizedItem): SiteLocale[] {
  return LOCALES.filter((l) => !!item.slugByLocale[l]);
}

/**
 * Find the index page (catalogue) that lists a "tabbed" content item (news,
 * events, platforms). The catalogue's tab declares the listed model and, for
 * stories, the classification (`filterStory`) that tells News from Platforms:
 * without it the model alone is ambiguous, since both are `story_item`.
 */
function findOwningCatalogue(
  catalogues: NormalizedItem[],
  locale: SiteLocale,
  tabType: string,
  classId?: string,
): NormalizedItem | undefined {
  const matchByType = (withClassification: boolean) =>
    catalogues.find((catalogue) =>
      (catalogue.tabsByLocale[locale] ?? []).some(
        (tab) =>
          tab.newsPageTabType === tabType &&
          (withClassification
            ? tab.filterStory?.id != null &&
              String(tab.filterStory.id) === classId
            : !tab.filterStory),
      ),
    );

  return (classId ? matchByType(true) : undefined) ?? matchByType(false);
}

/** How a collection's items relate to the catalogue that lists them. */
type CatalogueOwnership = {
  catalogues: NormalizedItem[];
  /** `newsPageTabType` of the tabs that list this collection. */
  tabType: string;
};

/**
 * Write linkMap entries for a collection whose items live under a parent page.
 * Path:       /${locale}/${parentSlug}/${itemSlug}
 * Breadcrumb: [home, parentPage, item]
 *
 * With `ownership` (stories, events) the breadcrumb hangs off the catalogue
 * that lists the item (e.g. Community → News), as on the DatoCMS site, while
 * the path still comes from the parent page so that no URL changes. The one
 * exception are Platforms: in DatoCMS their parent was the Platforms
 * catalogue itself, which the Payload `parent` field (pages only) cannot
 * express, so a platform without a parent takes the catalogue's path.
 *
 * All linkMap keys and breadcrumb step IDs are prefixed with the collection slug
 * to avoid collisions across collections that share the same numeric ID space.
 * e.g.  "pages:13", "story-items:4", "articles:7", "insights:2", …
 */
function addCollectionEntries(
  items: NormalizedItem[],
  collectionPrefix: string,
  linkMap: SiteMap,
  pageById: Map<string, NormalizedItem>,
  homeTitleByLocale: Record<SiteLocale, string>,
  ownership?: CatalogueOwnership,
) {
  for (const item of items) {
    const key = `${collectionPrefix}:${item.id}`;
    linkMap[key] = {} as LocaleMap;

    for (const locale of itemLocales(item)) {
      const slug = item.slugByLocale[locale] ?? "";
      const parentId = item.parentIdByLocale[locale];
      const parent = parentId ? pageById.get(parentId) : null;
      const parentSlug = parent?.slugByLocale[locale];
      const selfStep = { title: item.titleByLocale[locale] ?? "", id: key };

      const classId = item.classIdByLocale[locale];
      const catalogue = ownership
        ? findOwningCatalogue(ownership.catalogues, locale, ownership.tabType, classId)
        : undefined;
      const catalogueEntry = catalogue
        ? linkMap[`catalogues:${catalogue.id}`]?.[locale]
        : undefined;

      let fullPath = parentSlug ? `${parentSlug}/${slug}` : slug;
      if (
        !parent &&
        catalogueEntry &&
        classId &&
        PLATFORMS_STORY_CLASS_IDS.has(classId)
      ) {
        fullPath = `${catalogueEntry.path.replace(`/${locale}/`, "")}/${slug}`;
      }

      let breadcrumb: BreadcrumbStep[];
      if (catalogueEntry?.breadcrumb.length) {
        breadcrumb = [...catalogueEntry.breadcrumb, selfStep];
      } else {
        breadcrumb = [{ title: homeTitleByLocale[locale], id: HOMEPAGE_ID }];
        if (parent) {
          // Parent is always a page — use "pages:" prefix for its breadcrumb step ID
          breadcrumb.push({ title: parent.titleByLocale[locale] ?? "", id: `pages:${parentId}` });
        }
        breadcrumb.push(selfStep);
      }

      linkMap[key][locale] = { path: `/${locale}/${fullPath}`, breadcrumb };
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function generateLinkMap() {
  console.log("Generating link map...");

  // Fetch homepage title per locale
  const [homepageEn, homepageIt] = await Promise.all([
    gqlFetch<{ Homepage: { title: string } | null }>(HomepageQuery, { locale: "en" }),
    gqlFetch<{ Homepage: { title: string } | null }>(HomepageQuery, { locale: "it" }),
  ]);
  const homeTitleByLocale: Record<SiteLocale, string> = {
    en: homepageEn.Homepage?.title ?? "",
    it: homepageIt.Homepage?.title ?? "",
  };

  // Fetch search page slug + title per locale
  const [searchEn, searchIt] = await Promise.all([
    gqlFetch<{ Search: { slug: string; title: string } | null }>(SearchQuery, { locale: "en" }),
    gqlFetch<{ Search: { slug: string; title: string } | null }>(SearchQuery, { locale: "it" }),
  ]);
  const searchSlugByLocale: Partial<Record<SiteLocale, string>> = {
    en: searchEn.Search?.slug || undefined,
    it: searchIt.Search?.slug || undefined,
  };
  const searchTitleByLocale: Partial<Record<SiteLocale, string>> = {
    en: searchEn.Search?.title || undefined,
    it: searchIt.Search?.title || undefined,
  };

  // Fetch all collections for every locale in parallel
  const [
    pagesEn, pagesIt,
    articlesEn, articlesIt,
    insightsEn, insightsIt,
    cataloguesEn, cataloguesIt,
    storiesEn, storiesIt,
    webinarsEn, webinarsIt,
  ] = await Promise.all([
    fetchAllDocs(PagesQuery, "Pages", "en"),
    fetchAllDocs(PagesQuery, "Pages", "it"),
    fetchAllDocs(ArticlesQuery, "Articles", "en"),
    fetchAllDocs(ArticlesQuery, "Articles", "it"),
    fetchAllDocs(InsightsQuery, "Insights", "en"),
    fetchAllDocs(InsightsQuery, "Insights", "it"),
    fetchAllDocs(CataloguesQuery, "Catalogues", "en"),
    fetchAllDocs(CataloguesQuery, "Catalogues", "it"),
    fetchAllDocs(StoryItemsQuery, "StoryItems", "en"),
    fetchAllDocs(StoryItemsQuery, "StoryItems", "it"),
    fetchAllDocs(WebinarItemsQuery, "WebinarItems", "en"),
    fetchAllDocs(WebinarItemsQuery, "WebinarItems", "it"),
  ]);

  const pages = normalize({ en: pagesEn, it: pagesIt });
  const articles = normalize({ en: articlesEn, it: articlesIt });
  const insights = normalize({ en: insightsEn, it: insightsIt });
  const catalogues = normalize({ en: cataloguesEn, it: cataloguesIt });
  const stories = normalize({ en: storiesEn, it: storiesIt });
  const webinars = normalize({ en: webinarsEn, it: webinarsIt });

  const pageById = new Map(pages.map((p) => [p.id, p]));
  const linkMap: SiteMap = {};

  // Homepage — stable synthetic ID, no parent
  linkMap[HOMEPAGE_ID] = {} as LocaleMap;
  for (const locale of LOCALES) {
    linkMap[HOMEPAGE_ID][locale] = { path: `/${locale}`, breadcrumb: [] };
  }

  // Search — stable synthetic ID, no parent, breadcrumb is just Home > Search
  linkMap[SEARCH_ID] = {} as LocaleMap;
  for (const locale of LOCALES) {
    const slug = searchSlugByLocale[locale];
    if (!slug) continue;
    linkMap[SEARCH_ID][locale] = {
      path: `/${locale}/${slug}`,
      breadcrumb: [
        { title: homeTitleByLocale[locale], id: HOMEPAGE_ID },
        { title: searchTitleByLocale[locale] ?? "", id: SEARCH_ID },
      ],
    };
  }

  // Pages — top-level, no parent
  // Keys are prefixed "pages:<id>" to avoid collisions with other collections.
  for (const page of pages) {
    const key = `pages:${page.id}`;
    linkMap[key] = {} as LocaleMap;
    for (const locale of itemLocales(page)) {
      linkMap[key][locale] = {
        path: `/${locale}/${page.slugByLocale[locale]}`,
        breadcrumb: [
          { title: homeTitleByLocale[locale], id: HOMEPAGE_ID },
          { title: page.titleByLocale[locale] ?? "", id: key },
        ],
      };
    }
  }

  // All other collections: path = /locale/parentSlug/itemSlug
  // Each collection gets its own prefix to avoid cross-collection ID collisions.
  addCollectionEntries(articles,   "articles",      linkMap, pageById, homeTitleByLocale);
  addCollectionEntries(insights,   "insights",      linkMap, pageById, homeTitleByLocale);
  addCollectionEntries(catalogues, "catalogues",    linkMap, pageById, homeTitleByLocale);
  // Stories and events take their breadcrumb from the catalogue listing them,
  // so the catalogues must already be in the map at this point.
  addCollectionEntries(stories,    "story-items",   linkMap, pageById, homeTitleByLocale, {
    catalogues,
    tabType: "story_item",
  });
  addCollectionEntries(webinars,   "webinar-items", linkMap, pageById, homeTitleByLocale, {
    catalogues,
    tabType: "webinar_item",
  });

  const fullOutputPath = path.resolve(outputPath);
  if (!fs.existsSync(path.dirname(fullOutputPath))) {
    fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
  }
  fs.writeFileSync(fullOutputPath, JSON.stringify(linkMap, null, 2));
  console.log(`Map successfully generated at: ${outputPath}`);
}

async function run() {
  try {
    await generateLinkMap();
    console.log("All link maps generated successfully.");
  } catch (error) {
    console.error("Error generating link maps:", error);
    process.exit(1);
  }
}

run();
