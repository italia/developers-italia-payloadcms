import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import * as Mappers from "@utils/indexing/indexingMappers";
import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { getCataloguesMapCategory, getCategoryName, getTitleByTypeNews, getTitleByTypeResourse } from "@utils/indexing/getCategory";

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

  // The type strings below must match the `newsPageTabType` values saved in the
  // Payload CMS CatalogueTab blocks (typically the collection slug).
  const articleCategory = getTitleByTypeNews(cataloguesMapCategory, "articles") || "";
  const insightCategory = getCategoryName((insights[0] as any)?.parent);
  const storyCategory = getTitleByTypeNews(cataloguesMapCategory, "story-items") || "";
  const newsCategory = getTitleByTypeNews(cataloguesMapCategory, "news-items") || "";
  const webinarCategory = getTitleByTypeNews(cataloguesMapCategory, "webinar-items") || "";
  const resourseCategory = getTitleByTypeResourse(cataloguesMapCategory, "resources") || "";

  const allDocuments = [
    ...pages.map((item) => Mappers.getMapPages(item as any, lang)),
    ...newsItems.map((item) => Mappers.getMapNews(item as any, lang, newsCategory)),
    ...articles.map((item) =>
      Mappers.getMapArticle(item as any, lang, articleCategory),
    ),
    ...insights.map((item) =>
      Mappers.getMapInsight(item as any, lang, insightCategory),
    ),
    ...stories.map((item) => Mappers.getMapStory(item as any, lang, storyCategory)),
    ...webinars.map((item) =>
      Mappers.getMapWebinar(item as any, lang, webinarCategory),
    ),
    ...resourses
      .map((item) => Mappers.getMapResourse(item, lang, resourseCategory)),
  ].filter(Boolean);

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
