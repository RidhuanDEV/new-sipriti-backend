import path from "node:path";
import fsp from "node:fs/promises";
import sanitizeHtml from "sanitize-html";
import * as cheerio from "cheerio";
import type { AnyNode, Element, Text as DomText } from "domhandler";
import sharp from "sharp";
import type { CheerioAPI, Cheerio } from "cheerio";
import type { Content } from "pdfmake/interfaces.js";
import { env } from "../config/env.js";
import { logger } from "../core/logger/logger.js";
import {
  buildMathSvgPdfNode,
  buildLatexFallbackText,
  normalizeLatexInput,
} from "./academic-math-pdf.service.js";

// ---------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------

const MAX_IMAGE_PER_DOC = 8;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const SANITIZE_ALLOWED_TAGS = [
  "p", "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "br", "img", "span", "sup", "sub",
  "div", "a", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
  "figure", "figcaption", "table", "thead", "tbody", "tfoot",
  "tr", "th", "td",
] as const;

const SANITIZE_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  img: ["src", "alt", "width", "height"],
  span: ["class", "data-value", "data-academic-math", "data-latex"],
  div: ["class", "data-academic-math", "data-latex"],
  a: ["href", "target", "rel"],
  p: ["data-align", "data-indent"],
  h1: ["data-align"], h2: ["data-align"], h3: ["data-align"],
  h4: ["data-align"], h5: ["data-align"], h6: ["data-align"],
  blockquote: ["data-align"],
  figure: ["data-richtext-image", "data-align", "data-width"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

const TAG_STYLE_MAP: Record<string, string> = {
  b: "bold", strong: "bold",
  i: "italics", em: "italics",
  u: "decoration",
  s: "lineThrough", strike: "lineThrough",
  sup: "sup", sub: "sub",
};

const UNICODE_SCRIPT_MAP: Record<string, string> = {
  "⁰": "<sup>0</sup>", "¹": "<sup>1</sup>", "²": "<sup>2</sup>",
  "³": "<sup>3</sup>", "⁴": "<sup>4</sup>", "⁵": "<sup>5</sup>",
  "⁶": "<sup>6</sup>", "⁷": "<sup>7</sup>", "⁸": "<sup>8</sup>",
  "⁹": "<sup>9</sup>",
  "₀": "<sub>0</sub>", "₁": "<sub>1</sub>", "₂": "<sub>2</sub>",
  "₃": "<sub>3</sub>", "₄": "<sub>4</sub>", "₅": "<sub>5</sub>",
  "₆": "<sub>6</sub>", "₇": "<sub>7</sub>", "₈": "<sub>8</sub>",
  "₉": "<sub>9</sub>",
};

const UNICODE_PLAIN_MAP: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};

const SAFE_PDF_ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
const SAFE_MATH_DISPLAY = new Set(["inline", "block"]);

const IMAGE_WIDTH_BY_PERCENT: Record<number, number> = {
  40: 180, 60: 240, 80: 320, 100: 400,
};

const MAX_INDENT_LEVEL = 6;

// ---------------------------------------------------------------
// Helpers: image processing
// ---------------------------------------------------------------

/**
 * Validasi dan konversi buffer gambar ke format yang didukung pdfmake (JPEG/PNG).
 */
export async function ensurePdfmakeSupportedImage(
  inputBuffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    if (metadata.format === "jpeg" || metadata.format === "png") {
      const mimeType =
        metadata.format === "jpeg" ? "image/jpeg" : "image/png";
      return { buffer: inputBuffer, mimeType };
    }
    const pngBuffer = await sharp(inputBuffer).png().toBuffer();
    return { buffer: pngBuffer, mimeType: "image/png" };
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "[richTextParser] Gagal memvalidasi/konversi gambar dengan sharp",
    );
    return null;
  }
}

