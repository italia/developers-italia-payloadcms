/**
 * Which CMS documents become pages of the site.
 *
 * - A document with the "hideFromSite" checkbox set is not published.
 * - A story (`story-items`) without a classification (News / Platforms) is not
 *   published: the classification decides where the story lives on the site,
 *   and the previous site did not publish unclassified stories.
 *
 * A hidden document gets no page and no entry in the link map, so it also
 * disappears from lists, sitemap, search and feeds.
 */
export function isHiddenFromSite(doc: unknown): boolean {
  return (doc as { hideFromSite?: unknown } | null)?.hideFromSite === true;
}

export function isStoryPublished(doc: {
  articleClassification?: unknown;
  hideFromSite?: unknown;
}): boolean {
  return !isHiddenFromSite(doc) && !!doc.articleClassification;
}
