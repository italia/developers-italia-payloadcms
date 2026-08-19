import {
  PayloadCardLinkListFragment,
  PayloadFaqSectionFragment,
  PayloadHeroFragment,
  PayloadListCollectionFragment,
  PayloadStructuredTextBlockFragment,
  PayloadSupportChannelsSectionFragment,
  PayloadSupportCtaSectionFragment,
  PayloadTextAccordionFragment,
  PayloadTextImageFragment,
  PayloadTextOnlyFragment,
  PayloadTextStatisticFragment,
  PayloadTextUseCaseFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";
import {
  SearchCardLinkListFragment,
  SearchFaqSectionFragment,
  SearchHeroFragment,
  SearchListCollectionFragment,
  SearchStructuredTextBlockFragment,
  SearchSupportChannelsSectionFragment,
  SearchSupportCtaSectionFragment,
  SearchTextAccordionFragment,
  SearchTextImageFragment,
  SearchTextOnlyFragment,
  SearchTextStatisticFragment,
  SearchTextUseCaseFragment,
} from "@graphql/fragment/searchBlocks";

export const StoryPayloadFragment = graphql(
  `
  fragment StoryPayloadFragment on StoryItem @_unmask {
    id
    slug
    title
    localizedSlugs
    updatedAt
    createdAt
    dateOfPublication
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
      ... on FaqSection { ...PayloadFaqSectionFragment }
      ... on TextOnly { ...PayloadTextOnlyFragment }
      ... on StructuredTextBlock { ...PayloadStructuredTextBlockFragment }
      ... on TextImage { ...PayloadTextImageFragment }
      ... on SupportChannelsSection { ...PayloadSupportChannelsSectionFragment }
      ... on TextAccordion { ...PayloadTextAccordionFragment }
      ... on ListCollection { ...PayloadListCollectionFragment }
      ... on SupportCtaSection { ...PayloadSupportCtaSectionFragment }
      ... on TextUseCase { ...PayloadTextUseCaseFragment }
      ... on TextStatistic { ...PayloadTextStatisticFragment }
      ... on CardLinkList { ...PayloadCardLinkListFragment }
    }
  }
`,
  [
    PayloadHeroFragment,
    PayloadFaqSectionFragment,
    PayloadTextOnlyFragment,
    PayloadStructuredTextBlockFragment,
    PayloadTextImageFragment,
    PayloadSupportChannelsSectionFragment,
    PayloadTextAccordionFragment,
    PayloadListCollectionFragment,
    PayloadSupportCtaSectionFragment,
    PayloadTextUseCaseFragment,
    PayloadTextStatisticFragment,
    PayloadCardLinkListFragment,
  ],
);

export type StoryPayloadFragmentType = FragmentOf<typeof StoryPayloadFragment>;

// Uses the minimal text-only Search*Fragment set (searchBlocks.ts), not the full
// Payload*Fragment set — reusing those causes a GraphQL field-merge error, since
// `bg`/`variant` resolve to a distinct enum type per block (Hero_bg, TextOnly_bg, ...)
// even though they share the same values.
export const StoryIndexPayloadFragment = graphql(
  `
  fragment StoryIndexPayloadFragment on StoryItem @_unmask {
    id
    slug
    title
    paragraph
    localizedSlugs
    updatedAt
    content {
      ... on Hero { ...SearchHeroFragment }
      ... on FaqSection { ...SearchFaqSectionFragment }
      ... on TextOnly { ...SearchTextOnlyFragment }
      ... on StructuredTextBlock { ...SearchStructuredTextBlockFragment }
      ... on TextImage { ...SearchTextImageFragment }
      ... on SupportChannelsSection { ...SearchSupportChannelsSectionFragment }
      ... on TextAccordion { ...SearchTextAccordionFragment }
      ... on ListCollection { ...SearchListCollectionFragment }
      ... on SupportCtaSection { ...SearchSupportCtaSectionFragment }
      ... on TextUseCase { ...SearchTextUseCaseFragment }
      ... on TextStatistic { ...SearchTextStatisticFragment }
      ... on CardLinkList { ...SearchCardLinkListFragment }
    }
  }
`,
  [
    SearchHeroFragment,
    SearchFaqSectionFragment,
    SearchTextOnlyFragment,
    SearchStructuredTextBlockFragment,
    SearchTextImageFragment,
    SearchSupportChannelsSectionFragment,
    SearchTextAccordionFragment,
    SearchListCollectionFragment,
    SearchSupportCtaSectionFragment,
    SearchTextUseCaseFragment,
    SearchTextStatisticFragment,
    SearchCardLinkListFragment,
  ],
);

export type StoryIndexPayloadFragmentType = FragmentOf<typeof StoryIndexPayloadFragment>;
