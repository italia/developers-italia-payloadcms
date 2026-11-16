import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import * as Mappers from "@utils/indexing/indexingMappers";
import { getBreadcrumbs } from "@utils/linkResolver";
import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { getCataloguesMapCategory, getTitleByTypeNews, getTitleByTypeResourse } from "@utils/indexing/getCategory";

export async function getStaticPaths() {
  const response = await getEntry("locales", "site-locales");

  const locales = response?.data.locales;
  if (!locales) throw new Error("Locales not found");

  return locales.map((lang) => ({
    params: {
      lang,
    },
  }));
}

export const prerender = true;

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as SiteLocale;
  const t = getI18n(lang);

  if (!lang) {
    return new Response("Language parameter is missing", { status: 400 });
  }

  const analyzer = t["language.analyzer"] || "standard";

  const responseCollection = await getEntry("documents", "all-documents");
  const response = responseCollection?.data;

  console.log("response", response);

  if (!response)
    return new Response("No documents to indexing", { status: 400 });

  const articles = response.allArticles;
  const insights = response.allInsights;
  const stories = response.allStoryItems;
  const newsItems = response.allNewsItems;
  const webinars = response.allWebinarItems;
  const resourses = response.allResources;
  const pages = response.allPages;

  const cataloguesMapCategory = getCataloguesMapCategory(
    response.allCatalogues,
    lang,
  );

  // Category shown with each search result, as on the previous site.
  // - Articles, guides and stories: the section they belong to, i.e. the step
  //   before the document in its breadcrumb ("Normativa", "Guide", "Notizie",
  //   "Piattaforme").
  // - External news and events: "<catalogue>, <tab>" of the catalogue that lists
  //   them. The tab types are the ones saved in the CMS CatalogueTab blocks.
  const sectionOf = (id: string) => {
    const steps = getBreadcrumbs(id, lang);
    return steps.length >= 2 ? steps[steps.length - 2].title : "";
  };
  const newsCategory = getTitleByTypeNews(cataloguesMapCategory, "news_item") || "";
  const webinarCategory = getTitleByTypeNews(cataloguesMapCategory, "webinar_item") || "";
  const resourseCategory = getTitleByTypeResourse(cataloguesMapCategory, "resources") || "";

  const allDocuments = [
    ...pages.map((item) => Mappers.getMapPages(item as any, lang)),
    ...newsItems.map((item) => Mappers.getMapNews(item as any, lang, newsCategory)),
    ...articles.map((item) =>
      Mappers.getMapArticle(item as any, lang, sectionOf(`articles:${item.id}`)),
    ),
    ...insights.map((item) =>
      Mappers.getMapInsight(item as any, lang, sectionOf(`insights:${item.id}`)),
    ),
    ...stories.map((item) => Mappers.getMapStory(item as any, lang, sectionOf(`story-items:${item.id}`))),
    ...webinars.map((item) =>
      Mappers.getMapWebinar(item as any, lang, webinarCategory),
    ),
    ...resourses
      .map((item) => Mappers.getMapResourse(item, lang, resourseCategory)),
  ]
    .filter(Boolean)
    // A document without a page on the site (not published, see
    // src/utils/publication.ts) resolves to "#": it must not be searchable.
    .filter(
      (document) =>
        (document as { internalLink?: string }).internalLink !== "#",
    );

  return new Response(
    JSON.stringify({
      analyzer: analyzer,
      documents: allDocuments,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
