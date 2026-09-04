import type { PreparedArchiveImageOutput } from "~/types/archiveImage";

export const ARCHIVE_IMAGE_FULL_MAX_EDGE = 2048;
export const ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE = 640;
export const ARCHIVE_IMAGE_FULL_WEBP_QUALITY = 0.6;
export const ARCHIVE_IMAGE_THUMBNAIL_WEBP_QUALITY = 0.72;

export type BrowserImageOutputFormat = "webp" | "jpg";
export type DecodedBrowserImage = ImageBitmap | HTMLImageElement;

const ARCHIVE_IMAGE_MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export function archiveImageExtensionForMime(mimeType: string) {
  return ARCHIVE_IMAGE_MIME_TO_EXTENSIONS[mimeType]?.[0] ?? null;
}

export function validateArchiveImageFile(file: File) {
  const allowedExtensions = ARCHIVE_IMAGE_MIME_TO_EXTENSIONS[file.type];

  if (!allowedExtensions) {
    return {
      valid: false as const,
      reason: "unsupported-mime" as const,
    };
  }

  const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? "";
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false as const,
      reason: "extension-mismatch" as const,
    };
  }

  return { valid: true as const };
}

export function resizeWithinBounds(
  sourceWidth: number,
  sourceHeight: number,
  maxEdge: number,
) {
  const width = Math.max(1, Math.round(sourceWidth));
  const height = Math.max(1, Math.round(sourceHeight));
  const safeMaxEdge = Math.max(1, Math.round(maxEdge));
  const scale = Math.min(1, safeMaxEdge / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function decodeImageFile(file: Blob & { name?: string }) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
    } catch {
      // HTMLImageElement is the compatibility fallback for browsers/formats
      // that createImageBitmap cannot decode reliably.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Cannot decode ${file.name || "image"}`));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function getDecodedImageSize(image: DecodedBrowserImage) {
  return {
    width: image.width,
    height: image.height,
  };
}

export function closeDecodedImage(image: DecodedBrowserImage) {
  if ("close" in image && typeof image.close === "function") {
    image.close();
  }
}

export function renderImageToCanvas(
  image: DecodedBrowserImage,
  width: number,
  height: number,
  options: { background?: string } = {},
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not available.");
  }

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function exportCanvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/webp" | "image/jpeg",
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (output) => {
        if (output) {
          resolve(output);
        } else {
          reject(new Error("Canvas export failed."));
        }
      },
      mimeType,
      Math.min(1, Math.max(0, quality)),
    );
  });
}

function outputMimeType(format: BrowserImageOutputFormat) {
  return format === "jpg" ? "image/jpeg" as const : "image/webp" as const;
}

export async function convertImageFile(
  file: File,
  options: {
    format: BrowserImageOutputFormat;
    quality: number;
    maxEdge?: number | null;
  },
) {
  const image = await decodeImageFile(file);

  try {
    const source = getDecodedImageSize(image);
    const target = options.maxEdge
      ? resizeWithinBounds(source.width, source.height, options.maxEdge)
      : source;
    const canvas = renderImageToCanvas(
      image,
      target.width,
      target.height,
      options.format === "jpg" ? { background: "#ffffff" } : {},
    );
    const blob = await exportCanvasBlob(
      canvas,
      outputMimeType(options.format),
      options.quality,
    );

    return {
      blob,
      width: target.width,
      height: target.height,
    };
  } finally {
    closeDecodedImage(image);
  }
}

export async function prepareArchiveImage(
  file: File,
): Promise<PreparedArchiveImageOutput> {
  const validation = validateArchiveImageFile(file);
  if (!validation.valid) {
    throw new Error(`Unsupported Archive image: ${validation.reason}`);
  }

  const image = await decodeImageFile(file);

  try {
    const source = getDecodedImageSize(image);
    const fullSize = resizeWithinBounds(
      source.width,
      source.height,
      ARCHIVE_IMAGE_FULL_MAX_EDGE,
    );
    const thumbnailSize = resizeWithinBounds(
      source.width,
      source.height,
      ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE,
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
        ARCHIVE_IMAGE_FULL_WEBP_QUALITY,
      ),
      exportCanvasBlob(
        thumbnailCanvas,
        "image/webp",
        ARCHIVE_IMAGE_THUMBNAIL_WEBP_QUALITY,
      ),
    ]);

    return {
      fullBlob,
      fullWidth: fullSize.width,
      fullHeight: fullSize.height,
      fullSize: fullBlob.size,
      thumbnailBlob,
      thumbnailWidth: thumbnailSize.width,
      thumbnailHeight: thumbnailSize.height,
      thumbnailSize: thumbnailBlob.size,
    };
  } finally {
    closeDecodedImage(image);
  }
}