/**
 * Load gambar dari path lokal `/uploads/` dan return sebagai base64 data URL.
 * SSRF-safe: external URL tidak di-fetch.
 * Path-traversal-safe: path divalidasi terhadap UPLOAD_ROOT_DIR.
 */
export async function fetchImageAsBase64(
  src: string,
): Promise<string | null> {
  if (!src || typeof src !== "string") return null;

  if (src.startsWith("data:image")) {
    const estimatedBytes = (src.length * 3) / 4;
    if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) return null;
    return src;
  }

  let localPathname: string | null = null;
  let isExplicitLocal = false;

  if (src.startsWith("/uploads/")) {
    localPathname = src.split("?")[0]!.split("#")[0]!;
    isExplicitLocal = true;
  } else if (src.startsWith("/api/files/path/")) {
    const cleanPath = src.split("?")[0]!.split("#")[0]!;
    const parts = cleanPath.split("/").filter(Boolean);
    const subdir = parts[3];
    const filename = parts[4];
    if (subdir && filename) {
      localPathname = `/uploads/${decodeURIComponent(subdir)}/${decodeURIComponent(filename)}`;
    }
    isExplicitLocal = true;
  } else if (src.startsWith("http")) {
    try {
      const parsed = new URL(src);
      if (parsed.pathname.startsWith("/uploads/")) {
        localPathname = parsed.pathname;
      } else if (parsed.pathname.startsWith("/api/files/path/")) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        const subdir = parts[3];
        const filename = parts[4];
        if (subdir && filename) {
          localPathname = `/uploads/${decodeURIComponent(subdir)}/${decodeURIComponent(filename)}`;
        }
      }
    } catch {
      // invalid URL — skip
    }
  }

  if (localPathname) {
    try {
      const UPLOAD_ROOT_DIR = path.resolve(process.cwd(), env.UPLOAD_ROOT_DIR);
      const relativePath = localPathname.replace(/^\/uploads\//, "");
      const absolutePath = path.join(UPLOAD_ROOT_DIR, relativePath);

      if (
        !absolutePath.startsWith(UPLOAD_ROOT_DIR + path.sep) &&
        absolutePath !== UPLOAD_ROOT_DIR
      ) {
        logger.warn({ src }, "[richTextParser] Path traversal attempt blocked");
        return null;
      }

      const stat = await fsp.stat(absolutePath).catch(() => null);
      if (stat?.isFile()) {
        const rawBuffer = await fsp.readFile(absolutePath);
        if (rawBuffer.length <= MAX_IMAGE_SIZE_BYTES) {
          const processed = await ensurePdfmakeSupportedImage(rawBuffer);
          if (processed) {
            return `data:${processed.mimeType};base64,${processed.buffer.toString("base64")}`;
          }
        }
      }
    } catch (err) {
      logger.warn(
        { src, err: err instanceof Error ? err.message : String(err) },
        "[richTextParser] Gagal membaca file lokal",
      );
    }

    if (isExplicitLocal) return null;
  }

  // External URL tidak di-fetch (SSRF prevention)
  return null;
}

// ---------------------------------------------------------------
// Helpers: pdfmake node builders
// ---------------------------------------------------------------

function imagePlaceholderNode(): Content {
  return {
    text: "[Gambar Tidak Tersedia]",
    italics: true,
    fontSize: 8,
    color: "#9CA3AF",
    margin: [0, 4, 0, 4],
    alignment: "center",
  } as Content;
}

function resolveAlignment(
  $node: Cheerio<AnyNode>,
): "left" | "center" | "right" | "justify" | undefined {
  const alignment = String($node.attr("data-align") ?? "").trim().toLowerCase();
  return SAFE_PDF_ALIGNMENTS.has(alignment)
    ? (alignment as "left" | "center" | "right" | "justify")
    : undefined;
}

function resolveIndentLevel($node: Cheerio<AnyNode>): number {
  const parsed = Number($node.attr("data-indent"));
  if (!Number.isInteger(parsed)) return 0;
  return Math.max(0, Math.min(MAX_INDENT_LEVEL, parsed));
}

