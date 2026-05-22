import { StoryPayloadFragment } from "@graphql/fragment/story";
import { graphql } from "@graphql/graphql";

export const StoryItemsContentQuery = graphql(
  `
  query StoryItemsContentQuery($locale: LocaleInputType, $limit: Int, $page: Int) {
    StoryItems(locale: $locale, limit: $limit, page: $page) {
      docs { ...StoryPayloadFragment }
      hasNextPage
    }
  }
`,
  [StoryPayloadFragment],
);
