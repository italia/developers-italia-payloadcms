import {
  PayloadStructuredTextBlockFragment,
  PayloadSupportCtaSectionFragment,
} from "@graphql/fragment/payloadBlocks";
import { graphql, type FragmentOf } from "@graphql/graphql";
import {
  SearchStructuredTextBlockFragment,
  SearchSupportCtaSectionFragment,
} from "@graphql/fragment/searchBlocks";

// Article.content is a blocks array (structured-text-block / support-cta-section),
// same as Insight/StoryItem's content — needs a per-block-type sub-selection.
export const ArticlePayloadFragment = graphql(
  `
  fragment ArticlePayloadFragment on Article @_unmask {
    id
    slug
    title
    paragraph
    content {
      ... on StructuredTextBlock { ...PayloadStructuredTextBlockFragment }
      ... on SupportCtaSection { ...PayloadSupportCtaSectionFragment }
    }
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
  }
`,
  [PayloadStructuredTextBlockFragment, PayloadSupportCtaSectionFragment],
);

export type ArticlePayloadFragmentType = FragmentOf<typeof ArticlePayloadFragment>;

// ─── Indexing fragment (minimal fields for search index) ─────────────────────

export const ArticleIndexPayloadFragment = graphql(
  `
  fragment ArticleIndexPayloadFragment on Article @_unmask {
    id
    slug
    title
    paragraph
    content {
      ... on StructuredTextBlock { ...SearchStructuredTextBlockFragment }
      ... on SupportCtaSection { ...SearchSupportCtaSectionFragment }
    }
    localizedSlugs
    updatedAt
    lastPublishedAt
  }
`,
  [SearchStructuredTextBlockFragment, SearchSupportCtaSectionFragment],
);

export type ArticleIndexPayloadFragmentType = FragmentOf<typeof ArticleIndexPayloadFragment>;
