import {
  ARCHIVE_IMAGE_FULL_MAX_EDGE,
  ARCHIVE_IMAGE_FULL_WEBP_QUALITY,
  ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE,
  ARCHIVE_IMAGE_THUMBNAIL_WEBP_QUALITY,
  archiveImageExtensionForMime,
  prepareArchiveImage,
  validateArchiveImageFile,
} from "~/utils/imageProcessing";

// Compatibility-first generic facade over the accepted Archive image pipeline.
// Existing Archive behavior remains unchanged while new surfaces can reuse the
// same validation, resize, WebP conversion and thumbnail contract without
// inheriting Archive-specific component/API semantics.
export const MANAGED_IMAGE_FULL_MAX_EDGE = ARCHIVE_IMAGE_FULL_MAX_EDGE;
export const MANAGED_IMAGE_THUMBNAIL_MAX_EDGE = ARCHIVE_IMAGE_THUMBNAIL_MAX_EDGE;
export const MANAGED_IMAGE_FULL_WEBP_QUALITY = ARCHIVE_IMAGE_FULL_WEBP_QUALITY;
export const MANAGED_IMAGE_THUMBNAIL_WEBP_QUALITY = ARCHIVE_IMAGE_THUMBNAIL_WEBP_QUALITY;

export const managedImageExtensionForMime = archiveImageExtensionForMime;
export const validateManagedImageFile = validateArchiveImageFile;
export const prepareManagedImage = prepareArchiveImage;
