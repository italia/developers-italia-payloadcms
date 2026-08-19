import {
  PayloadCardLinkListFragment,
  PayloadHeroFragment,
  PayloadNewsFeedFragment,
  PayloadSupportChannelsSectionFragment,
  PayloadTextImageFragment,
  PayloadTextOnlyFragment,
  PayloadTextStatisticFragment,
  PayloadTextUseCaseFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";
import {
  SearchCardLinkListFragment,
  SearchHeroFragment,
  SearchNewsFeedFragment,
  SearchSupportChannelsSectionFragment,
  SearchTextImageFragment,
  SearchTextOnlyFragment,
  SearchTextStatisticFragment,
  SearchTextUseCaseFragment,
} from "@graphql/fragment/searchBlocks";

export const InsightPayloadFragment = graphql(
  `
  fragment InsightPayloadFragment on Insight @_unmask {
    id
    slug
    title
    abstract
    localizedSlugs
    updatedAt
    createdAt
    parent {
      id
      slug
      localizedSlugs
    }
    seo {
      title
      description
    }
    content {
      ... on Hero { ...PayloadHeroFragment }
      ... on TextOnly { ...PayloadTextOnlyFragment }
      ... on TextImage { ...PayloadTextImageFragment }
      ... on NewsFeed { ...PayloadNewsFeedFragment }
      ... on SupportChannelsSection { ...PayloadSupportChannelsSectionFragment }
      ... on TextUseCase { ...PayloadTextUseCaseFragment }
      ... on TextStatistic { ...PayloadTextStatisticFragment }
      ... on CardLinkList { ...PayloadCardLinkListFragment }
    }
  }
`,
  [
    PayloadHeroFragment,
    PayloadTextOnlyFragment,
    PayloadTextImageFragment,
    PayloadNewsFeedFragment,
    PayloadSupportChannelsSectionFragment,
    PayloadTextUseCaseFragment,
    PayloadTextStatisticFragment,
    PayloadCardLinkListFragment,
  ],
);

export type InsightPayloadFragmentType = FragmentOf<typeof InsightPayloadFragment>;

// Uses the minimal text-only Search*Fragment set (searchBlocks.ts), not the full
// Payload*Fragment set — reusing those causes a GraphQL field-merge error, since
// `bg`/`variant` resolve to a distinct enum type per block (Hero_bg, TextOnly_bg, ...)
// even though they share the same values.
export const InsightIndexPayloadFragment = graphql(
  `
  fragment InsightIndexPayloadFragment on Insight @_unmask {
    id
    slug
    title
    abstract
    localizedSlugs
    updatedAt
    parent {
      id
      title
    }
    content {
      ... on Hero { ...SearchHeroFragment }
      ... on TextOnly { ...SearchTextOnlyFragment }
      ... on TextImage { ...SearchTextImageFragment }
      ... on NewsFeed { ...SearchNewsFeedFragment }
      ... on SupportChannelsSection { ...SearchSupportChannelsSectionFragment }
      ... on TextUseCase { ...SearchTextUseCaseFragment }
      ... on TextStatistic { ...SearchTextStatisticFragment }
      ... on CardLinkList { ...SearchCardLinkListFragment }
    }
  }
`,
  [
    SearchHeroFragment,
    SearchTextOnlyFragment,
    SearchTextImageFragment,
    SearchNewsFeedFragment,
    SearchSupportChannelsSectionFragment,
    SearchTextUseCaseFragment,
    SearchTextStatisticFragment,
    SearchCardLinkListFragment,
  ],
);

export type InsightIndexPayloadFragmentType = FragmentOf<typeof InsightIndexPayloadFragment>;
