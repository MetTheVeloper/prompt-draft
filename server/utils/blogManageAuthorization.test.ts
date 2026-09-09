import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOG_MANAGE_PERMISSION,
  checkBlogManageAuthorization,
  hasBlogManagePermission,
} from './blogManageAuthorization'

test('Blog Nitro authorization accepts only explicit permission or wildcard', () => {
  assert.equal(BLOG_MANAGE_PERMISSION, 'blog.manage')
  assert.equal(hasBlogManagePermission(['blog.manage']), true)
  assert.equal(hasBlogManagePermission(['*']), true)
  assert.equal(hasBlogManagePermission(['archive.manage']), false)
  assert.equal(hasBlogManagePermission(null), false)
})

test('missing bearer token is rejected before upstream auth lookup', async () => {
  let calls = 0
  const result = await checkBlogManageAuthorization({
    authorization: '',
    apiBase: 'http://api:4000',
    fetchImpl: async () => {
      calls += 1
      return new Response('{}', { status: 200 })
    },
  })

  assert.deepEqual(result, {
    ok: false,
    statusCode: 401,
    statusMessage: 'Authentication required',
  })
  assert.equal(calls, 0)
})

test('backend auth response with blog.manage authorizes repository access', async () => {
  const result = await checkBlogManageAuthorization({
    authorization: 'Bearer admin-token',
    apiBase: 'http://api:4000',
    fetchImpl: async (input, init) => {
      assert.equal(String(input), 'http://api:4000/api/auth/me')
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer admin-token')
      return new Response(JSON.stringify({ permissions: ['blog.manage'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })

  assert.deepEqual(result, { ok: true })
})

test('authenticated user without Blog permission receives 403', async () => {
  const result = await checkBlogManageAuthorization({
    authorization: 'Bearer user-token',
    apiBase: 'http://api:4000',
    fetchImpl: async () => new Response(JSON.stringify({ permissions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  })

  assert.deepEqual(result, { ok: false, statusCode: 403, statusMessage: 'Forbidden' })
})

test('upstream authorization failures fail closed', async () => {
  const result = await checkBlogManageAuthorization({
    authorization: 'Bearer token',
    apiBase: 'http://api:4000',
    fetchImpl: async () => new Response('{}', { status: 500 }),
  })

  assert.deepEqual(result, {
    ok: false,
    statusCode: 502,
    statusMessage: 'Authorization service is unavailable',
  })
})
