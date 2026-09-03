import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

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

  if (request.method === 'POST' && url.pathname === '/api/wizard-runs') {
    try {
      const body = await readJsonBody(request)

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        sendJson(
          response,
          400,
          {
            ok: false,
            message: 'JSON body must be an object',
          },
          corsHeaders,
        )
        return
      }

      const run = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...body,
      }

      sendJson(
        response,
        201,
        {
          ok: true,
          run,
        },
        corsHeaders,
      )
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
