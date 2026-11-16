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

/**
 * For templates that write their own `<p>`: returns the inner HTML when the
 * value is a single paragraph (so that paragraphs are not nested), the value
 * itself otherwise.
 */
export function unwrapSingleParagraph(html: string | null | undefined): string {
  if (!html) return "";
  return singleParagraphInner(html) ?? html;
}
