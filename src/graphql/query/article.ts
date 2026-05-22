import { ArticlePayloadFragment } from "@graphql/fragment/article";
import { graphql } from "@graphql/graphql";

export const ArticlesContentQuery = graphql(
  `
  query ArticlesContentQuery($locale: LocaleInputType, $limit: Int, $page: Int) {
    Articles(locale: $locale, limit: $limit, page: $page) {
      docs { ...ArticlePayloadFragment }
      hasNextPage
    }
  }
`,
  [ArticlePayloadFragment],
);
