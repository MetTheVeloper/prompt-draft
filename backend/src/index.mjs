import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import {
  getDatabaseStatus,
  insertWizardRun,
  listWizardRuns,
} from './database.mjs'

const host = process.env.HOST ?? '0.0.0.0'
const port = Number(process.env.PORT ?? 4000)

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? 'http://localhost:3030,http://127.0.0.1:3030')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

function getCorsHeaders(request) {
  const origin = request.headers.origin

  if (!origin || !allowedOrigins.has(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function sendJson(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(rawBody)
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()
  return mediaType === 'application/json'
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateWizardRunInput(body) {
  const errors = []

  if (!isPlainObject(body)) {
    return [
      {
        field: 'body',
        message: 'JSON body must be an object',
      },
    ]
  }

  if (typeof body.wizardId !== 'string' || body.wizardId.trim().length === 0) {
    errors.push({
      field: 'wizardId',
      message: 'wizardId must be a non-empty string',
    })
  }

  if (!Number.isInteger(body.wizardVersion) || body.wizardVersion <= 0) {
    errors.push({
      field: 'wizardVersion',
      message: 'wizardVersion must be a positive integer',
    })
  }

  if (typeof body.output !== 'string' || body.output.trim().length === 0) {
    errors.push({
      field: 'output',
      message: 'output must be a non-empty string',
    })
  }

  if (!isPlainObject(body.snapshot)) {
    errors.push({
      field: 'snapshot',
      message: 'snapshot must be an object',
    })
  }

  return errors
}

function createWizardRun(body) {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    wizardId: body.wizardId.trim(),
    wizardVersion: body.wizardVersion,
    output: body.output,
    snapshot: body.snapshot,
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  )

  const corsHeaders = getCorsHeaders(request)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders)
    response.end()
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/hello') {
    sendJson(
      response,
      200,
      {
        ok: true,
        message: 'Hello from Prompt Draft API',
      },
      corsHeaders,
    )
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/db-check') {
    try {
      const databaseStatus = await getDatabaseStatus()

      sendJson(
        response,
        200,
        {
          ok: true,
          database: databaseStatus.database,
          user: databaseStatus.user,
          serverTime: databaseStatus.serverTime,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] database check failed', error)

      sendJson(
        response,
        503,
        {
          ok: false,
          message: 'Database unavailable',
        },
        corsHeaders,
      )
    }

    return
  }

  if (request.method === 'GET' && url.pathname === '/api/wizard-runs') {
    try {
      const runs = await listWizardRuns()

      sendJson(
        response,
        200,
        {
          ok: true,
          count: runs.length,
          runs,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] wizard run list failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to list Wizard runs',
        },
        corsHeaders,
      )
    }

    return
  }

  if (request.method === 'POST' && url.pathname === '/api/wizard-runs') {
    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        {
          ok: false,
          message: 'Content-Type must be application/json',
        },
        corsHeaders,
      )
      return
    }

    let body

    try {
      body = await readJsonBody(request)
    } catch {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Request body must contain valid JSON',
        },
        corsHeaders,
      )
      return
    }

    const validationErrors = validateWizardRunInput(body)

    if (validationErrors.length > 0) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        corsHeaders,
      )
      return
    }

    const run = createWizardRun(body)

    try {
      const savedRun = await insertWizardRun(run)

      sendJson(
        response,
        201,
        {
          ok: true,
          run: savedRun,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] wizard run insert failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to create Wizard run',
        },
        corsHeaders,
      )
    }

    return
  }

  sendJson(
    response,
    404,
    {
      ok: false,
      message: 'Not Found',
    },
    corsHeaders,
  )
})

server.listen(port, host, () => {
  console.log(`Prompt Draft API listening on http://${host}:${port}`)
})
