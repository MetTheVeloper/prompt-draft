import assert from 'node:assert/strict'
import test from 'node:test'
import { validateBlogPublicationAuditPayload } from './adminBlogPublicationAudit.mjs'

const validPayload = {
  action: 'publish',
  articleId: 'first-blog-article',
  slug: 'first-blog-article',
  status: 'published',
  commitSha: 'a'.repeat(40),
  branch: 'feature/growth-foundation',
}

test('Blog publication audit accepts only the strict public-safe receipt shape', () => {
  assert.equal(validateBlogPublicationAuditPayload(validPayload), true)
  assert.equal(validateBlogPublicationAuditPayload({ ...validPayload, body: 'private content' }), false)
  assert.equal(validateBlogPublicationAuditPayload({ ...validPayload, commitSha: 'not-a-sha' }), false)
  assert.equal(validateBlogPublicationAuditPayload({ ...validPayload, branch: '../main' }), false)
  assert.equal(validateBlogPublicationAuditPayload({ ...validPayload, action: 'delete' }), false)
})
