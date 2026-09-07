import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PUBLIC_ROUTE_PATHS,
  publicBlogPostPath,
  publicCreatorPath,
  publicDiscoveryPath,
  publicPromptPath,
} from '../app/utils/publicRoutes'

test('public static route contract stays stable', () => {
  assert.equal(PUBLIC_ROUTE_PATHS.home, '/')
  assert.equal(PUBLIC_ROUTE_PATHS.guide, '/guide')
  assert.equal(PUBLIC_ROUTE_PATHS.blog, '/blog')
})

test('public Prompt canonical route uses a positive numeric id', () => {
  assert.equal(publicPromptPath(42), '/prompt/42')
  assert.equal(publicPromptPath('511'), '/prompt/511')
  assert.throws(() => publicPromptPath(0), /Invalid public Prompt id/)
  assert.throws(() => publicPromptPath('abc'), /Invalid public Prompt id/)
})

test('public Creator canonical route normalizes a valid username', () => {
  assert.equal(publicCreatorPath(' Met.TheVeloper '), '/creator/met.theveloper')
  assert.throws(() => publicCreatorPath('bad username'), /Invalid public Creator username/)
})

test('public Discovery canonical route normalizes the slug', () => {
  assert.equal(publicDiscoveryPath('/Posters-Editorial/'), '/discover/posters-editorial')
  assert.throws(() => publicDiscoveryPath(' / '), /Invalid public discovery slug/)
})

test('public Blog canonical route normalizes the stable slug', () => {
  assert.equal(publicBlogPostPath('/Prompt-Anatomy/'), '/blog/prompt-anatomy')
  assert.throws(() => publicBlogPostPath(''), /Invalid public Blog slug/)
})
