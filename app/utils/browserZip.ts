import type { ImageConverterZipEntry } from '~/types/imageConverter'

const textEncoder = new TextEncoder()
let crcTable: Uint32Array | null = null

function getCrcTable() {
  if (crcTable) return crcTable

  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }

    table[index] = value >>> 0
  }

  crcTable = table

  return table
}

function crc32(data: Uint8Array) {
  const table = getCrcTable()
  let crc = 0xffffffff

  for (let index = 0; index < data.length; index += 1) {
    crc = table[(crc ^ data[index]) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff]
}

function uint32(value: number) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]
}

function getDosDateTime(value?: number) {
  const date = value ? new Date(value) : new Date()

  const year = Math.max(1980, date.getFullYear())
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate()

  return {
    dosDate,
    dosTime,
  }
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    output.set(chunk, offset)
    offset += chunk.length
  })

  return output
}

async function toUint8Array(data: Blob | ArrayBuffer | Uint8Array) {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)

  return new Uint8Array(await data.arrayBuffer())
}

function normalizeZipFileName(name: string, fallbackIndex: number) {
  const fallback = `file-${fallbackIndex + 1}`

  return (name || fallback)
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\.{2,}/g, '.')
    .trim() || fallback
}

export async function createZipBlob(entries: ImageConverterZipEntry[]) {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const name = normalizeZipFileName(entry.name, index)
    const nameBytes = textEncoder.encode(name)
    const data = await toUint8Array(entry.data)
    const crc = crc32(data)
    const { dosDate, dosTime } = getDosDateTime(entry.lastModified)

    if (data.length > 0xffffffff || offset > 0xffffffff) {
      throw new Error('ZIP64 is not supported by this lightweight browser ZIP writer.')
    }

    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(dosTime),
      ...uint16(dosDate),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
    ])

    localChunks.push(localHeader, nameBytes, data)

    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(dosTime),
      ...uint16(dosDate),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
    ])

    centralChunks.push(centralHeader, nameBytes)

    offset += localHeader.length + nameBytes.length + data.length
  }

  const centralDirectory = concatBytes(centralChunks)
  const centralOffset = offset

  const endRecord = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(entries.length),
    ...uint16(entries.length),
    ...uint32(centralDirectory.length),
    ...uint32(centralOffset),
    ...uint16(0),
  ])

  return new Blob([
    concatBytes(localChunks),
    centralDirectory,
    endRecord,
  ], {
    type: 'application/zip',
  })
}
