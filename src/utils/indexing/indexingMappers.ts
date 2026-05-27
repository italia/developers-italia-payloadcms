import type {
  ArticleIndexPayloadFragmentType,
  InsightIndexPayloadFragmentType,
  NewsIndexPayloadFragmentType,
  PageIndexPayloadFragmentType,
  StoryIndexPayloadFragmentType,
  WebinarIndexPayloadFragmentType,
} from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
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
    description: (article as any).paragraph ?? "",
    content: (article as any).paragraph ?? "",
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
    description: (insight as any).abstract ?? "",
    content: (insight as any).abstract ?? "",
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
    description: "",
    content: "",
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
    title: (webinar as any).title ?? "",
    description: (webinar as any).paragraph ?? "",
    content: (webinar as any).paragraph ?? "",
  };
};

// ─── News ─────────────────────────────────────────────────────────────────────
// NewsItems are external links — only id/dates are indexed from PayloadCMS.
// Skip entries with no title to avoid polluting the search index.

export const getMapNews = (
  news: WithLocale<NewsIndexPayloadFragmentType>,
  lang: SiteLocale,
  _category: string,
) => {
  if (news.locale !== lang) return null;
  // NewsIndexPayloadFragment only exposes id + timestamps — no title/link available.
  return null;
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
    content: "",
  };
};
