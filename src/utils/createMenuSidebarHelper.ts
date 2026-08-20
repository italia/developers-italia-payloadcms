import type {
  SidebarItemFirstLevelProps,
  SidebarItemSecondLevelProps,
} from "@components/organisms/Sidebar/types";
import type { SiteLocale } from "@graphql/types";
import { linkResolver } from "@utils/linkResolver";

// Payload's sidebar-for-article global (normalized via normalizePayloadBlock in
// collections/loader.ts) — not tied to a GraphQL fragment type since these blocks
// are fetched over REST, not DatoCMS GraphQL.
export type MenuArticleItem = {
  id: string;
  label: string;
  pointsTo: { id: string };
};

export type SidebarMenu = {
  id: string;
  label: string;
  menu: MenuArticleItem[];
};

export function createMenuSidebar(
  datoItems: SidebarMenu[],
  currentPathname: string,
  locale: SiteLocale,
): SidebarItemFirstLevelProps[] {
  if (!datoItems || datoItems.length === 0) {
    return [];
  }

  return datoItems.map((firstLevel) => {
    const items = firstLevel.menu.map((secondLevel) => {
      const pageId = secondLevel.pointsTo.id;
      const linkTo = linkResolver(pageId, locale);

      const isActive = currentPathname.endsWith(linkTo);

      return {
        id: secondLevel.id,
        label: secondLevel.label,
        linkTo: linkTo,
        active: isActive,
      };
    });

    const hasActiveChild = items.some((item) => item.active);

    return {
      idAccordion: firstLevel.id,
      label: firstLevel.label,
      isOpen: hasActiveChild,
      items: items,
    };
  });
}

export function createFlatMenuSidebar(
  datoItems: MenuArticleItem[],
  currentPathname: string,
  locale: SiteLocale,
): SidebarItemSecondLevelProps[] {
  if (!datoItems || datoItems.length === 0) {
    return [];
  }

  return datoItems.map((secondLevel) => {
    const pageId = secondLevel.pointsTo.id;
    const linkTo = linkResolver(pageId, locale);

    const isActive = currentPathname.endsWith(linkTo);

    return {
      id: secondLevel.id,
      label: secondLevel.label,
      linkTo: linkTo,
      active: isActive,
    };
  });
}
