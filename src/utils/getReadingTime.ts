/**
 * Estimates reading time (in minutes) from a story's content blocks, the way
 * designers.italia.it does on news pages.
 *
 * `content` here is the loader's already-normalized block array
 * (normalizePayloadBlock in collections/loader.ts): most richText fields
 * (title, paragraph, ...) have already been converted to HTML strings, while
 * fields excluded from that conversion (structured-text-block's own
 * content/textContent) remain raw Lexical JSON. This walks both shapes,
 * counts words, and divides by an average reading speed. Result is rounded
 * up and never below 1 (for non-empty content).
 */

// Average reading speed (words per minute) used for the estimate.
const WORDS_PER_MINUTE = 200;

function wordsInHtml(html: string): number {
  return html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectLexicalText(node: unknown, acc: string[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((child) => collectLexicalText(child, acc));
    return;
  }
  const n = node as Record<string, unknown>;
  if (n.type === "text" && typeof n.text === "string") acc.push(n.text);
  if (Array.isArray(n.children)) collectLexicalText(n.children, acc);
  if (n.root) collectLexicalText(n.root, acc);
}

function isLexicalRoot(value: unknown): value is { root: { type: string } } {
  if (!value || typeof value !== "object") return false;
  const root = (value as Record<string, unknown>).root;
  return !!root && typeof root === "object" && (root as Record<string, unknown>).type === "root";
}

function countWords(node: unknown, seen: Set<unknown>): number {
  if (node == null) return 0;
  if (typeof node === "string") return wordsInHtml(node);
  if (Array.isArray(node)) {
    return node.reduce((sum: number, child) => sum + countWords(child, seen), 0);
  }
  if (typeof node !== "object" || seen.has(node)) return 0;
  seen.add(node);

  if (isLexicalRoot(node)) {
    const parts: string[] = [];
    collectLexicalText(node, parts);
    return parts.join(" ").split(/\s+/).filter(Boolean).length;
  }

  return Object.values(node as Record<string, unknown>).reduce(
    (sum: number, value) => sum + countWords(value, seen),
    0,
  );
}

export function getReadingTime(content: unknown): number {
  const words = countWords(content, new Set());
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
