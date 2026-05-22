import { graphql, type FragmentOf } from "@graphql/graphql";

// Payload routing uses localizedSlugs: JSON to know which locales a document
// exists in, plus parent.id for path building via linkResolver / linkMap.json.

export const ArticleSlugPayloadFragment = graphql(`
  fragment ArticleSlugPayloadFragment on Article @_unmask {
    id
    slug
    localizedSlugs
    parent { id slug localizedSlugs }
  }
`);
export type ArticleSlugPayloadFragmentType = FragmentOf<typeof ArticleSlugPayloadFragment>;

export const PageSlugPayloadFragment = graphql(`
  fragment PageSlugPayloadFragment on Page @_unmask {
    id
    slug
    localizedSlugs
  }
`);
export type PageSlugPayloadFragmentType = FragmentOf<typeof PageSlugPayloadFragment>;

export const InsightSlugPayloadFragment = graphql(`
  fragment InsightSlugPayloadFragment on Insight @_unmask {
    id
    slug
    localizedSlugs
    parent { id slug localizedSlugs }
  }
`);
export type InsightSlugPayloadFragmentType = FragmentOf<typeof InsightSlugPayloadFragment>;

export const StoryItemSlugPayloadFragment = graphql(`
  fragment StoryItemSlugPayloadFragment on StoryItem @_unmask {
    id
    slug
    localizedSlugs
    parent { id slug localizedSlugs }
  }
`);
export type StoryItemSlugPayloadFragmentType = FragmentOf<typeof StoryItemSlugPayloadFragment>;

export const WebinarItemSlugPayloadFragment = graphql(`
  fragment WebinarItemSlugPayloadFragment on WebinarItem @_unmask {
    id
    slug
    localizedSlugs
    parent { id slug localizedSlugs }
  }
`);
export type WebinarItemSlugPayloadFragmentType = FragmentOf<typeof WebinarItemSlugPayloadFragment>;

export const CatalogueSlugPayloadFragment = graphql(`
  fragment CatalogueSlugPayloadFragment on Catalogue @_unmask {
    id
    slug
    localizedSlugs
    parent { id slug localizedSlugs }
  }
`);
export type CatalogueSlugPayloadFragmentType = FragmentOf<typeof CatalogueSlugPayloadFragment>;
