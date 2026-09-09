import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sql = readFileSync(
  new URL('../sql/028_seed_profile_skill_taxonomy.sql', import.meta.url),
  'utf8',
)

function readSection(name) {
  const start = `-- taxonomy:${name}:start`
  const end = `-- taxonomy:${name}:end`
  const startIndex = sql.indexOf(start)
  const endIndex = sql.indexOf(end)
  assert.notEqual(startIndex, -1, `missing ${start} marker`)
  assert.notEqual(endIndex, -1, `missing ${end} marker`)
  assert.ok(endIndex > startIndex, `${name} markers are out of order`)
  return sql.slice(startIndex + start.length, endIndex)
}

function parseCategories() {
  const rows = []
  const pattern = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/g
  for (const match of readSection('categories').matchAll(pattern)) {
    rows.push({
      slug: match[1],
      titleEn: match[2],
      titleFa: match[3],
      sortOrder: Number(match[4]),
    })
  }
  return rows
}

function parseSkills() {
  const rows = []
  const pattern = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/g
  for (const match of readSection('skills').matchAll(pattern)) {
    rows.push({
      slug: match[1],
      categorySlug: match[2],
      titleEn: match[3],
      titleFa: match[4],
      sortOrder: Number(match[5]),
    })
  }
  return rows
}

const expectedCategories = [
  'ai-prompting',
  'product-design',
  'software-development',
  'visual-creation',
  'content-language',
  'data-automation',
  'media-production',
  'business-growth',
]

test('Creator skill taxonomy V1 contains eight bilingual categories', () => {
  const categories = parseCategories()
  assert.equal(categories.length, 8)
  assert.deepEqual(categories.map(category => category.slug), expectedCategories)
  assert.equal(new Set(categories.map(category => category.slug)).size, categories.length)

  categories.forEach((category, index) => {
    assert.match(category.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.ok(category.titleEn.trim())
    assert.ok(category.titleFa.trim())
    assert.equal(category.sortOrder, (index + 1) * 10)
  })
})

test('Creator skill taxonomy V1 contains forty controlled bilingual skills', () => {
  const skills = parseSkills()
  assert.equal(skills.length, 40)
  assert.equal(new Set(skills.map(skill => skill.slug)).size, skills.length)

  const categorySet = new Set(expectedCategories)
  skills.forEach(skill => {
    assert.match(skill.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.ok(categorySet.has(skill.categorySlug), `unknown category ${skill.categorySlug}`)
    assert.ok(skill.titleEn.trim())
    assert.ok(skill.titleFa.trim())
    assert.ok([10, 20, 30, 40, 50].includes(skill.sortOrder))
  })

  expectedCategories.forEach(categorySlug => {
    assert.equal(
      skills.filter(skill => skill.categorySlug === categorySlug).length,
      5,
      `${categorySlug} should contain exactly five V1 skills`,
    )
  })
})

test('taxonomy includes core Prompt Draft creator capabilities', () => {
  const skills = new Set(parseSkills().map(skill => skill.slug))
  ;[
    'prompt-engineering',
    'generative-ai',
    'product-design',
    'ui-design',
    'full-stack-development',
    'ai-image-generation',
    'workflow-design',
    'seo',
  ].forEach(slug => assert.ok(skills.has(slug), `missing core skill ${slug}`))
})

test('taxonomy migration is rerunnable without forcing deactivated entries active', () => {
  assert.equal((sql.match(/ON CONFLICT \(slug\) DO UPDATE/g) ?? []).length, 2)
  assert.doesNotMatch(sql, /SET[\s\S]*?active\s*=\s*EXCLUDED\.active/)
})
