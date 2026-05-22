import { ArticleIndexPayloadFragment } from "@graphql/fragment/article";
import { CatalogueIndexPayloadFragment } from "@graphql/fragment/catalogue";
import { InsightIndexPayloadFragment } from "@graphql/fragment/insight";
import { StoryIndexPayloadFragment } from "@graphql/fragment/story";
import { WebinarIndexPayloadFragment } from "@graphql/fragment/webinar";
import { graphql, type FragmentOf } from "@graphql/graphql";

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

export const PageIndexPayloadFragment = graphql(`
  fragment PageIndexPayloadFragment on Page @_unmask {
    id
    slug
    title
    localizedSlugs
    updatedAt
  }
`);
export type PageIndexPayloadFragmentType = FragmentOf<typeof PageIndexPayloadFragment>;
