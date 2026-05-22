import { graphql, type FragmentOf } from "@graphql/graphql";

// Article.content is a JSON scalar (Lexical rich text) — no sub-selection needed.
export const ArticlePayloadFragment = graphql(`
  fragment ArticlePayloadFragment on Article @_unmask {
    id
    slug
    title
    paragraph
    content
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
`);

export type ArticlePayloadFragmentType = FragmentOf<typeof ArticlePayloadFragment>;

// ─── Indexing fragment (minimal fields for search index) ─────────────────────

export const ArticleIndexPayloadFragment = graphql(`
  fragment ArticleIndexPayloadFragment on Article @_unmask {
    id
    slug
    title
    paragraph
    content
    localizedSlugs
    updatedAt
  }
`);

export type ArticleIndexPayloadFragmentType = FragmentOf<typeof ArticleIndexPayloadFragment>;
