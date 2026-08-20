import type { SiteLocale } from "@graphql/types";

/**
 * CMS-configurable sort modes for the "Catalogue tab" block (field `sortMode`).
 */
export type FeedSortMode =
  | "date_desc"
  | "date_asc"
  | "title_asc"
  | "title_desc"
  | "updated_desc";

/** Fallback used when the CMS field is empty or unrecognized. */
const DEFAULT_SORT_MODE: FeedSortMode = "date_desc";

type Sortable = {
  title?: string | null;
  dateTime?: string | null;
};

function resolveSortMode(sortMode: string | null | undefined): FeedSortMode {
  switch (sortMode) {
    case "date_desc":
    case "date_asc":
    case "title_asc":
    case "title_desc":
    case "updated_desc":
      return sortMode;
    // Content created before the field existed has an empty sortMode: fall
    // back to the chronological default.
    default:
      return DEFAULT_SORT_MODE;
  }
}

/**
 * Sorts feed items (platforms, news, etc.) according to the CMS-selected
 * mode. `updated_desc` keeps the order the items arrived in (already sorted
 * by the loader); the other modes reorder by publication date or localized
 * title.
 */
export function sortFeedItems<T extends Sortable>(
  items: T[],
  sortMode: string | null | undefined,
  lang: SiteLocale,
): T[] {
  const mode = resolveSortMode(sortMode);

  if (mode === "updated_desc") return items;

  const sorted = [...items];

  if (mode === "title_asc" || mode === "title_desc") {
    const direction = mode === "title_asc" ? 1 : -1;
    sorted.sort(
      (a, b) =>
        direction *
        (a.title ?? "").localeCompare(b.title ?? "", lang, {
          sensitivity: "base",
        }),
    );
    return sorted;
  }

  // date_asc | date_desc
  sorted.sort((a, b) => {
    const timeA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
    const timeB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
    const ascending = timeA - timeB;
    return mode === "date_desc" ? -ascending : ascending;
  });
  return sorted;
}
