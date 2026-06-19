import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Media } from '@capacitor-community/media'

import {
  blobToDataUrl,
} from '~/utils/collage/file'

type NativeShareFileOptions = {
  fileName: string
  title: string
  text: string
  dialogTitle: string
}

type NativeGallerySaveOptions = {
  albumName?: string
  fileName: string
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform()
}

export async function writeBlobToNativeCache(
  blob: Blob,
  fileName: string
) {
  const dataUrl = await blobToDataUrl(blob)
  const base64 = dataUrl.split(',')[1] || ''

  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })

  return result.uri
}

export async function shareBlobNative(
  blob: Blob,
  options: NativeShareFileOptions
) {
  const uri = await writeBlobToNativeCache(blob, options.fileName)

  await Share.share({
    title: options.title,
    text: options.text,
    files: [uri],
    dialogTitle: options.dialogTitle,
  })
}

async function getOrCreateNativeAlbumIdentifier(albumName: string) {
  const currentAlbums = await Media.getAlbums()
  const existingAlbum = currentAlbums.albums.find(
    (album) => album.name === albumName
  )

  if (existingAlbum) {
    return existingAlbum.identifier
  }

  await Media.createAlbum({
    name: albumName,
  })

  const updatedAlbums = await Media.getAlbums()
  const createdAlbum = updatedAlbums.albums.find(
    (album) => album.name === albumName
  )

  if (!createdAlbum) {
    throw new Error(`Could not create ${albumName} album`)
  }

  return createdAlbum.identifier
}

export async function savePhotoBlobToGalleryNative(
  blob: Blob,
  options: NativeGallerySaveOptions
) {
  const dataUrl = await blobToDataUrl(blob)
  const albumIdentifier = await getOrCreateNativeAlbumIdentifier(
    options.albumName || 'Prompt Draft'
  )

  await Media.savePhoto({
    path: dataUrl,
    albumIdentifier,
    fileName: options.fileName,
  })
}