function normalizeMathAttributes(
  attribs: Record<string, string>,
): Record<string, string> {
  const next = { ...attribs };
  const display = String(next["data-academic-math"] ?? "").trim().toLowerCase();

  if (SAFE_MATH_DISPLAY.has(display)) {
    next["data-academic-math"] = display;
  } else {
    delete next["data-academic-math"];
  }

  if (typeof next["data-latex"] === "string") {
    const plainLatex = sanitizeHtml(next["data-latex"], {
      allowedTags: [],
      allowedAttributes: {},
    });
    next["data-latex"] = normalizeLatexInput(plainLatex);
  } else {
    delete next["data-latex"];
  }

  return next;
}

function resolveImagePdfWidth($node: Cheerio<AnyNode>): number {
  const parsed = Number($node.attr("data-width"));
  return IMAGE_WIDTH_BY_PERCENT[parsed] ?? IMAGE_WIDTH_BY_PERCENT[60]!;
}

function applyInlineStyle(
  base: Record<string, unknown>,
  tagName: string | undefined,
  $node: Cheerio<AnyNode>,
): Record<string, unknown> {
  const next = { ...base };
  const style = tagName ? TAG_STYLE_MAP[tagName] : undefined;

  if (style === "bold") next["bold"] = true;
  if (style === "italics") next["italics"] = true;
  if (style === "decoration") next["decoration"] = "underline";
  if (style === "lineThrough") next["decoration"] = "lineThrough";
  if (style === "sup") next["sup"] = true;
  if (style === "sub") next["sub"] = true;

  if (tagName === "a") {
    next["decoration"] = "underline";
    next["color"] = "#C2410C";
  }

  if (tagName === "span") {
    const dataValue = $node.attr("data-value");
    if (dataValue === "super") next["sup"] = true;
    if (dataValue === "sub") next["sub"] = true;
  }

  return next;
}

function resolveMathSource($node: Cheerio<AnyNode>): string {
  return normalizeLatexInput($node.attr("data-latex") ?? $node.text() ?? "");
}

function buildMathPdfNode(
  $node: Cheerio<AnyNode>,
  fontSize: number,
  displayMode: boolean,
): Content | null {
  const latex = resolveMathSource($node);
  if (!latex) return null;

  const svgNode = buildMathSvgPdfNode(latex, fontSize, displayMode);
  if (svgNode) return svgNode as unknown as Content;

  const source = buildLatexFallbackText(latex, displayMode);
  return {
    text: source,
    fontSize,
    italics: true,
    color: "#334155",
    alignment: displayMode ? "center" : undefined,
    margin: displayMode ? [0, 5, 0, 5] : [0, 2, 0, 2],
  } as Content;
}

function collectInlineParts(
  node: AnyNode,
  $: CheerioAPI,
  inheritedStyle: Record<string, unknown> = {},
  fontSize = 10,
): Record<string, unknown>[] {
  if (!node) return [];

  if (node.type === "text") {
    const text = (node as DomText).data ?? "";
    return text ? [{ ...inheritedStyle, text }] : [];
  }

  const el = node as Element;
  const tagName = el.name?.toLowerCase();

  if (tagName === "br") return [{ ...inheritedStyle, text: "\n" }];

  const $el = $(el);

  if ($el.attr("data-academic-math")) {
    const mathNode = buildMathPdfNode(
      $el,
      fontSize,
      $el.attr("data-academic-math") === "block",
    );
    if (mathNode) {
      const mathObj = mathNode as unknown as Record<string, unknown>;
      if ("svg" in mathObj) return [mathObj];
      return [{ ...inheritedStyle, ...mathObj }];
    }
    return [];
  }

  const nextStyle = applyInlineStyle(inheritedStyle, tagName, $el);
  const parts: Record<string, unknown>[] = [];
  (el.childNodes ?? []).forEach((child) => {
    parts.push(...collectInlineParts(child as AnyNode, $, nextStyle, fontSize));
  });
  return parts;
}

