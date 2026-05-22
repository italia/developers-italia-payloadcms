import { StoryCardFragment } from "@graphql/fragment/commonFragments";
import { StoryPayloadFragment } from "@graphql/fragment/story";
import { graphql } from "@graphql/graphql";

// ─── DatoCMS card queries (story_item and webinar_item collections) ──────────

export const AllStoryCardQuery = graphql(
  `
    query AllStoryCards {
      allStoryItems(first: 2500) {
        ...StoryCardFragment
      }
    }
  `,
  [StoryCardFragment],
);

// ─── PayloadCMS content query ─────────────────────────────────────────────────

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
