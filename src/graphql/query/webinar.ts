import { WebinarPayloadFragment } from "@graphql/fragment/webinar";
import { graphql } from "@graphql/graphql";

export const WebinarItemsContentQuery = graphql(
  `
  query WebinarItemsContentQuery($locale: LocaleInputType, $limit: Int, $page: Int) {
    WebinarItems(locale: $locale, limit: $limit, page: $page) {
      docs { ...WebinarPayloadFragment }
      hasNextPage
    }
  }
`,
  [WebinarPayloadFragment],
);
