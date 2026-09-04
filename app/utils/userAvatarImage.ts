import {
  closeDecodedImage,
  decodeImageFile,
  exportCanvasBlob,
  getDecodedImageSize,
  validateArchiveImageFile,
} from "~/utils/imageProcessing";

export const USER_AVATAR_SIZE = 400;
export const USER_AVATAR_WEBP_QUALITY = 0.6;

export type PreparedUserAvatar = {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
};

export async function prepareUserAvatarImage(file: File): Promise<PreparedUserAvatar> {
  const validation = validateArchiveImageFile(file);
  if (!validation.valid) {
    throw new Error(`Unsupported avatar image: ${validation.reason}`);
  }

  const image = await decodeImageFile(file);

  try {
    const source = getDecodedImageSize(image);
    const sourceSide = Math.min(source.width, source.height);
    const sourceX = Math.max(0, (source.width - sourceSide) / 2);
    const sourceY = Math.max(0, (source.height - sourceSide) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = USER_AVATAR_SIZE;
    canvas.height = USER_AVATAR_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is not available.");
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSide,
      sourceSide,
      0,
      0,
      USER_AVATAR_SIZE,
      USER_AVATAR_SIZE,
    );

    const blob = await exportCanvasBlob(
      canvas,
      "image/webp",
      USER_AVATAR_WEBP_QUALITY,
    );

    return {
      blob,
      width: USER_AVATAR_SIZE,
      height: USER_AVATAR_SIZE,
      sizeBytes: blob.size,
    };
  } finally {
    closeDecodedImage(image);
  }
}
