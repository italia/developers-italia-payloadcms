/**
 * Discriminates `story_item` records between "News" and "Platforms".
 *
 * The distinction is based on `articleClassification` (the StoryClass
 * taxonomy) — the only reliably populated field. Each story is classified as
 * either News or Platforms.
 *
 * The source model also exposes a `storyType` field ("news"/"platform"), but
 * as of the current data it's "news" on almost every record (platforms
 * included), so it isn't usable as a discriminant yet.
 *
 * Document ids differ between CMS environments (they are generated when the
 * database is seeded), so every known environment is listed here.
 */

// Payload `story-classes` document ids, per environment.
export const NEWS_STORY_CLASS_IDS: ReadonlySet<string> = new Set([
  "c1095e45-697c-43fa-b43d-96d362370bbc", // cms.developers.italia.it
  "c19133c2-04fe-46cc-b2c8-b5ef52bc9a55", // seed / cms-test
]);
export const PLATFORMS_STORY_CLASS_IDS: ReadonlySet<string> = new Set([
  "93fa0f22-0612-4c9e-8af1-29b077a6428e", // cms.developers.italia.it
  "ae159bcf-450a-428d-af9f-a701451166b3", // seed / cms-test
]);

/** True if the given class id (`articleClassification.id`) is the News class. */
export function isNewsStoryClass(
  articleClassificationId?: string | null,
): boolean {
  return (
    !!articleClassificationId &&
    NEWS_STORY_CLASS_IDS.has(articleClassificationId)
  );
}
