import type {
  AdminManagedImageUploadResponse,
  AdminManagedMediaScope,
} from "~/types/adminManagedMediaApi";
import type { PreparedManagedImage } from "~/types/managedImage";

function normalizeApiBase(value: unknown) {
  const base = typeof value === "string" ? value.trim() : "";
  return base.replace(/\/+$/, "");
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error("Could not encode managed image."));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read managed image."));
    reader.readAsDataURL(blob);
  });
}

export function useAdminManagedMedia() {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const apiBase = normalizeApiBase(config.public.apiBase);

  function endpoint(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
  }

  async function uploadPreparedImage(
    scope: AdminManagedMediaScope,
    image: PreparedManagedImage,
  ) {
    if (
      image.status !== "ready" ||
      !image.fullBlob ||
      !image.thumbnailBlob ||
      !image.fullWidth ||
      !image.fullHeight ||
      !image.thumbnailWidth ||
      !image.thumbnailHeight ||
      image.fullSize == null ||
      image.thumbnailSize == null
    ) {
      throw new Error("Prepared managed image is incomplete.");
    }

    return $fetch<AdminManagedImageUploadResponse>(
      endpoint("/api/admin/media/images"),
      {
        method: "POST",
        headers: auth.authHeaders(),
        body: {
          scope,
          sourceName: image.sourceName,
          full: {
            base64: await blobToBase64(image.fullBlob),
            width: image.fullWidth,
            height: image.fullHeight,
            sizeBytes: image.fullSize,
          },
          thumbnail: {
            base64: await blobToBase64(image.thumbnailBlob),
            width: image.thumbnailWidth,
            height: image.thumbnailHeight,
            sizeBytes: image.thumbnailSize,
          },
        },
      },
    );
  }

  return { uploadPreparedImage };
}
