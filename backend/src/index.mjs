import { createServer } from 'node:http'

const host = process.env.HOST ?? '0.0.0.0'
const port = Number(process.env.PORT ?? 4000)

const server = createServer((request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  )

  if (request.method === 'GET' && url.pathname === '/api/hello') {
    response.writeHead(200, {
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
