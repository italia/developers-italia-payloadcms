import { normalizeSpaces } from "@utils/normalizeSpaces";

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

/** Rendering options for the main rich-text body. */
export type LexicalRenderOptions = {
  /**
   * Visually hidden text appended to every link, as the DatoCMS site did for
   * links in structured text ("Vai alla pagina" / "Apre in un nuovo tab").
   */
  linkLabels?: { internal: string; external: string };
  /** Turn non-breaking spaces pasted from external editors into plain spaces. */
  normalizeSpaces?: boolean;
};

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
    // Underscores count as markdown only around a word, never inside one:
    // "dip_trasformazione_digitale" (handles, URLs) must stay as typed.
    .replace(/(?<![\w])__(.+?)__(?![\w])/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/(?<![\w])_(.+?)_(?![\w])/g, "<em>$1</em>")
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

function renderNode(node: LexicalNode, options: LexicalRenderOptions): string {
  switch (node.type) {
    case "text": {
      const text = options.normalizeSpaces
        ? normalizeSpaces(node.text ?? "")
        : (node.text ?? "");
      return wrapFormat(
        parseInlineMarkdown(text),
        typeof node.format === "number" ? node.format : 0
      );
    }

    case "linebreak":
      return "<br />";

    case "paragraph":
      return `<p>${renderChildren(node, options)}</p>`;

    case "heading": {
      const tag = node.tag ?? "h2";
      return `<${tag}>${renderChildren(node, options)}</${tag}>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      // Lexical stores a nested list in a list item of its own, right after the
      // item it belongs to: render it inside that item, as HTML expects.
      const items: string[] = [];
      for (const child of node.children ?? []) {
        const isNestedList =
          child.type === "listitem" &&
          child.children?.length === 1 &&
          child.children[0].type === "list";
        if (isNestedList && items.length > 0) {
          items[items.length - 1] += renderChildren(child, options);
        } else if (child.type === "listitem") {
          items.push(renderChildren(child, options));
        } else {
          items.push(renderNode(child, options));
        }
      }
      return `<${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
    }

    case "listitem":
      return `<li>${renderChildren(node, options)}</li>`;

    case "link": {
      const url = node.fields?.url ?? node.url ?? "#";
      const isExternal = !!node.fields?.newTab;
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      // No whitespace inside the anchor other than the one leading the hidden
      // label: it would be rendered (underlined) around the link text.
      const label = options.linkLabels
        ? `<span class="visually-hidden"> ${
            isExternal ? options.linkLabels.external : options.linkLabels.internal
          }</span>`
        : "";
      return `<a href="${url}"${target}>${renderChildren(node, options)}${label}</a>`;
    }

    case "quote":
      return `<blockquote>${renderChildren(node, options)}</blockquote>`;

    default:
      return node.children ? renderChildren(node, options) : "";
  }
}

function renderChildren(node: LexicalNode, options: LexicalRenderOptions): string {
  return (node.children ?? []).map((child) => renderNode(child, options)).join("");
}

export function lexicalToHtml(
  value: unknown,
  options: LexicalRenderOptions = {},
): string | null {
  if (value == null) return null;
  if (typeof value === "string") return parseInlineMarkdown(value);
  if (!isLexicalRoot(value)) return null;
  const html = (value.root.children ?? [])
    .map((child) => renderNode(child, options))
    .join("");
  return html || null;
}
