import { InsightPayloadFragment } from "@graphql/fragment/insight";
import { graphql } from "@graphql/graphql";

export const InsightsContentQuery = graphql(
  `
  query InsightsContentQuery($locale: LocaleInputType, $limit: Int, $page: Int) {
    Insights(locale: $locale, limit: $limit, page: $page) {
      docs { ...InsightPayloadFragment }
      hasNextPage
    }
  }
`,
  [InsightPayloadFragment],
);
