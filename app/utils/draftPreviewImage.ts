import {
  closeDecodedImage,
  decodeImageFile,
  exportCanvasBlob,
  getDecodedImageSize,
  renderImageToCanvas,
  validateArchiveImageFile,
} from "~/utils/imageProcessing";

export const DRAFT_PREVIEW_IMAGE_WEBP_QUALITY = 0.6;
export const DRAFT_PREVIEW_IMAGE_MAX_COUNT = 8;
export const DRAFT_PREVIEW_IMAGE_MAX_EDGE = 8192;
export const DRAFT_PREVIEW_IMAGE_MAX_PIXELS = 40_000_000;
export const DRAFT_PREVIEW_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

export type PreparedDraftPreviewImage = {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
};

export async function prepareDraftPreviewImage(
  file: File,
): Promise<PreparedDraftPreviewImage> {
  const validation = validateArchiveImageFile(file);
  if (!validation.valid) {
    throw new Error(`Unsupported Draft preview image: ${validation.reason}`);
  }

  const image = await decodeImageFile(file);

  try {
    const source = getDecodedImageSize(image);
    const width = Math.max(1, Math.round(source.width));
    const height = Math.max(1, Math.round(source.height));

    if (
      Math.max(width, height) > DRAFT_PREVIEW_IMAGE_MAX_EDGE ||
      width * height > DRAFT_PREVIEW_IMAGE_MAX_PIXELS
    ) {
      throw new Error("Draft preview image dimensions are too large.");
    }

    // Intentionally render at the decoded source dimensions. Draft preview media
    // must preserve the original pixel dimensions: no crop and no silent resize.
    const canvas = renderImageToCanvas(image, width, height);
    const blob = await exportCanvasBlob(
      canvas,
      "image/webp",
      DRAFT_PREVIEW_IMAGE_WEBP_QUALITY,
    );

    if (blob.size > DRAFT_PREVIEW_IMAGE_MAX_BYTES) {
      throw new Error("Draft preview image is too large after WebP conversion.");
    }

    return {
      blob,
      width,
      height,
      sizeBytes: blob.size,
    };
  } finally {
    closeDecodedImage(image);
  }
}
