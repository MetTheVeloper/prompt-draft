import { randomUUID } from 'node:crypto'
import {
  getArchiveStorageConfig,
  getArchiveStoragePublicUrl,
  readStorageError,
  requestArchiveStorage,
} from './archiveStorage.mjs'

function expectOk(response, step) {
  if (!response.ok) {
    throw Object.assign(new Error(`${step} failed with HTTP ${response.status}`), {
      response,
      step,
    })
  }
}

async function run() {
  const config = getArchiveStorageConfig()
  const publicRead = /^(1|true|yes|on)$/i.test(process.env.ARCHIVE_S3_SMOKE_PUBLIC_READ || '')
  const key = `_prompt-draft-capability/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.txt`
  const payload = Buffer.from(`Prompt Draft Arvan storage capability ${new Date().toISOString()}\n`, 'utf8')
  const steps = []
  let uploaded = false

  const record = (name, response, extra = {}) => {
    steps.push({ name, status: response.status, ok: response.ok, ...extra })
  }

  try {
    let response = await requestArchiveStorage({ method: 'HEAD', config })
    record('HeadBucket', response)
    expectOk(response, 'HeadBucket')

    response = await requestArchiveStorage({
      method: 'PUT',
      key,
      body: payload,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(publicRead ? { 'x-amz-acl': 'public-read' } : {}),
      },
      config,
    })
    record('PutObject', response)
    expectOk(response, 'PutObject')
    uploaded = true

    response = await requestArchiveStorage({ method: 'HEAD', key, config })
    record('HeadObject', response, {
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type'),
    })
    expectOk(response, 'HeadObject')

    response = await requestArchiveStorage({ method: 'GET', key, config })
    expectOk(response, 'GetObject')
    const signedBody = Buffer.from(await response.arrayBuffer())
    const signedMatches = signedBody.equals(payload)
    record('GetObject', response, { bodyMatches: signedMatches })
    if (!signedMatches) throw new Error('GetObject returned content different from PutObject payload')

    if (publicRead) {
      const publicUrl = getArchiveStoragePublicUrl(key, config)
      response = await fetch(publicUrl)
      const publicBody = response.ok ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0)
      const publicMatches = response.ok && publicBody.equals(payload)
      record('PublicGet', response, { bodyMatches: publicMatches, url: publicUrl })
      if (!response.ok || !publicMatches) {
        throw new Error(`PublicGet failed (${response.status}); check bucket/object public-read policy`)
      }
    }
  } catch (error) {
    if (error?.response) {
      const detailed = await readStorageError(error.response)
      detailed.cause = error
      throw detailed
    }
    throw error
  } finally {
    if (uploaded) {
      try {
        const response = await requestArchiveStorage({ method: 'DELETE', key, config })
        record('DeleteObject', response)
        if (!response.ok && response.status !== 204) {
          console.error('[archive storage smoke] cleanup failed', await readStorageError(response))
        }
      } catch (error) {
        console.error('[archive storage smoke] cleanup request failed', error)
      }
    }
  }

  const safeConfig = {
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl,
    forcePathStyle: config.forcePathStyle,
    accessKeyConfigured: Boolean(config.accessKeyId),
    secretKeyConfigured: Boolean(config.secretAccessKey),
    publicReadTestEnabled: publicRead,
  }

  console.log(JSON.stringify({
    archiveStorageCapability: 'OK',
    config: safeConfig,
    testKey: key,
    steps,
  }, null, 2))
}

run().catch((error) => {
  console.error(JSON.stringify({
    archiveStorageCapability: 'FAILED',
    message: error?.message || String(error),
  }, null, 2))
  process.exitCode = 1
})
