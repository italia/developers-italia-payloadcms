import { WebinarItemFragment } from "@graphql/fragment/commonFragments";
import { WebinarPayloadFragment } from "@graphql/fragment/webinar";
import { graphql } from "@graphql/graphql";

// ─── DatoCMS card query (webinar_item collection) ─────────────────────────────

export const AllWebinarQuery = graphql(
  `
    query AllWebinars($dateLimit: DateTime) {
      allWebinarItems(
        first: 2500
        filter: { date: { gte: $dateLimit } }
      ) {
        ...WebinarItemFragment
      }
    }
  `,
  [WebinarItemFragment],
);

// ─── PayloadCMS content query ─────────────────────────────────────────────────

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
