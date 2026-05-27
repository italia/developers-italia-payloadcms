import {
  PayloadCalloutLinkFragment,
  PayloadCatalogueFeedFragment,
  PayloadHeroFragment,
  PayloadTextOnlyFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const CataloguePayloadFragment = graphql(
  `
  fragment CataloguePayloadFragment on Catalogue @_unmask {
    id
    slug
    title
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
      ... on CalloutLink { ...PayloadCalloutLinkFragment }
      ... on CatalogueFeed { ...PayloadCatalogueFeedFragment }
    }
  }
`,
  [
    PayloadHeroFragment,
    PayloadTextOnlyFragment,
    PayloadCalloutLinkFragment,
    PayloadCatalogueFeedFragment,
  ],
);

export type CataloguePayloadFragmentType = FragmentOf<typeof CataloguePayloadFragment>;

export const CatalogueIndexPayloadFragment = graphql(`
  fragment CatalogueIndexPayloadFragment on Catalogue @_unmask {
    id
    slug
    title
    localizedSlugs
    updatedAt
    content {
      ... on CatalogueFeed {
        tabs {
          ... on CatalogueTab {
            title
            newsPageTabType
          }
        }
      }
    }
  }
`);

export type CatalogueIndexPayloadFragmentType = FragmentOf<typeof CatalogueIndexPayloadFragment>;
