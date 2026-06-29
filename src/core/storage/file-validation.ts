import path from "node:path";

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export interface UploadFileMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

interface MagicByteVariant {
  bytes: ReadonlyArray<number>;
  offset: number;
}

export const DANGEROUS_EXTENSIONS: ReadonlySet<string> = new Set([
  ".php",
  ".php3",
  ".php4",
  ".php5",
  ".php7",
  ".phtml",
  ".phar",
  ".asp",
  ".aspx",
  ".jsp",
  ".jspx",
  ".cgi",
  ".pl",
  ".py",
  ".rb",
  ".lua",
  ".sh",
  ".bash",
  ".zsh",
  ".ksh",
  ".csh",
  ".bat",
  ".cmd",
  ".ps1",
  ".psm1",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".msi",
  ".com",
  ".scr",
  ".pif",
  ".jar",
  ".war",
  ".ear",
  ".class",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".htaccess",
  ".htpasswd",
  ".env",
  ".ini",
  ".conf",
  ".config",
  ".ejs",
  ".pug",
  ".hbs",
  ".twig",
  ".jinja",
  ".jinja2",
  ".svg",
  ".sql",
  ".xml",
  ".html",
  ".htm",
  ".xhtml",
  ".shtml",
]);

export const DEFAULT_ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const MAGIC_BYTE_SIGNATURES: Record<string, ReadonlyArray<MagicByteVariant>> = {
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }],
  "application/msword": [
    {
      bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
      offset: 0,
    },
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0 },
  ],
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  "image/jpg": [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }],
  "image/png": [
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  ],
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 },
  ],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }],
  "image/avif": [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  "image/heic": [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  "image/heif": [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
};

function ok(): FileValidationResult {
  return { valid: true };
}

function fail(reason: string): FileValidationResult {
  return { valid: false, reason };
}

export function validateFileExtension(
  filename: string,
  allowedExtensions?: ReadonlySet<string>,
): FileValidationResult {
  const normalizedName = filename.toLowerCase().trim();
  if (!normalizedName) {
    return fail("Nama file tidak boleh kosong");
  }

  for (const part of normalizedName.split(".").slice(1)) {
    const extension = `.${part}`;
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      return fail(`File mengandung ekstensi berbahaya: ${extension}`);
    }
  }

  const extension = path.extname(normalizedName);
  if (allowedExtensions && !allowedExtensions.has(extension)) {
    return fail(`Ekstensi file ${extension || "-"} tidak diperbolehkan`);
  }

  return ok();
}

export function validateMimeType(
  mimeType: string,
  allowedMimes: ReadonlySet<string> = DEFAULT_ALLOWED_MIME_TYPES,
): FileValidationResult {
  if (!allowedMimes.has(mimeType)) {
    return fail(`Tipe file ${mimeType} tidak diperbolehkan`);
  }

  return ok();
}

export function validateFileSize(
  sizeBytes: number,
  maxSizeBytes: number,
): FileValidationResult {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return fail("Ukuran file tidak valid");
  }

  if (sizeBytes > maxSizeBytes) {
    return fail(`Ukuran file melebihi batas ${maxSizeBytes} byte`);
  }

  return ok();
}

function matchesVariant(
  buffer: Uint8Array,
  variant: MagicByteVariant,
): boolean {
  if (buffer.length < variant.offset + variant.bytes.length) {
    return false;
  }

  return variant.bytes.every(
    (byte, index) => buffer[variant.offset + index] === byte,
  );
}

export function validateMagicBytes(
  buffer: Uint8Array,
  claimedMimeType: string,
): FileValidationResult {
  const signatures = MAGIC_BYTE_SIGNATURES[claimedMimeType];
  if (!signatures) {
    return ok();
  }

  if (signatures.some((signature) => matchesVariant(buffer, signature))) {
    return ok();
  }

  return fail(
    `Konten file tidak sesuai dengan tipe ${claimedMimeType}. File mungkin telah dimanipulasi.`,
  );
}

export function validateUploadFileMetadata(
  file: UploadFileMetadata,
  options: {
    allowedMimes?: ReadonlySet<string>;
    allowedExtensions?: ReadonlySet<string>;
    maxSizeBytes?: number;
  } = {},
): FileValidationResult {
  const extensionResult = validateFileExtension(
    file.originalName,
    options.allowedExtensions,
  );
  if (!extensionResult.valid) return extensionResult;

  const mimeResult = validateMimeType(file.mimeType, options.allowedMimes);
  if (!mimeResult.valid) return mimeResult;

  if (options.maxSizeBytes !== undefined) {
    const sizeResult = validateFileSize(file.sizeBytes, options.maxSizeBytes);
    if (!sizeResult.valid) return sizeResult;
  }

  return ok();
}
