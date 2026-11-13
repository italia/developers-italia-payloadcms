/**
 * If the HTML is exactly one paragraph, returns its inner HTML; otherwise null.
 *
 * Short rich-text fields (hero subtitle, card description) arrive from the CMS
 * as `<p>…</p>`: components that own the paragraph tag use this to avoid
 * nesting a paragraph inside their wrapper.
 */
export function singleParagraphInner(html: string): string | null {
  const match = /^\s*<p>([\s\S]*)<\/p>\s*$/.exec(html);
  if (!match) return null;
  return /<\/?p[\s>]/.test(match[1]) ? null : match[1];
}
