import type {
  ArticleIndexPayloadFragmentType,
  InsightIndexPayloadFragmentType,
  NewsIndexPayloadFragmentType,
  PageIndexPayloadFragmentType,
  StoryIndexPayloadFragmentType,
  WebinarIndexPayloadFragmentType,
} from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
import { flattenBlocks } from "@utils/indexing/blockContentMappers";
import { lexicalToPlainText } from "@utils/lexicalUtils";
import { linkResolver } from "@utils/linkResolver";

// PayloadCMS docs are already locale-resolved (fetched with ?locale=xx).
// Each doc carries a `locale` tag added by allDocumentsLoader.
type WithLocale<T> = T & { locale: string };

// ─── Articles ────────────────────────────────────────────────────────────────

export const getMapArticle = (
  article: WithLocale<ArticleIndexPayloadFragmentType>,
  lang: SiteLocale,
  category: string,
) => {
  if (article.locale !== lang) return null;

  return {
    type: "article",
    id: article.id,
    category,
    internalLink: linkResolver(`articles:${article.id}`, lang),
    title: article.title ?? "",
    description: lexicalToPlainText(article.paragraph) ?? "",
    // gql.tada's local schema.graphql snapshot hasn't been regenerated since Article.content
    // became a blocks field in Payload, so it's still typed as a bare scalar here.
    content: flattenBlocks(article.content as unknown[]),
  };
};

// ─── Insights ────────────────────────────────────────────────────────────────

export const getMapInsight = (
  insight: WithLocale<InsightIndexPayloadFragmentType>,
  lang: SiteLocale,
  category: string,
) => {
  if (insight.locale !== lang) return null;

  return {
    type: "insight",
    id: insight.id,
    category,
    internalLink: linkResolver(`insights:${insight.id}`, lang),
    title: insight.title ?? "",
    description: lexicalToPlainText(insight.abstract) ?? "",
    content: flattenBlocks(insight.content),
  };
};

// ─── Stories ─────────────────────────────────────────────────────────────────

export const getMapStory = (
  story: WithLocale<StoryIndexPayloadFragmentType>,
  lang: SiteLocale,
  category: string,
) => {
  if (story.locale !== lang) return null;

  return {
    type: "story",
    id: story.id,
    category,
    internalLink: linkResolver(`story-items:${story.id}`, lang),
    title: story.title ?? "",
    description: lexicalToPlainText(story.paragraph) ?? "",
    content: flattenBlocks(story.content),
  };
};

// ─── Webinars ─────────────────────────────────────────────────────────────────

export const getMapWebinar = (
  webinar: WithLocale<WebinarIndexPayloadFragmentType>,
  lang: SiteLocale,
  category: string,
) => {
  if (webinar.locale !== lang) return null;

  return {
    type: "webinar",
    id: webinar.id,
    category,
    internalLink: linkResolver(`webinar-items:${webinar.id}`, lang),
    title: webinar.title ?? "",
    description: lexicalToPlainText(webinar.paragraph) ?? "",
    content: flattenBlocks(webinar.content),
  };
};

// ─── News ─────────────────────────────────────────────────────────────────────
// NewsItems are links to external articles: they are indexed with their title
// and abstract and point to the external address. Entries without a title in
// this locale are not translated and are skipped.

export const getMapNews = (
  news: WithLocale<{
    id: string | number;
    title?: string | null;
    link?: string | null;
    paragraph?: unknown;
  }>,
  lang: SiteLocale,
  category: string,
) => {
  if (news.locale !== lang || !news.title || !news.link) return null;
  const description = lexicalToPlainText(news.paragraph) ?? "";

  return {
    type: "news",
    id: news.id,
    category,
    externalLink: news.link,
    title: news.title,
    description,
    content: description,
  };
};

// ─── Resources ────────────────────────────────────────────────────────────────
// Resources are not locale-routed — index is locale-independent; skip nulls.

export const getMapResourse = (
  resourse: any,
  _lang: SiteLocale,
  _category: string,
) => {
  // Resource index only has id + timestamps from PayloadCMS.
  // Full resource data is available through the `resource` collection (DatoCMS).
  return null;
};

// ─── Pages ────────────────────────────────────────────────────────────────────

export const getMapPages = (
  page: WithLocale<PageIndexPayloadFragmentType>,
  lang: SiteLocale,
) => {
  if (page.locale !== lang) return null;

  return {
    type: "page",
    id: page.id,
    category: "",
    internalLink: linkResolver(`pages:${page.id}`, lang),
    title: page.title ?? "",
    description: "",
    content: flattenBlocks(page.content),
  };
};
