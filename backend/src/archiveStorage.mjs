import { createHash, createHmac } from 'node:crypto'

const SERVICE = 's3'
const EMPTY_SHA256 = createHash('sha256').update('').digest('hex')

function readBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  return /^(1|true|yes|on)$/i.test(String(value).trim())
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function requireConfigValue(name, value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new Error(`${name} is required`)
  return normalized
}

function encodeS3Key(key) {
  return String(key)
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key, value, encoding) {
  return createHmac('sha256', key).update(value).digest(encoding)
}

function createAmzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function canonicalHeaderValue(value) {
  return String(value).trim().replace(/\s+/g, ' ')
}

function buildSignedHeaders(url, headers, payloadHash, date) {
  const amzDate = createAmzDate(date)
  const values = new Map([
    ['host', url.host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ])

  for (const [rawName, rawValue] of Object.entries(headers)) {
    const name = rawName.toLowerCase()
    if (name.startsWith('x-amz-')) values.set(name, canonicalHeaderValue(rawValue))
  }

  const names = [...values.keys()].sort()
  const canonicalHeaders = names
    .map((name) => `${name}:${canonicalHeaderValue(values.get(name))}\n`)
    .join('')

  return {
    amzDate,
    canonicalHeaders,
    signedHeaders: names.join(';'),
    requestHeaders: Object.fromEntries(
      [...values.entries()]
        .filter(([name]) => name !== 'host')
        .map(([name, value]) => [name, value]),
    ),
  }
}

export function getArchiveStorageConfig({ requireCredentials = true } = {}) {
  const endpoint = trimTrailingSlash(requireConfigValue(
    'ARCHIVE_S3_ENDPOINT',
    process.env.ARCHIVE_S3_ENDPOINT,
  ))
  const region = requireConfigValue('ARCHIVE_S3_REGION', process.env.ARCHIVE_S3_REGION)
  const bucket = requireConfigValue('ARCHIVE_S3_BUCKET', process.env.ARCHIVE_S3_BUCKET)
  const publicBaseUrl = trimTrailingSlash(
    (process.env.ARCHIVE_S3_PUBLIC_BASE_URL || '').trim() ||
    `${endpoint}/${encodeURIComponent(bucket)}`,
  )
  const forcePathStyle = readBoolean(process.env.ARCHIVE_S3_FORCE_PATH_STYLE, true)

  const accessKeyId = (process.env.ARCHIVE_S3_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.ARCHIVE_S3_SECRET_ACCESS_KEY || '').trim()

  if (requireCredentials) {
    requireConfigValue('ARCHIVE_S3_ACCESS_KEY_ID', accessKeyId)
    requireConfigValue('ARCHIVE_S3_SECRET_ACCESS_KEY', secretAccessKey)
  }

  return {
    endpoint,
    region,
    bucket,
    publicBaseUrl,
    forcePathStyle,
    accessKeyId,
    secretAccessKey,
  }
}

export function getArchiveStoragePublicUrl(key, config = getArchiveStorageConfig({ requireCredentials: false })) {
  const encodedKey = encodeS3Key(key)
  return encodedKey ? `${config.publicBaseUrl}/${encodedKey}` : config.publicBaseUrl
}

export function getArchiveStorageRequestUrl(key = null, config = getArchiveStorageConfig()) {
  const endpoint = new URL(config.endpoint)
  const encodedKey = key ? encodeS3Key(key) : ''

  if (config.forcePathStyle) {
    const prefix = endpoint.pathname.replace(/\/+$/, '')
    endpoint.pathname = `${prefix}/${encodeURIComponent(config.bucket)}${encodedKey ? `/${encodedKey}` : ''}`
    return endpoint
  }

  // Virtual-host mode expects ARCHIVE_S3_ENDPOINT to already identify the bucket host.
  const prefix = endpoint.pathname.replace(/\/+$/, '')
  endpoint.pathname = `${prefix}${encodedKey ? `/${encodedKey}` : '/'}`
  return endpoint
}

export function signArchiveStorageRequest({
  method,
  url,
  body = null,
  headers = {},
  date = new Date(),
  config = getArchiveStorageConfig(),
}) {
  const bodyBuffer = body === null || body === undefined
    ? Buffer.alloc(0)
    : Buffer.isBuffer(body)
      ? body
      : Buffer.from(body)
  const payloadHash = bodyBuffer.length ? sha256Hex(bodyBuffer) : EMPTY_SHA256
  const {
    amzDate,
    canonicalHeaders,
    signedHeaders,
    requestHeaders,
  } = buildSignedHeaders(url, headers, payloadHash, date)
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${config.region}/${SERVICE}/aws4_request`
  const canonicalRequest = [
    method.toUpperCase(),
    url.pathname || '/',
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, config.region)
  const serviceKey = hmac(regionKey, SERVICE)
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = hmac(signingKey, stringToSign, 'hex')

  return {
    bodyBuffer,
    headers: {
      ...headers,
      ...requestHeaders,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  }
}

export async function requestArchiveStorage({
  method,
  key = null,
  body = null,
  headers = {},
  config = getArchiveStorageConfig(),
}) {
  const url = getArchiveStorageRequestUrl(key, config)
  const signed = signArchiveStorageRequest({ method, url, body, headers, config })
  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase()) && signed.bodyBuffer.length > 0

  return fetch(url, {
    method,
    headers: signed.headers,
    body: hasBody ? signed.bodyBuffer : undefined,
  })
}

export async function readStorageError(response) {
  let body = ''
  try {
    body = await response.text()
  } catch {
    // Ignore secondary body read failures.
  }

  const suffix = body.trim() ? `: ${body.trim().slice(0, 1000)}` : ''
  return new Error(`Archive storage request failed (${response.status} ${response.statusText})${suffix}`)
}
