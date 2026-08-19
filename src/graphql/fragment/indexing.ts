import { ArticleIndexPayloadFragment } from "@graphql/fragment/article";
import { CatalogueIndexPayloadFragment } from "@graphql/fragment/catalogue";
import { InsightIndexPayloadFragment } from "@graphql/fragment/insight";
import { StoryIndexPayloadFragment } from "@graphql/fragment/story";
import { WebinarIndexPayloadFragment } from "@graphql/fragment/webinar";
import { graphql, type FragmentOf } from "@graphql/graphql";
import {
  SearchCardLinkListFragment,
  SearchDataSectionFragment,
  SearchFaqSectionFragment,
  SearchHeroFragment,
  SearchNewsFeedFragment,
  SearchStructuredTextBlockFragment,
  SearchSupportChannelsSectionFragment,
  SearchSupportCtaSectionFragment,
  SearchTextAccordionFragment,
  SearchTextImageFragment,
  SearchTextOnlyFragment,
  SearchTextStatisticFragment,
  SearchTopicFilterFragment,
} from "@graphql/fragment/searchBlocks";

// Re-export collection index fragments so query/indexing.ts has a single import.
export {
  ArticleIndexPayloadFragment,
  CatalogueIndexPayloadFragment,
  InsightIndexPayloadFragment,
  StoryIndexPayloadFragment,
  WebinarIndexPayloadFragment,
};

export type ArticleIndexPayloadFragmentType = FragmentOf<typeof ArticleIndexPayloadFragment>;
export type CatalogueIndexPayloadFragmentType = FragmentOf<typeof CatalogueIndexPayloadFragment>;
export type InsightIndexPayloadFragmentType = FragmentOf<typeof InsightIndexPayloadFragment>;
export type StoryIndexPayloadFragmentType = FragmentOf<typeof StoryIndexPayloadFragment>;
export type WebinarIndexPayloadFragmentType = FragmentOf<typeof WebinarIndexPayloadFragment>;

// ─── News ────────────────────────────────────────────────────────────────────
// NewsItem has no localizedSlugs — it is an external/linked item, not a routed
// page. We only index title + link for search purposes.

export const NewsIndexPayloadFragment = graphql(`
  fragment NewsIndexPayloadFragment on NewsItem @_unmask {
    id
    updatedAt
    createdAt
  }
`);
export type NewsIndexPayloadFragmentType = FragmentOf<typeof NewsIndexPayloadFragment>;

// ─── Page ─────────────────────────────────────────────────────────────────────
// Uses the minimal text-only Search*Fragment set (searchBlocks.ts), not the full
// Payload*Fragment set — reusing those causes a GraphQL field-merge error, since
// `bg`/`variant` resolve to a distinct enum type per block (Hero_bg, TextOnly_bg, ...)
// even though they share the same values.

export const PageIndexPayloadFragment = graphql(
  `
  fragment PageIndexPayloadFragment on Page @_unmask {
    id
    slug
    title
    localizedSlugs
    updatedAt
    content {
      ... on Hero { ...SearchHeroFragment }
      ... on TextOnly { ...SearchTextOnlyFragment }
      ... on TextImage { ...SearchTextImageFragment }
      ... on StructuredTextBlock { ...SearchStructuredTextBlockFragment }
      ... on FaqSection { ...SearchFaqSectionFragment }
      ... on DataSection { ...SearchDataSectionFragment }
      ... on NewsFeed { ...SearchNewsFeedFragment }
      ... on SupportChannelsSection { ...SearchSupportChannelsSectionFragment }
      ... on TextAccordion { ...SearchTextAccordionFragment }
      ... on SupportCtaSection { ...SearchSupportCtaSectionFragment }
      ... on TextStatistic { ...SearchTextStatisticFragment }
      ... on TopicFilter { ...SearchTopicFilterFragment }
      ... on CardLinkList { ...SearchCardLinkListFragment }
    }
  }
`,
  [
    SearchHeroFragment,
    SearchTextOnlyFragment,
    SearchTextImageFragment,
    SearchStructuredTextBlockFragment,
    SearchFaqSectionFragment,
    SearchDataSectionFragment,
    SearchNewsFeedFragment,
    SearchSupportChannelsSectionFragment,
    SearchTextAccordionFragment,
    SearchSupportCtaSectionFragment,
    SearchTextStatisticFragment,
    SearchTopicFilterFragment,
    SearchCardLinkListFragment,
  ],
);
export type PageIndexPayloadFragmentType = FragmentOf<typeof PageIndexPayloadFragment>;
