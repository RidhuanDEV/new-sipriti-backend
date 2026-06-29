import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import katex from "katex";
import { logger } from "../core/logger/logger.js";

// ---------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------

const MATH_PDF_COLOR = "#334155";
const MAX_LATEX_LENGTH = 2000;
const EX_TO_FONT_SIZE_RATIO = 0.55;
const MAX_INLINE_MATH_WIDTH = 220;
const MAX_BLOCK_MATH_WIDTH = 420;
const MIN_MATH_WIDTH = 12;

const KATEX_RENDER_OPTIONS = {
  throwOnError: true,
  strict: false,
  trust: false,
  output: "htmlAndMathml" as const,
};

// ---------------------------------------------------------------
// MathJax module-level singleton — intentional, init sekali saat load
// ---------------------------------------------------------------

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({ packages: ["base", "ams", "noundefined"] });
const svgOutput = new SVG({ fontCache: "none" });
const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface SvgLength {
  value: number;
  unit: string;
}

/** pdfmake SVG node untuk math inline */
export interface MathSvgPdfNode {
  svg: string;
  width: number;
  alignment?: string;
  margin?: [number, number, number, number];
}

// ---------------------------------------------------------------
// Fungsi
// ---------------------------------------------------------------

/**
 * Sanitasi string LaTeX: strip zero-width chars, trim, cap panjang.
 */
export function normalizeLatexInput(value: unknown): string {
  return String(value ?? "")
    .replace(
      /​|‌|‍|‎|‏|‪|‫|‬|‭|‮/g,
      "",
    )
    .trim()
    .slice(0, MAX_LATEX_LENGTH);
}

/**
 * Fallback teks jika SVG gagal dihasilkan: `$...$` atau `$$...$$`.
 */
export function buildLatexFallbackText(
  latex: string,
  displayMode: boolean,
): string {
  const source = normalizeLatexInput(latex);
  if (!source) return "";
  return displayMode ? `$$${source}$$` : `$${source}$`;
}

/**
 * Gate: cek apakah KaTeX dapat merender rumus sebelum MathJax dipakai.
 * Frontend preview pakai KaTeX — ini memastikan konsistensi.
 */
export function isKatexRenderable(
  latex: string,
  displayMode: boolean,
): boolean {
  try {
    katex.renderToString(latex, { ...KATEX_RENDER_OPTIONS, displayMode });
    return true;
  } catch {
    return false;
  }
}

/**
 * Render LaTeX → MathJax SVG string.
 * Hanya dijalankan jika KaTeX juga bisa render (konsistensi dengan preview).
 */
export function renderLatexToSvg(
  latex: string,
  displayMode: boolean,
): string | null {
  const source = normalizeLatexInput(latex);
  if (!source) return null;
  if (!isKatexRenderable(source, displayMode)) return null;

  try {
    const node = mathDocument.convert(source, { display: displayMode });
    const svgMarkup = adaptor.innerHTML(node) as string;
    const start = svgMarkup.indexOf("<svg");
    const end = svgMarkup.lastIndexOf("</svg>");

    if (start < 0 || end < 0) return null;

    return svgMarkup
      .slice(start, end + "</svg>".length)
      .replace(/currentColor/g, MATH_PDF_COLOR);
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "[academicMathPdf] Gagal render rumus LaTeX ke SVG",
    );
    return null;
  }
}

/**
 * Parse nilai `width` atau `height` dari SVG markup.
 */
export function readSvgLength(
  svgMarkup: string,
  attribute: "width" | "height",
): SvgLength | null {
  const pattern = new RegExp(`${attribute}="([0-9.]+)([a-zA-Z%]*)"`);
  const match = svgMarkup.match(pattern);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  return { value, unit: match[2] || "px" };
}

/**
 * Hitung lebar SVG dalam poin untuk pdfmake.
 * Konversi unit ex/em/px → pt dengan cap berdasarkan display mode.
 */
export function resolvePdfMathWidth(
  svgMarkup: string,
  fontSize: number,
  displayMode: boolean,
): number {
  const length = readSvgLength(svgMarkup, "width");
  const maxWidth = displayMode ? MAX_BLOCK_MATH_WIDTH : MAX_INLINE_MATH_WIDTH;

  if (!length) return Math.min(maxWidth, fontSize * 8);

  const rawWidth =
    length.unit === "ex"
      ? length.value * fontSize * EX_TO_FONT_SIZE_RATIO
      : length.unit === "em"
        ? length.value * fontSize
        : length.value;

  if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
    return Math.min(maxWidth, fontSize * 8);
  }

  return Math.max(MIN_MATH_WIDTH, Math.min(maxWidth, rawWidth));
}

/**
 * Buat pdfmake SVG node untuk rumus matematika.
 * Return `null` jika rendering gagal (caller wajib fallback ke teks).
 */
export function buildMathSvgPdfNode(
  latex: string,
  fontSize: number,
  displayMode: boolean,
): MathSvgPdfNode | null {
  const svg = renderLatexToSvg(latex, displayMode);
  if (!svg) return null;

  const width = resolvePdfMathWidth(svg, fontSize, displayMode);

  if (!displayMode) return { svg, width };

  return { svg, width, alignment: "center", margin: [0, 5, 0, 5] };
}

export { MATH_PDF_COLOR };
