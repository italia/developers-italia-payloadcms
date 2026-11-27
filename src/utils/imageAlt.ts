/**
 * Alternative text of an image, or "" when the image is decorative.
 *
 * In the CMS the "alt" field of a media is required, so for decorative images
 * it was filled with the file name ("hero-home-desktop.png" -> "Hero Home
 * Desktop"). Such a text says nothing to screen-reader users: it is dropped,
 * so the image gets alt="" and is ignored by assistive technologies
 * (WCAG 1.1.1). A text written by the editors is kept as it is.
 */
const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export function meaningfulAlt(
  alt: string | null | undefined,
  url: string | null | undefined,
): string {
  const text = alt?.trim() ?? "";
  if (!text || !url) return text;

  const fileName = url.split(/[?#]/)[0].split("/").pop() ?? "";
  let baseName = fileName.replace(/\.[a-z0-9]+$/i, "");
  try {
    baseName = decodeURIComponent(baseName);
  } catch {
    // keep the raw name
  }

  const altKey = normalize(text);
  const fileKey = normalize(baseName);
  if (!altKey || !fileKey) return text;

  // "-1", "-2"… are added by the CMS when a file name is already taken.
  const isFileName =
    altKey === fileKey || altKey === fileKey.replace(/\d+$/, "");

  return isFileName ? "" : text;
}
