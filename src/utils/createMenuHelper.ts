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
 * Extracts the prefixed linkMap key from a menu item's pointsTo field.
 *
 * At runtime the value comes from normalizePayloadBlock which emits the flat shape:
 *   { id: "pages:13" }  (pre-computed "collection:numericId" key — preferred path)
 *
 * The TypeScript type is still the raw GraphQL fragment shape:
 *   { relationTo: string, value: { id: number } | null }
 *
 * We handle both so TypeScript is happy and runtime works correctly.
 */
function resolvePointsToId(
  pointsTo:
    | { id?: string | number | null }                                                          // normalized (runtime)
    | { value?: { id?: string | number | null } | null; relationTo?: string | null }           // GraphQL fragment (TS type)
    | null
    | undefined,
): string | undefined {
  if (!pointsTo) return undefined;

  // Normalized shape emitted by normalizePayloadBlock: { id: "pages:13" }
  if ("id" in pointsTo) {
    const raw = (pointsTo as { id?: string | number | null }).id;
    return raw != null ? String(raw) : undefined;
  }

  // GraphQL shape (TypeScript type satisfaction / fallback):
  // { value: { id: N }, relationTo: "pages" }
  const rel = pointsTo as { value?: { id?: string | number | null } | null; relationTo?: string | null };
  const raw = rel.value?.id;
  if (raw == null) return undefined;
  const id = String(raw);
  return rel.relationTo ? `${rel.relationTo}:${id}` : id;
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
