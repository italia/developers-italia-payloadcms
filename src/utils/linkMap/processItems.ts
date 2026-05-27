import type { CatalogueIndexPayloadFragmentType } from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
import { getLocaleValue } from "@utils/getLocaleValue";
import { getCataloguesMapCategory } from "@utils/indexing/getCategory";
import { resolveRoutePath, type RoutableRecord } from "@utils/pathHelper";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type HasTitles = {
  allTitleLocales:
    | {
        locale: SiteLocale | null;
        value: string;
      }[]
    | null;
};

/** Minimal homepage shape: id + locale-title array (DatoCMS-compatible). */
type HomeRecord = HasTitles & { id: string };

export type BreadcrumbStep = {
  title: string;
  id: string;
};

export type PageRouteInfo = {
  path: string;
  breadcrumb: BreadcrumbStep[];
};

export type LocaleMap = Record<SiteLocale, PageRouteInfo>;

export type SiteMap = Record<string, LocaleMap>;

export const getTitle = (item: HasTitles, locale: string) => {
  if (!item) return "";
  return getLocaleValue(item.allTitleLocales, locale, "");
};

// ─── Generic processor ────────────────────────────────────────────────────────

const processGenericItems = <T extends RoutableRecord>(
  items: T[],
  linkMap: SiteMap,
  home: HomeRecord | null,
  options: {
    getPathInfo?: (
      item: T,
      locale: SiteLocale,
    ) => { fullPath: string; steps: any[] };
    transformSteps: (
      steps: any[],
      item: T,
      locale: SiteLocale,
    ) => BreadcrumbStep[];
  },
) => {
  items?.forEach((item) => {
    linkMap[item.id] = {} as LocaleMap;

    (item.locales as SiteLocale[]).forEach((locale) => {
      const { fullPath, steps } = options.getPathInfo
        ? options.getPathInfo(item, locale)
        : resolveRoutePath(item, locale, items);

      linkMap[item.id][locale] = {
        path: `/${locale}/${fullPath}`,
        breadcrumb: home
          ? [{ title: getTitle(home, locale), id: home.id }]
          : [],
      };

      const transformedSteps = options.transformSteps(steps, item, locale);
      linkMap[item.id][locale].breadcrumb.push(...transformedSteps);
    });
  });
};

// ─── Exported processors ──────────────────────────────────────────────────────

export const processItemsPages = (items: any[], linkMap: SiteMap, home: any) =>
  processGenericItems(items, linkMap, home, {
    transformSteps: (steps) => steps.map((s) => ({ title: s.title, id: s.id })),
  });

export const processItemsNestedPages = (
  items: any[],
  linkMap: SiteMap,
  home: any,
) =>
  processGenericItems(items, linkMap, home, {
    transformSteps: (steps) =>
      steps.slice(0, 2).map((s) => ({ title: s.title, id: s.id })),
  });

const categoryTransformer = (steps: any[]) => {
  const otherSteps = steps
    .slice(0, -1)
    .map((s) => ({ title: s.title, id: s.id }));
  const last = steps[steps.length - 1];
  return [...otherSteps, { title: last?.category || "", id: last?.id }];
};

export const processItemsCategoryPages = (
  items: any[],
  linkMap: SiteMap,
  home: any,
) =>
  processGenericItems(items, linkMap, home, {
    transformSteps: categoryTransformer,
  });

// NOTE: `processItemsTabPages` is currently unused (no callers).
// When re-integrating, replace `item.modelApiKey` with the Payload collection
// slug (the string that matches `newsPageTabType` in CatalogueTab, e.g. "articles").
export const processItemsTabPages = (
  items: any[],
  linkMap: SiteMap,
  home: any,
  allTabs: Array<CatalogueIndexPayloadFragmentType & { locale?: string }>,
) =>
  processGenericItems(items, linkMap, home, {
    getPathInfo: (item, locale) => {
      const tabsCategory = getCataloguesMapCategory(allTabs, locale);
      // TODO: replace `(item as any).modelApiKey` with the Payload collection-slug
      // type identifier once this function is re-wired to Payload data.
      const category = tabsCategory
        .flatMap((cat) => cat.type)
        .find((t) => t.type === (item as any).modelApiKey)?.title;
      return resolveRoutePath(item, locale, items, category);
    },
    transformSteps: categoryTransformer,
  });
