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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

const server = createServer((request, response) => {
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
    response.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    })

    response.end(
      JSON.stringify({
        ok: true,
        message: 'Hello from Prompt Draft API',
      }),
    )

    return
  }

  response.writeHead(404, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  })

  response.end(
    JSON.stringify({
      ok: false,
      message: 'Not Found',
    }),
  )
})

server.listen(port, host, () => {
  console.log(`Prompt Draft API listening on http://${host}:${port}`)
})
