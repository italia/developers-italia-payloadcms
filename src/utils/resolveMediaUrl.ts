// Payload media docs carry a site-relative `url` (e.g. "/api/media/file/x.svg"); resolve it to
// an absolute URL the same way @components/react/Image/Image.tsx does for content photos —
// needed anywhere a plain <img src> is used instead of that component (e.g. small UI icons,
// where the responsive srcset it builds isn't wanted).
export function resolveMediaUrl(
  media: string | { url?: string | null } | null | undefined,
): string {
  const url = typeof media === "string" ? media : media?.url;
  if (!url) return "";
  return url.startsWith("/") ? `${import.meta.env.PUBLIC_PAYLOAD_URL}${url}` : url;
}
