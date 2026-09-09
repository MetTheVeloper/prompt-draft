import assert from 'node:assert/strict'
import test from 'node:test'
import { renderPublicRobotsTxt } from '../shared/public-robots'
import {
  APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS,
  APPLICATION_NOINDEX_PATHS,
  isNoindexApplicationPath,
} from '../shared/seo-route-policy'

test('shared application route policy covers accepted EN and FA noindex surfaces', () => {
  for (const path of APPLICATION_NOINDEX_PATHS) {
    assert.equal(isNoindexApplicationPath(path), true, path)
    assert.equal(isNoindexApplicationPath(`/fa${path}`), true, `/fa${path}`)
  }

  assert.equal(isNoindexApplicationPath('/manage/users'), true)
  assert.equal(isNoindexApplicationPath('/fa/manage/users'), true)
  assert.equal(isNoindexApplicationPath('/wizard/portrait'), true)
  assert.equal(isNoindexApplicationPath('/fa/wizard/portrait'), true)

  for (const path of ['/', '/fa', '/guide', '/fa/guide', '/prompt/6', '/creator/grassias']) {
    assert.equal(isNoindexApplicationPath(path), false, path)
  }

  assert.equal(APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS.includes('/manage/**'), true)
  assert.equal(APPLICATION_CLIENT_ONLY_ROUTE_PATTERNS.includes('/wizard/**'), true)
})

test('indexing-enabled robots covers accepted application routes in both locale spaces and advertises sitemap', () => {
  const robots = renderPublicRobotsTxt({
    siteUrl: 'https://example.test/',
    indexingEnabled: true,
  })

  assert.match(robots, /^User-agent: \*$/m)
  assert.match(robots, /^Allow: \/$/m)

  for (const path of APPLICATION_NOINDEX_PATHS) {
    assert.match(robots, new RegExp(`^Disallow: ${path.replaceAll('/', '\\/')}$`, 'm'))
    assert.match(robots, new RegExp(`^Disallow: \/fa${path.replaceAll('/', '\\/')}$`, 'm'))
  }

  assert.match(robots, /^Sitemap: https:\/\/example\.test\/sitemap\.xml$/m)
  assert.equal((robots.match(/^Sitemap:/gm) ?? []).length, 1)
})

test('global noindex robots omits sitemap promotion while allowing pages to expose noindex signals', () => {
  const robots = renderPublicRobotsTxt({
    siteUrl: 'https://grassic.ir',
    indexingEnabled: false,
  })

  assert.doesNotMatch(robots, /^Sitemap:/m)
  assert.doesNotMatch(robots, /^Disallow: \/$/m)
  assert.match(robots, /^Allow: \/$/m)
  assert.match(robots, /^Disallow: \/manage$/m)
  assert.match(robots, /^Disallow: \/fa\/manage$/m)
})
