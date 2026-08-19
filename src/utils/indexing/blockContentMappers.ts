import { lexicalToPlainText } from "@utils/lexicalUtils";

// Generic plain-text extractor for Payload block content. Rather than a hand-written
// flattener per block type (~19 and growing), this walks any block/object graph and
// collects every string value it finds — including richText fields, which it detects
// by shape (via lexicalToPlainText) and converts inline. New blocks or fields need no
// changes here as long as the GraphQL selection includes them.
const SKIP_KEYS = new Set(["id", "blockType", "__typename", "url"]);

export function extractPlainText(value: unknown): string[] {
  if (value == null) return [];

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractPlainText);
  }

  if (typeof value === "object") {
    const asPlainText = lexicalToPlainText(value);
    if (asPlainText) return [asPlainText];

    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SKIP_KEYS.has(key))
      .flatMap(([, v]) => extractPlainText(v));
  }

  return [];
}

export const flattenBlocks = (blocks: unknown[] | undefined | null): string => {
  if (!blocks) return "";
  return extractPlainText(blocks).join(" ").replace(/\s+/g, " ").trim();
};
