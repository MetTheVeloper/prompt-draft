import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PERMISSIONS,
  hasPermission,
  resolvePermissionsForRole,
} from './authorization.mjs'

test('Blog management has one explicit permission key', () => {
  assert.equal(PERMISSIONS.BLOG_MANAGE, 'blog.manage')
})

test('admin receives Blog management while normal users do not', () => {
  assert.equal(resolvePermissionsForRole('admin').includes(PERMISSIONS.BLOG_MANAGE), true)
  assert.equal(resolvePermissionsForRole('user').includes(PERMISSIONS.BLOG_MANAGE), false)
  assert.equal(hasPermission({ role: 'admin' }, PERMISSIONS.BLOG_MANAGE), true)
  assert.equal(hasPermission({ role: 'user' }, PERMISSIONS.BLOG_MANAGE), false)
})

test('super admin wildcard continues to cover Blog management', () => {
  assert.deepEqual(resolvePermissionsForRole('super_admin'), ['*'])
  assert.equal(hasPermission({ role: 'super_admin' }, PERMISSIONS.BLOG_MANAGE), true)
})
