export type AdminManagedMediaScope = "telegram";

export type AdminManagedImage = {
  id: string;
  scope: AdminManagedMediaScope;
  fullUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
  sizeBytes: number;
  thumbnailSizeBytes: number;
};

export type AdminManagedImageUploadResponse = {
  ok: true;
  image: AdminManagedImage;
};
