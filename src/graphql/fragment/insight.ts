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

export const InsightIndexPayloadFragment = graphql(`
  fragment InsightIndexPayloadFragment on Insight @_unmask {
    id
    slug
    title
    abstract
    localizedSlugs
    updatedAt
  }
`);

export type InsightIndexPayloadFragmentType = FragmentOf<typeof InsightIndexPayloadFragment>;
