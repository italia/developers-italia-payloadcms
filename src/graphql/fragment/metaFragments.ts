import { graphql, type FragmentOf } from "@graphql/graphql";

// Payload collections expose localizedSlugs: JSON (e.g. { it: "slug-it", en: "slug-en" })
// instead of DatoCMS _allSlugLocales arrays. These fragments request the fields
// needed to resolve paths and hreflang links for each collection.

export const PageLocalizedSlugsFragment = graphql(`
  fragment PageLocalizedSlugsFragment on Page @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type PageLocalizedSlugsFragmentType = FragmentOf<typeof PageLocalizedSlugsFragment>;

export const ArticleLocalizedSlugsFragment = graphql(`
  fragment ArticleLocalizedSlugsFragment on Article @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type ArticleLocalizedSlugsFragmentType = FragmentOf<typeof ArticleLocalizedSlugsFragment>;

export const InsightLocalizedSlugsFragment = graphql(`
  fragment InsightLocalizedSlugsFragment on Insight @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type InsightLocalizedSlugsFragmentType = FragmentOf<typeof InsightLocalizedSlugsFragment>;

export const StoryItemLocalizedSlugsFragment = graphql(`
  fragment StoryItemLocalizedSlugsFragment on StoryItem @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type StoryItemLocalizedSlugsFragmentType = FragmentOf<typeof StoryItemLocalizedSlugsFragment>;

export const WebinarItemLocalizedSlugsFragment = graphql(`
  fragment WebinarItemLocalizedSlugsFragment on WebinarItem @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type WebinarItemLocalizedSlugsFragmentType = FragmentOf<typeof WebinarItemLocalizedSlugsFragment>;

export const CatalogueLocalizedSlugsFragment = graphql(`
  fragment CatalogueLocalizedSlugsFragment on Catalogue @_unmask {
    id
    slug
    title
    localizedSlugs
  }
`);
export type CatalogueLocalizedSlugsFragmentType = FragmentOf<typeof CatalogueLocalizedSlugsFragment>;
