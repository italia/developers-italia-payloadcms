import rss from "@astrojs/rss";
import type { ArticleIndexPayloadFragmentType } from "@graphql/fragment/article";
import type { SiteLocale } from "@graphql/types";
import { lexicalToHtml, lexicalToPlainText } from "@utils/lexicalUtils";
import { linkResolver } from "@utils/linkResolver";
import type { APIRoute } from "astro";
import { getEntry } from "astro:content";

const FEED_TITLE = "Developers Italia news feed";
const FEED_DESCRIPTION: Record<SiteLocale, string> = {
  it: "Ultimi articoli e notizie pubblicati su Developers Italia.",
  en: "Latest articles and news published on Developers Italia.",
};
const MAX_ITEMS = 50;

// allDocumentsLoader tags each doc with its locale — not part of the base fragment type.
type LocalizedArticle = ArticleIndexPayloadFragmentType & { locale: string };

// Date of the item: the editorial publication date shown on the page
// ("last update"), not the technical date of the last save.
const publishedAt = (article: LocalizedArticle) =>
  new Date(
    (article as { lastPublishedAt?: string | null }).lastPublishedAt ??
      article.updatedAt ??
      0,
  );

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

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as SiteLocale;

  if (!lang) {
    return new Response("Language parameter is missing", { status: 400 });
  }

  const responseCollection = await getEntry("documents", "all-documents");
  const articles = responseCollection?.data.allArticles as LocalizedArticle[] | undefined;

  if (!articles) {
    return new Response("No articles to feed", { status: 400 });
  }

  const localizedArticles = articles
    .filter((article) => article.locale === lang)
    .sort((a, b) => publishedAt(b).getTime() - publishedAt(a).getTime())
    .slice(0, MAX_ITEMS);

  const items = localizedArticles.map((article) => ({
    title: article.title ?? "",
    description: lexicalToPlainText(article.paragraph) ?? "",
    link: linkResolver(`articles:${article.id}`, lang),
    pubDate: publishedAt(article),
    content: (article.content ?? [])
      .map((block) =>
        "structuredTextContent" in block ? lexicalToHtml(block.structuredTextContent) : "",
      )
      .join(""),
  }));

  return rss({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION[lang],
    site: site!,
    items,
    customData: `<language>${lang}</language>`,
  });
};
