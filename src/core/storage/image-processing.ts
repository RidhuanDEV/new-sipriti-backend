import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { getUploadDir, toPublicUploadUrl } from "./storage-paths.js";
import { deleteFileSafe } from "./file-system.js";
import { generateUuidV7 } from "../../utils/uuid.js";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageSafeArea extends ImageDimensions {
  x: number;
  y: number;
}

export interface ImageValidationMetadata extends ImageDimensions {
  aspectRatio: string;
  safeArea?: ImageSafeArea;
}

export interface ProcessedImageInfo {
  filename: string;
  url: string;
  size: number;
  dimensions: ImageDimensions;
  metadata: ImageValidationMetadata;
}

interface AspectRatioConfig {
  target: number;
  minWidth: number;
  minHeight: number;
}

const desktopConfig: AspectRatioConfig = {
  target: 16 / 9,
  minWidth: 1440,
  minHeight: 810,
};

const mobileConfig: AspectRatioConfig = {
  target: 4 / 5,
  minWidth: 720,
  minHeight: 900,
};

const maxDimensions = {
  desktop: { width: 3840, height: 2160 },
  mobile: { width: 1440, height: 1800 },
};

const safeArea = {
  top: 0.1,
  bottom: 0.1,
  left: 0.05,
  right: 0.05,
};

function calculateSafeArea(width: number, height: number): ImageSafeArea {
  return {
    x: Math.floor(width * safeArea.left),
    y: Math.floor(height * safeArea.top),
    width: Math.floor(width * (1 - safeArea.left - safeArea.right)),
    height: Math.floor(height * (1 - safeArea.top - safeArea.bottom)),
  };
}

function getConfig(kind: "desktop" | "mobile"): AspectRatioConfig {
  return kind === "mobile" ? mobileConfig : desktopConfig;
}

function calculateCropBox(
  width: number,
  height: number,
  targetRatio: number,
): { left: number; top: number; width: number; height: number } | null {
  const currentRatio = width / height;
  if (Math.abs(currentRatio - targetRatio) < 0.01) return null;

  if (currentRatio > targetRatio) {
    const croppedWidth = Math.round(height * targetRatio);
    return {
      left: Math.max(0, Math.round((width - croppedWidth) / 2)),
      top: 0,
      width: croppedWidth,
      height,
    };
  }

  const croppedHeight = Math.round(width / targetRatio);
  return {
    left: 0,
    top: Math.max(0, Math.round((height - croppedHeight) / 2)),
    width,
    height: croppedHeight,
  };
}

export async function validateImageDimensions(
  filePath: string,
  kind: "desktop" | "mobile",
): Promise<ImageValidationMetadata> {
  const metadata = await sharp(filePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const config = getConfig(kind);
  const errors: string[] = [];

  if (width < config.minWidth) {
    errors.push(`Lebar minimal ${config.minWidth}px (saat ini: ${width}px)`);
  }

  if (height < config.minHeight) {
    errors.push(`Tinggi minimal ${config.minHeight}px (saat ini: ${height}px)`);
  }

  const aspectRatio = height > 0 ? (width / height).toFixed(2) : "0.00";
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  return {
    width,
    height,
    aspectRatio,
    safeArea: calculateSafeArea(width, height),
  };
}

export async function processLandingSliderImage(
  file: Express.Multer.File,
  kind: "desktop" | "mobile",
): Promise<ProcessedImageInfo> {
  const metadata = await validateImageDimensions(file.path, kind);
  const outputDir = getUploadDir("landing-slider");
  await fs.mkdir(outputDir, { recursive: true });

  const filename = generateWebpFilename(file.originalname, kind);
  const outputPath = path.join(outputDir, filename);
  const limit = maxDimensions[kind];
  const image = sharp(file.path);
  const cropBox = calculateCropBox(metadata.width, metadata.height, getConfig(kind).target);
  const pipeline = cropBox ? image.extract(cropBox) : image;
  const info = await pipeline
    .resize({
      width: limit.width,
      height: limit.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 90, effort: 6, lossless: false })
    .toFile(outputPath);

  await deleteFileSafe(file.path);

  return {
    filename,
    url: toPublicUploadUrl("landing-slider", filename),
    size: info.size,
    dimensions: {
      width: info.width,
      height: info.height,
    },
    metadata,
  };
}

function generateWebpFilename(_originalName: string, _prefix: "desktop" | "mobile"): string {
  return `${generateUuidV7()}.webp`;
}