function normalizeInlineParts(
  parts: Record<string, unknown>[],
  fontSize: number,
): Record<string, unknown>[] {
  return parts
    .map((part) => {
      if ("svg" in part) return part;
      return { ...part, text: String(part["text"] ?? ""), fontSize };
    })
    .filter((part) =>
      "svg" in part ? true : String(part["text"] ?? "").length > 0,
    );
}

function buildInlineContent(
  parts: Record<string, unknown>[],
  fontSize: number,
  fallbackText: string,
): Record<string, unknown> | null {
  const normalized = normalizeInlineParts(parts, fontSize);
  if (normalized.length === 0 && !fallbackText) return null;
  if (normalized.length === 0) return { text: fallbackText, fontSize };
  if (normalized.length === 1) return { ...normalized[0] };
  return { text: normalized };
}

function buildNodeInlineContent(
  $node: Cheerio<AnyNode>,
  $: CheerioAPI,
  fontSize: number,
): Record<string, unknown> | null {
  const root = $node[0];
  if (!root) return null;
  const el = root as Element;
  const parts: Record<string, unknown>[] = [];
  (el.childNodes ?? []).forEach((child) => {
    parts.push(...collectInlineParts(child as AnyNode, $, {}, fontSize));
  });
  return buildInlineContent(parts, fontSize, $node.text().trim());
}

