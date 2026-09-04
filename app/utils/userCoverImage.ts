import {
  closeDecodedImage,
  decodeImageFile,
  exportCanvasBlob,
  getDecodedImageSize,
  renderImageToCanvas,
  resizeWithinBounds,
  validateArchiveImageFile,
} from "~/utils/imageProcessing";

export const USER_COVER_FULL_MAX_EDGE = 2048;
export const USER_COVER_THUMBNAIL_MAX_EDGE = 640;
export const USER_COVER_FULL_WEBP_QUALITY = 0.6;
export const USER_COVER_THUMBNAIL_WEBP_QUALITY = 0.72;

export type PreparedUserCover = {
  fullBlob: Blob;
  fullWidth: number;
  fullHeight: number;
  fullSizeBytes: number;
  thumbnailBlob: Blob;
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
};

export async function prepareUserCoverImage(file: File): Promise<PreparedUserCover> {
  const validation = validateArchiveImageFile(file);
  if (!validation.valid) {
    throw new Error(`Unsupported cover image: ${validation.reason}`);
  }

  const image = await decodeImageFile(file);

  try {
    const source = getDecodedImageSize(image);
    const fullSize = resizeWithinBounds(
      source.width,
      source.height,
      USER_COVER_FULL_MAX_EDGE,
    );
    const thumbnailSize = resizeWithinBounds(
      source.width,
      source.height,
      USER_COVER_THUMBNAIL_MAX_EDGE,
    );

    const fullCanvas = renderImageToCanvas(
      image,
      fullSize.width,
      fullSize.height,
    );
    const thumbnailCanvas = renderImageToCanvas(
      image,
      thumbnailSize.width,
      thumbnailSize.height,
    );

    const [fullBlob, thumbnailBlob] = await Promise.all([
      exportCanvasBlob(
        fullCanvas,
        "image/webp",
        USER_COVER_FULL_WEBP_QUALITY,
      ),
      exportCanvasBlob(
        thumbnailCanvas,
        "image/webp",
        USER_COVER_THUMBNAIL_WEBP_QUALITY,
      ),
    ]);

    return {
      fullBlob,
      fullWidth: fullSize.width,
      fullHeight: fullSize.height,
      fullSizeBytes: fullBlob.size,
      thumbnailBlob,
      thumbnailWidth: thumbnailSize.width,
      thumbnailHeight: thumbnailSize.height,
      thumbnailSizeBytes: thumbnailBlob.size,
    };
  } finally {
    closeDecodedImage(image);
  }
}
