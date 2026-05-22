import {
  PayloadActionCardFragment,
  PayloadHeroFragment,
  PayloadSpeakerFragment,
  PayloadWebinarDescriptionFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";

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

export const WebinarIndexPayloadFragment = graphql(`
  fragment WebinarIndexPayloadFragment on WebinarItem @_unmask {
    id
    slug
    title
    paragraph
    date
    localizedSlugs
    updatedAt
  }
`);

export type WebinarIndexPayloadFragmentType = FragmentOf<typeof WebinarIndexPayloadFragment>;
