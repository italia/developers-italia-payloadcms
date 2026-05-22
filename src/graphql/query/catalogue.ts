import { CataloguePayloadFragment } from "@graphql/fragment/catalogue";
import { graphql } from "@graphql/graphql";

export const CataloguesContentQuery = graphql(
  `
  query CataloguesContentQuery($locale: LocaleInputType, $limit: Int, $page: Int) {
    Catalogues(locale: $locale, limit: $limit, page: $page) {
      docs { ...CataloguePayloadFragment }
      hasNextPage
    }
  }
`,
  [CataloguePayloadFragment],
);

// Last-updated dates for catalogue feed badges (locale-independent, use first result)
export const LastItemsUpdateQuery = graphql(`
  query LastItemsUpdate($locale: LocaleInputType) {
    NewsItems(locale: $locale, limit: 1, sort: "-createdAt") {
      docs { createdAt }
    }
    StoryItems(locale: $locale, limit: 1, sort: "-createdAt") {
      docs { createdAt }
    }
    WebinarItems(locale: $locale, limit: 1, sort: "-createdAt") {
      docs { createdAt }
    }
    Resources(locale: $locale, limit: 1, sort: "-createdAt") {
      docs { createdAt }
    }
  }
`);
