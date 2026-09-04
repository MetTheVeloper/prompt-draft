export type ArchiveImageProcessingStatus =
  | "processing"
  | "ready"
  | "error";

export type PreparedArchiveImage = {
  id: string;
  sourceFile: File;
  sourceName: string;
  sourceSize: number;
  fullBlob: Blob | null;
  fullWidth: number | null;
  fullHeight: number | null;
  fullSize: number | null;
  thumbnailBlob: Blob | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  thumbnailSize: number | null;
  previewUrl: string | null;
  thumbnailPreviewUrl: string | null;
  position: number;
  status: ArchiveImageProcessingStatus;
  error: string | null;
};

export type PreparedArchiveImageOutput = {
  fullBlob: Blob;
  fullWidth: number;
  fullHeight: number;
  fullSize: number;
  thumbnailBlob: Blob;
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSize: number;
};
