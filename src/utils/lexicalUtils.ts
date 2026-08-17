type LexicalNode = {
  type: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  children?: LexicalNode[];
  fields?: { url?: string; newTab?: boolean };
  url?: string;
  version?: number;
  direction?: string;
};

type LexicalRoot = { root: LexicalNode };

function isLexicalRoot(value: unknown): value is LexicalRoot {
  return (
    value !== null &&
    typeof value === "object" &&
    "root" in value &&
    (value as LexicalRoot).root?.type === "root"
  );
}

function collectPlainText(node: LexicalNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "linebreak") return " ";
  if (!node.children) return "";
  return node.children.map(collectPlainText).join("");
}

export function lexicalToPlainText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (!isLexicalRoot(value)) return null;
  const parts = (value.root.children ?? []).map(collectPlainText);
  return parts.join(" ").trim() || null;
}

// Editors sometimes type markdown syntax directly (or it arrives that way via
// migrated content) instead of using the rich text toolbar. Lexical only auto-converts
// markdown shortcuts while typing live, so already-saved literal syntax (e.g. "**bold**")
// would otherwise render as plain text. Parse it into real HTML at render time instead.
function parseInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function wrapFormat(text: string, format: number): string {
  if (!format || !text) return text;
  let result = text;
  if (format & 1) result = `<strong>${result}</strong>`;
  if (format & 2) result = `<em>${result}</em>`;
  if (format & 4) result = `<s>${result}</s>`;
  if (format & 8) result = `<u>${result}</u>`;
  if (format & 16) result = `<code>${result}</code>`;
  if (format & 32) result = `<sub>${result}</sub>`;
  if (format & 64) result = `<sup>${result}</sup>`;
  return result;
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case "text":
      return wrapFormat(
        parseInlineMarkdown(node.text ?? ""),
        typeof node.format === "number" ? node.format : 0
      );

    case "linebreak":
      return "<br />";

    case "paragraph":
      return `<p>${renderChildren(node)}</p>`;

    case "heading": {
      const tag = node.tag ?? "h2";
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${renderChildren(node)}</${tag}>`;
    }

    case "listitem":
      return `<li>${renderChildren(node)}</li>`;

    case "link": {
      const url = node.fields?.url ?? node.url ?? "#";
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${url}"${target}>${renderChildren(node)}</a>`;
    }

    case "quote":
      return `<blockquote>${renderChildren(node)}</blockquote>`;

    default:
      return node.children ? renderChildren(node) : "";
  }
}

function renderChildren(node: LexicalNode): string {
  return (node.children ?? []).map(renderNode).join("");
}

export function lexicalToHtml(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return parseInlineMarkdown(value);
  if (!isLexicalRoot(value)) return null;
  const html = (value.root.children ?? []).map(renderNode).join("");
  return html || null;
}
