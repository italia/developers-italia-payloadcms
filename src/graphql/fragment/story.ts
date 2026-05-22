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

export const StoryIndexPayloadFragment = graphql(`
  fragment StoryIndexPayloadFragment on StoryItem @_unmask {
    id
    slug
    title
    localizedSlugs
    updatedAt
  }
`);

export type StoryIndexPayloadFragmentType = FragmentOf<typeof StoryIndexPayloadFragment>;
