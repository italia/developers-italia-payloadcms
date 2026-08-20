/**
 * Discriminates `story_item` records between "News" and "Platforms".
 *
 * The distinction is based on `articleClassification` (the StoryClass
 * taxonomy) — the only reliably populated field. Each story is classified as
 * either News or Platforms.
 *
 * The source model also exposes a `storyType` field ("news"/"platform"), but
 * as of the current data it's "news" on every record (platforms included),
 * so it isn't usable as a discriminant yet. Once that's cleaned up in the
 * CMS, `isNewsStoryClass` can switch to reading `storyType` instead of the
 * class id.
 */

// Payload `story-classes` document ids.
export const NEWS_STORY_CLASS_ID = "c19133c2-04fe-46cc-b2c8-b5ef52bc9a55";
export const PLATFORMS_STORY_CLASS_ID = "ae159bcf-450a-428d-af9f-a701451166b3";

/** True if the given class id (`articleClassification.id`) is the News class. */
export function isNewsStoryClass(
  articleClassificationId?: string | null,
): boolean {
  return articleClassificationId === NEWS_STORY_CLASS_ID;
}
