import {
  PayloadActionCardFragment,
  PayloadHeroFragment,
  PayloadSpeakerFragment,
  PayloadWebinarDescriptionFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";
import {
  SearchActionCardFragment,
  SearchHeroFragment,
  SearchSpeakerFragment,
  SearchWebinarDescriptionFragment,
} from "@graphql/fragment/searchBlocks";

export const WebinarPayloadFragment = graphql(
  `
  fragment WebinarPayloadFragment on WebinarItem @_unmask {
    id
    slug
    title
    paragraph
    date
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
      ... on ActionCard { ...PayloadActionCardFragment }
      ... on Speaker { ...PayloadSpeakerFragment }
      ... on WebinarDescription { ...PayloadWebinarDescriptionFragment }
    }
  }
`,
  [
    PayloadHeroFragment,
    PayloadActionCardFragment,
    PayloadSpeakerFragment,
    PayloadWebinarDescriptionFragment,
  ],
);

export type WebinarPayloadFragmentType = FragmentOf<typeof WebinarPayloadFragment>;

// Uses the minimal text-only Search*Fragment set (searchBlocks.ts), not the full
// Payload*Fragment set — reusing those causes a GraphQL field-merge error, since
// `bg`/`variant` resolve to a distinct enum type per block (Hero_bg, ActionCard_bg, ...)
// even though they share the same values.
export const WebinarIndexPayloadFragment = graphql(
  `
  fragment WebinarIndexPayloadFragment on WebinarItem @_unmask {
    id
    slug
    title
    paragraph
    date
    localizedSlugs
    updatedAt
    content {
      ... on Hero { ...SearchHeroFragment }
      ... on ActionCard { ...SearchActionCardFragment }
      ... on Speaker { ...SearchSpeakerFragment }
      ... on WebinarDescription { ...SearchWebinarDescriptionFragment }
    }
  }
`,
  [
    SearchHeroFragment,
    SearchActionCardFragment,
    SearchSpeakerFragment,
    SearchWebinarDescriptionFragment,
  ],
);

export type WebinarIndexPayloadFragmentType = FragmentOf<typeof WebinarIndexPayloadFragment>;
