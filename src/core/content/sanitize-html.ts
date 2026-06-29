import sanitizeHtml from "sanitize-html";

export const RICHTEXT_IMAGE_PATH = "/uploads/richtext/";
export const SECURE_RICHTEXT_IMAGE_PATH = "/api/files/path/richtext/";

const allowedTags = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "q",
  "pre",
  "code",
  "span",
  "div",
  "hr",
  "figure",
  "figcaption",
  "img",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
] as const;

const safeAlignments = new Set(["left", "center", "right", "justify"]);
const safeImageWidths = new Set(["40", "60", "80", "100"]);
const safeTableWidths = new Set(["50", "60", "70", "80", "90", "100"]);
const safeMathDisplay = new Set(["inline", "block"]);
const maxIndentLevel = 6;
const richtextImageFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;

function normalizeRichtextImageSource(src: string | undefined): string | null {
  if (!src) return null;

  try {
    const trimmed = src.trim();
    const pathname = /^https?:\/\//i.test(trimmed)
      ? new URL(trimmed).pathname
      : trimmed.split("?")[0]?.split("#")[0] ?? "";

    const isLegacyPath = pathname.startsWith(RICHTEXT_IMAGE_PATH);
    const isSecurePath = pathname.startsWith(SECURE_RICHTEXT_IMAGE_PATH);
    if (!isLegacyPath && !isSecurePath) return null;

    const filename = decodeURIComponent(pathname.split("/").pop() ?? "").trim();
    if (!richtextImageFilenamePattern.test(filename)) return null;

    return `${isSecurePath ? SECURE_RICHTEXT_IMAGE_PATH : RICHTEXT_IMAGE_PATH}${filename}`;
  } catch {
    return null;
  }
}

function normalizeLinkAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  if (!attribs.href) return attribs;

  const relSet = new Set(
    String(attribs.rel ?? "")
      .split(" ")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  relSet.add("noopener");
  relSet.add("noreferrer");

  return {
    ...attribs,
    target: attribs.target ?? "_blank",
    rel: Array.from(relSet).join(" "),
  };
}

function normalizeAlignAttribute(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = { ...attribs };
  const alignment = String(next["data-align"] ?? "").trim().toLowerCase();

  if (safeAlignments.has(alignment)) {
    next["data-align"] = alignment;
  } else {
    delete next["data-align"];
  }

  return next;
}

function normalizeParagraphAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = normalizeAlignAttribute(attribs);
  const indent = Number(next["data-indent"]);
  const firstLineIndent = Number(next["data-first-line-indent"]);

  if (Number.isInteger(indent) && indent >= 1 && indent <= maxIndentLevel) {
    next["data-indent"] = String(indent);
  } else {
    delete next["data-indent"];
  }

  if (
    Number.isInteger(firstLineIndent) &&
    firstLineIndent >= 1 &&
    firstLineIndent <= maxIndentLevel
  ) {
    next["data-first-line-indent"] = String(firstLineIndent);
  } else {
    delete next["data-first-line-indent"];
  }

  return next;
}

function normalizeTableAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = { ...attribs };
  const width = String(next["data-table-width"] ?? "").trim();

  if (safeTableWidths.has(width)) {
    next["data-table-width"] = width;
  } else {
    delete next["data-table-width"];
  }

  return next;
}

function normalizeFigureAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = normalizeAlignAttribute(attribs);
  const width = String(next["data-width"] ?? "").trim();

  if (next["data-richtext-image"] === "true") {
    next["data-richtext-image"] = "true";
  } else {
    delete next["data-richtext-image"];
  }

  if (safeImageWidths.has(width)) {
    next["data-width"] = width;
  } else {
    delete next["data-width"];
  }

  return next;
}

function normalizeImageAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = { ...attribs };
  const safeSrc = normalizeRichtextImageSource(
    typeof next.src === "string" ? next.src : undefined,
  );

  if (safeSrc) {
    next.src = safeSrc;
  } else {
    delete next.src;
  }

  if (typeof next.alt === "string") {
    next.alt = (sanitizePlainText(next.alt) ?? "").slice(0, 512);
  }

  if (typeof next.title === "string") {
    next.title = (sanitizePlainText(next.title) ?? "").slice(0, 512);
  }

  return next;
}

function normalizeMathAttributes(attribs: sanitizeHtml.Attributes): sanitizeHtml.Attributes {
  const next = { ...attribs };
  const display = String(next["data-academic-math"] ?? "").trim().toLowerCase();

  if (safeMathDisplay.has(display)) {
    next["data-academic-math"] = display;
  } else {
    delete next["data-academic-math"];
  }

  if (typeof next["data-latex"] === "string") {
    next["data-latex"] = (sanitizePlainText(next["data-latex"]) ?? "").slice(0, 2000);
  } else {
    delete next["data-latex"];
  }

  return next;
}

export function sanitizePlainText(value: string | null): string | null {
  if (!value) return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function sanitizeRichText(value: string | null): string | null {
  if (!value) return value;

  return sanitizeHtml(value, {
    allowedTags: [...allowedTags],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title", "width", "height", "class"],
      figure: ["data-richtext-image", "data-align", "data-width", "class"],
      p: ["data-indent", "data-first-line-indent", "data-align", "class"],
      h1: ["data-align", "class"],
      h2: ["data-align", "class"],
      h3: ["data-align", "class"],
      h4: ["data-align", "class"],
      h5: ["data-align", "class"],
      h6: ["data-align", "class"],
      blockquote: ["data-align", "class"],
      q: ["data-academic-quote", "class"],
      span: ["data-academic-math", "data-latex", "class"],
      div: ["data-academic-math", "data-latex", "class"],
      table: ["data-table-width", "class"],
      th: ["colspan", "rowspan", "class"],
      td: ["colspan", "rowspan", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs?.src,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: normalizeLinkAttributes(attribs) }),
      p: (tagName, attribs) => ({ tagName, attribs: normalizeParagraphAttributes(attribs) }),
      h1: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      h2: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      h3: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      h4: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      h5: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      h6: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      blockquote: (tagName, attribs) => ({ tagName, attribs: normalizeAlignAttribute(attribs) }),
      figure: (tagName, attribs) => ({ tagName, attribs: normalizeFigureAttributes(attribs) }),
      img: (tagName, attribs) => ({ tagName, attribs: normalizeImageAttributes(attribs) }),
      table: (tagName, attribs) => ({ tagName, attribs: normalizeTableAttributes(attribs) }),
      span: (tagName, attribs) => ({
        tagName,
        attribs: attribs["data-academic-math"] ? normalizeMathAttributes(attribs) : attribs,
      }),
      div: (tagName, attribs) => ({
        tagName,
        attribs: attribs["data-academic-math"] ? normalizeMathAttributes(attribs) : attribs,
      }),
    },
  });
}