function buildTextBlockNode(
  $node: Cheerio<AnyNode>,
  $: CheerioAPI,
  fontSize: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> | null {
  const content = buildNodeInlineContent($node, $, fontSize);
  if (!content) return null;

  const indentLevel = resolveIndentLevel($node);
  const alignment = resolveAlignment($node);

  return {
    ...content,
    margin: [indentLevel * 14, 2, 0, 2],
    ...(alignment ? { alignment } : {}),
    ...overrides,
  };
}

function buildListNode(
  $list: Cheerio<AnyNode>,
  $: CheerioAPI,
  fontSize: number,
  depth = 0,
): Content | null {
  const el = $list[0] as Element | undefined;
  const tagName = el?.name?.toLowerCase();
  const listKey = tagName === "ol" ? "ol" : "ul";
  const listItems: Content[] = [];

  $list.children("li").toArray().forEach((li) => {
    const $li = $(li);
    const clone = $li.clone();
    clone.children("ul, ol").remove();
    const inlineContent = buildNodeInlineContent(clone, $, fontSize);
    const nestedLists = $li.children("ul, ol").toArray();
    const stack: Content[] = [];

    if (inlineContent) stack.push(inlineContent as unknown as Content);
    nestedLists.forEach((nestedList) => {
      const nestedNode = buildListNode($(nestedList), $, fontSize, depth + 1);
      if (nestedNode) stack.push(nestedNode);
    });

    if (stack.length === 1) {
      listItems.push(stack[0]!);
    } else if (stack.length > 1) {
      listItems.push({ stack } as Content);
    }
  });

  if (listItems.length === 0) return null;
  return { [listKey]: listItems, margin: [depth * 14, 2, 0, 2] } as unknown as Content;
}

function buildTableNode(
  $table: Cheerio<AnyNode>,
  $: CheerioAPI,
  fontSize: number,
): Content | null {
  const rows = $table.find("tr").toArray();
  if (rows.length === 0) return null;

  const body: Record<string, unknown>[][] = rows.map((row) => {
    const el = row as Element;
    return (el.childNodes ?? [])
      .filter(
        (n): n is Element =>
          (n as Element).name === "th" || (n as Element).name === "td",
      )
      .map((cell) => {
        const inlineContent = buildNodeInlineContent($(cell), $, fontSize) ?? {
          text: "-",
          fontSize,
        };
        return {
          ...inlineContent,
          bold: (cell as Element).name === "th",
          margin: [0, 2, 0, 2],
        };
      });
  });

  const columnCount = Math.max(...body.map((row) => row.length));
  if (!Number.isFinite(columnCount) || columnCount <= 0) return null;

  body.forEach((row) => {
    while (row.length < columnCount) {
      row.push({ text: "", fontSize, bold: false, margin: [0, 2, 0, 2] });
    }
  });

  const headerRows =
    $table.find("thead tr").length > 0
      ? $table.find("thead tr").length
      : body[0]?.some((cell) => cell["bold"])
        ? 1
        : 0;

  return {
    table: {
      headerRows,
      widths: Array.from({ length: columnCount }, () => "*"),
      body,
    },
    layout: "lightHorizontalLines",
    margin: [0, 4, 0, 6],
  } as unknown as Content;
}

async function buildImageNode(
  $node: Cheerio<AnyNode>,
  width: number,
  alignment: "left" | "center" | "right" | "justify" | undefined,
): Promise<Content> {
  const src = $node.attr("src") ?? "";
  const dataUrl = await fetchImageAsBase64(src);
  if (dataUrl) {
    return {
      image: dataUrl,
      width,
      margin: [0, 5, 0, 5],
      alignment: alignment ?? "center",
    } as Content;
  }
  return imagePlaceholderNode();
}

// ---------------------------------------------------------------
// Main export: parseRichTextToNodes
// ---------------------------------------------------------------

export interface ParseRichTextOptions {
  fontSize?: number;
}

/**
 * Mengurai HTML rich text menjadi array pdfmake Content nodes.
 *
 * Pipeline:
 *   HTML input
 *     → Sanitize (strip XSS, event handlers)
 *     → Pre-process unicode superscript/subscript
 *     → Parse DOM (cheerio)
 *     → Transform ke pdfmake content nodes
 *
 * Gambar di-load dari filesystem lokal secara async.
 * Rumus LaTeX dirender via MathJax → SVG (di-embed ke pdfmake).
 */
export async function parseRichTextToNodes(
  html: string,
  opts: ParseRichTextOptions = {},
): Promise<Content[]> {
  const { fontSize = 10 } = opts;

  if (!html || typeof html !== "string" || html.trim() === "") {
    return [{ text: "-", fontSize } as Content];
  }

  const processedHtml = html.replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g,
    (match) => UNICODE_SCRIPT_MAP[match] ?? match,
  );

  const clean = sanitizeHtml(processedHtml, {
    allowedTags: [...SANITIZE_ALLOWED_TAGS],
    allowedAttributes: SANITIZE_ALLOWED_ATTRS,
    allowedStyles: {},
    disallowedTagsMode: "discard",
    transformTags: {
      span: (tagName, attribs) => ({
        tagName,
        attribs: attribs["data-academic-math"]
          ? normalizeMathAttributes(attribs)
          : attribs,
      }),
      div: (tagName, attribs) => ({
        tagName,
        attribs: attribs["data-academic-math"]
          ? normalizeMathAttributes(attribs)
          : attribs,
      }),
    },
  });

  if (!clean.trim()) return [{ text: "-", fontSize } as Content];

  const $ = cheerio.load(clean);
  const bodyChildren = $("body").children().toArray();
  const nodes: Content[] = [];
  let imageCount = 0;

  for (const el of bodyChildren) {
    const $el = $(el);
    const elNode = el as Element;
    const tagName = elNode.name?.toLowerCase();

    // ul / ol
    if (tagName === "ul" || tagName === "ol") {
      const listNode = buildListNode($el, $, fontSize);
      if (listNode) nodes.push(listNode);
      continue;
    }

    // figure (gambar + caption)
    if (tagName === "figure") {
      const $image = $el.find("img").first();
      if ($image.length > 0 && imageCount < MAX_IMAGE_PER_DOC) {
        imageCount++;
        const alignment = resolveAlignment($el);
        const width = resolveImagePdfWidth($el);
        const imageNode = await buildImageNode($image, width, alignment);
        const caption = $el.find("figcaption").first().text().trim();
        const stack: Content[] = [imageNode];
        if (caption) {
          stack.push({
            text: caption,
            italics: true,
            fontSize: Math.max(8, fontSize - 1),
            color: "#64748B",
            margin: [0, 0, 0, 4],
            alignment: alignment ?? "center",
          } as Content);
        }
        nodes.push({ stack, margin: [0, 4, 0, 6] } as unknown as Content);
      }
      continue;
    }

    // table
    if (tagName === "table") {
      const tableNode = buildTableNode($el, $, fontSize);
      if (tableNode) nodes.push(tableNode);
      continue;
    }

    // img standalone (legacy content)
    if (tagName === "img") {
      if (imageCount < MAX_IMAGE_PER_DOC) {
        imageCount++;
        nodes.push(await buildImageNode($el, 240, "center"));
      }
      continue;
    }

    // br standalone
    if (tagName === "br") {
      nodes.push({ text: "\n", fontSize } as Content);
      continue;
    }

    // math block di root level
    if ($el.attr("data-academic-math")) {
      const mathNode = buildMathPdfNode(
        $el,
        fontSize,
        $el.attr("data-academic-math") === "block",
      );
      if (mathNode) nodes.push(mathNode);
      continue;
    }

    // heading
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName ?? "")) {
      const headingSize: Record<string, number> = {
        h1: fontSize + 6, h2: fontSize + 4, h3: fontSize + 2,
        h4: fontSize + 1, h5: fontSize, h6: fontSize,
      };
      const size = headingSize[tagName ?? ""] ?? fontSize;
      const headingNode = buildTextBlockNode($el, $, size, {
        bold: true,
        margin: [0, 6, 0, 4],
      });
      if (headingNode) nodes.push(headingNode as unknown as Content);
      continue;
    }

    // blockquote
    if (tagName === "blockquote") {
      const bqNode = buildTextBlockNode($el, $, fontSize, {
        italics: true,
        color: "#475569",
        margin: [10, 4, 0, 4],
      });
      if (bqNode) nodes.push(bqNode as unknown as Content);
      continue;
    }

    // block with embedded images (legacy content)
    if ($el.find("img").length > 0) {
      const clone = $el.clone();
      clone.find("img").remove();
      const textNode = buildTextBlockNode(clone, $, fontSize);
      if (textNode) nodes.push(textNode as unknown as Content);
      for (const image of $el.find("img").toArray()) {
        if (imageCount >= MAX_IMAGE_PER_DOC) break;
        imageCount++;
        nodes.push(await buildImageNode($(image), 240, "center"));
      }
      continue;
    }

    // paragraph / div / generic block
    const textNode = buildTextBlockNode($el, $, fontSize);
    if (textNode) nodes.push(textNode as unknown as Content);
  }

  return nodes.length > 0 ? nodes : [{ text: "-", fontSize } as Content];
}

// ---------------------------------------------------------------
// stripHtmlToPlainText (existing function — retained + enhanced)
// ---------------------------------------------------------------

const ALLOWED_PLAIN_TAGS = [
  "p", "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "br", "span", "div", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
] as const;

/**
 * Strip semua HTML jadi plain text.
 * Konversi unicode superscript/subscript ke digit biasa.
 */
export function stripHtmlToPlainText(
  value: string | null | undefined,
): string {
  if (!value) return "";

  const processedHtml = value.replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g,
    (match) => UNICODE_PLAIN_MAP[match] ?? match,
  );

  const sanitized = sanitizeHtml(processedHtml, {
    allowedTags: [...ALLOWED_PLAIN_TAGS],
    allowedAttributes: {},
    textFilter(text) {
      return text.replace(/\s+/g, " ");
    },
  });

  return sanitized
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
