import type {
  HeaderNavbarProps,
  MenuItemProps,
} from "@components/organisms/Header/types";
import type {
  PayloadExternalLinkFragmentType,
  PayloadMegaMenuItemFragmentType,
  PayloadMenuItemFragmentType,
} from "@graphql/fragment/payloadBlocks";
import { linkResolver } from "@utils/linkResolver";

/**
 * Extracts the document ID from a Payload polymorphic relationship.
 *
 * DatoCMS shape (old):  item.pointsTo.id          → flat record with id: string
 * Payload shape (new):  item.pointsTo?.value?.id  → { relationTo, value: Page | Article | … }
 *
 * Payload IDs are numbers in generated TS types (even though GraphQL serialises
 * them as strings), so we stringify here for linkResolver compatibility.
 */
function resolvePointsToId(
  pointsTo:
    | { value?: { id?: string | number | null } | null }
    | null
    | undefined,
): string | undefined {
  const raw = pointsTo?.value?.id;
  return raw != null ? String(raw) : undefined;
}

function menuItemAdapter(
  item: PayloadMenuItemFragmentType | PayloadMegaMenuItemFragmentType,
  currentPath: string,
  locale: string,
): MenuItemProps {
  const pageId = resolvePointsToId(item.pointsTo);
  const finalHref = linkResolver(pageId, locale);

  const normalizedCurrent = currentPath.replace(/\/$/, "") || "/";
  const normalizedMenu = finalHref.replace(/\/$/, "") || "/";

  const isActive =
    normalizedMenu === "/"
      ? normalizedCurrent === "/"
      : normalizedCurrent.startsWith(normalizedMenu);

  const result: MenuItemProps = {
    id: item.id ?? "",
    title: item.title,
    url: finalHref,
    active: isActive,
  };

  if ("subMenu" in item) {
    const mega = item as PayloadMegaMenuItemFragmentType;

    result.image = mega.image?.url
      ? {
          url: mega.image.url,
          width: mega.image.width ?? null,
          height: mega.image.height ?? null,
          alt: mega.image.alt ?? null,
        }
      : undefined;
    result.caption = mega.caption;
    result.subtitle = mega.subtitle;
    result.subMenuItems = (mega.subMenu ?? [])
      .map((sub) =>
        "title" in sub
          ? menuItemAdapter(sub as PayloadMenuItemFragmentType, currentPath, locale)
          : null,
      )
      .filter((s): s is MenuItemProps => s !== null);
  }

  return result;
}

function metaMenuItemAdapter(
  item: PayloadExternalLinkFragmentType,
  currentPath: string,
): MenuItemProps {
  const finalHref = item.url;

  const normalizedCurrent = currentPath.replace(/\/$/, "") || "/";
  const normalizedMenu = finalHref.replace(/\/$/, "") || "/";

  const isActive =
    normalizedMenu === "/"
      ? normalizedCurrent === "/"
      : normalizedCurrent.startsWith(normalizedMenu);

  return {
    id: item.id ?? "",
    title: item.label,
    url: finalHref,
    active: isActive,
  };
}

export function createMenu(
  mainItems: (PayloadMegaMenuItemFragmentType | PayloadMenuItemFragmentType)[] = [],
  secondaryItems: (PayloadMegaMenuItemFragmentType | PayloadMenuItemFragmentType)[] = [],
  currentPathname: string,
  currentLocale: string,
): HeaderNavbarProps {
  return {
    left: mainItems.map((item) =>
      menuItemAdapter(item, currentPathname, currentLocale),
    ),
    right: secondaryItems.map((item) =>
      menuItemAdapter(item, currentPathname, currentLocale),
    ),
  };
}

export function createMetaMenu(
  metaNavigation: PayloadExternalLinkFragmentType[] = [],
  currentPathname: string,
): MenuItemProps[] {
  return metaNavigation.map((item) =>
    metaMenuItemAdapter(item, currentPathname),
  );
}
