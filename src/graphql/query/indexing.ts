import {
  ArticleIndexPayloadFragment,
  CatalogueIndexPayloadFragment,
  InsightIndexPayloadFragment,
  PageIndexPayloadFragment,
  StoryIndexPayloadFragment,
  WebinarIndexPayloadFragment,
} from "@graphql/fragment/indexing";
import { graphql } from "@graphql/graphql";

export const ArticlesIdxQuery = graphql(
  `
  query ArticlesIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    Articles(locale: $locale, limit: $limit, page: $page) {
      docs { ...ArticleIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [ArticleIndexPayloadFragment],
);

export const InsightsIdxQuery = graphql(
  `
  query InsightsIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    Insights(locale: $locale, limit: $limit, page: $page) {
      docs { ...InsightIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [InsightIndexPayloadFragment],
);

export const StoriesIdxQuery = graphql(
  `
  query StoriesIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    StoryItems(locale: $locale, limit: $limit, page: $page) {
      docs { ...StoryIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [StoryIndexPayloadFragment],
);

export const WebinarsIdxQuery = graphql(
  `
  query WebinarsIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    WebinarItems(locale: $locale, limit: $limit, page: $page) {
      docs { ...WebinarIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [WebinarIndexPayloadFragment],
);

export const CataloguesIdxQuery = graphql(
  `
  query CataloguesIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    Catalogues(locale: $locale, limit: $limit, page: $page) {
      docs { ...CatalogueIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [CatalogueIndexPayloadFragment],
);

export const PagesIdxQuery = graphql(
  `
  query PagesIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    Pages(locale: $locale, limit: $limit, page: $page) {
      docs { ...PageIndexPayloadFragment }
      hasNextPage
    }
  }
`,
  [PageIndexPayloadFragment],
);

// NewsItems have no localised slugs — index only metadata
export const NewsIdxQuery = graphql(`
  query NewsIdx($locale: LocaleInputType, $limit: Int, $page: Int) {
    NewsItems(locale: $locale, limit: $limit, page: $page) {
      docs { id updatedAt createdAt }
      hasNextPage
    }
  }
`);

// Resources are not locale-routed — index only metadata
export const ResourcesIdxQuery = graphql(`
  query ResourcesIdx($limit: Int, $page: Int) {
    Resources(limit: $limit, page: $page) {
      docs { id updatedAt createdAt }
      hasNextPage
    }
  }
`);
