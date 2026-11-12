/**
 * Estimates reading time (in minutes) from a story's content blocks, the way
 * designers.italia.it does on news pages.
 *
 * `content` here is the loader's already-normalized block array
 * (normalizePayloadBlock in collections/loader.ts): the rich-text body
 * (structured-text-block's content/textContent) is kept as raw Lexical JSON.
 * This walks the blocks, counts the words of those bodies and divides by an
 * average reading speed. Result is rounded up and never below 1 (for
 * non-empty content).
 */

// Average reading speed (words per minute) used for the estimate.
const WORDS_PER_MINUTE = 200;

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
  if (node == null || typeof node !== "object") return 0;
  if (Array.isArray(node)) {
    return node.reduce((sum: number, child) => sum + countWords(child, seen), 0);
  }
  if (seen.has(node)) return 0;
  seen.add(node);

  // Only the rich-text body counts, as on the DatoCMS site (which counted the
  // text spans of the structured text): titles, labels, urls and the other
  // plain block fields are left out.
  if (isLexicalRoot(node)) {
    const parts: string[] = [];
    collectLexicalText(node, parts);
    return parts.join(" ").split(/\s+/).filter(Boolean).length;
  }

  const record = node as Record<string, unknown>;
  return Object.entries(record).reduce((sum: number, [key, value]) => {
    // `textContent` is the loader's alias of `content` on structured text
    // blocks (a separate copy once it has gone through the content store):
    // count the body once.
    if (key === "textContent" && "content" in record) return sum;
    return sum + countWords(value, seen);
  }, 0);
}

export function getReadingTime(content: unknown): number {
  const words = countWords(content, new Set());
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
