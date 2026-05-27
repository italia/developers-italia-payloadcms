import type { CatalogueIndexPayloadFragmentType } from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";

// ─── Internal types ───────────────────────────────────────────────────────────

type TabType = { type: string; title: string };

/** Entry in the catalogue map: one entry per locale-resolved catalogue. */
type CatalogueMapCategory = { type: TabType[]; title?: string };

// ─── getCategoryName ──────────────────────────────────────────────────────────
// Accepts the Payload `parent` relationship (already locale-resolved — plain string title).
// Previously received a DatoCMS `parentPage` with `allTitleLocales`.

export const getCategoryName = (
  parent: { title?: string | null } | null | undefined,
): string => parent?.title ?? "";

// ─── getTitleByTypeNews ───────────────────────────────────────────────────────
// Returns "${catalogueTitle}, ${tabTitle}" for the catalogue whose CatalogueFeed
// tab has `newsPageTabType === searchType`.

export const getTitleByTypeNews = (
  catalogues: CatalogueMapCategory[],
  searchType: string,
): string | undefined => {
  const match = catalogues.find((item) =>
    item.type.some((t) => t.type === searchType),
  );
  if (!match) return undefined;
  const tab = match.type.find((t) => t.type === searchType);
  return `${match.title}, ${tab?.title}`;
};

// ─── getTitleByTypeResourse ───────────────────────────────────────────────────
// Returns just the catalogue title (no tab sub-title) for resource entries.

export const getTitleByTypeResourse = (
  catalogues: CatalogueMapCategory[],
  searchType: string,
): string | undefined => {
  const match = catalogues.find((item) =>
    item.type.some((t) => t.type === searchType),
  );
  return match?.title;
};

// ─── getCataloguesMapCategory ─────────────────────────────────────────────────
// Builds the catalogue → tab-type map from Payload catalogue index documents.
//
// Key differences from the old DatoCMS version:
//  • `catalogue.title` is already a locale-resolved string (Payload fetches per locale
//    and the loader tags each doc with `locale`). We filter by `lang` rather than
//    reading from `allTitleLocales`.
//  • CatalogueFeed blocks in the raw GraphQL response carry a `tabs` array instead
//    of a `componentName` field — we detect them by checking for that key.
//  • `newsPageTabType` values must match whatever strings are saved in the Payload
//    CMS `CatalogueTab.newsPageTabType` field (typically the Payload collection slug,
//    e.g. "articles", "story-items", "webinar-items", "resources").

export const getCataloguesMapCategory = (
  allCatalogues: Array<CatalogueIndexPayloadFragmentType & { locale?: string }>,
  lang: SiteLocale,
): CatalogueMapCategory[] => {
  return allCatalogues
    // Each catalogue appears once per locale in the index; keep only the requested one.
    .filter((c) => !c.locale || c.locale === lang)
    .map((catalogue) => {
      const title = catalogue.title ?? "";

      // `content` now includes `... on CatalogueFeed { tabs { ... } }` from the fragment.
      // Non-CatalogueFeed blocks are selected with no sub-fields → empty objects.
      // CatalogueFeed is the only block type that exposes a `tabs` array.
      const feedBlock = ((catalogue as any).content ?? []).find(
        (item: unknown) =>
          item != null &&
          typeof item === "object" &&
          "tabs" in (item as object),
      ) as { tabs?: Array<{ title?: string; newsPageTabType?: string }> } | undefined;

      const tabTypes: TabType[] =
        feedBlock?.tabs?.map((tab) => ({
          type: tab.newsPageTabType ?? "",
          title: tab.title ?? "",
        })) ?? [];

      return { type: tabTypes, title };
    });
};
