import assert from 'node:assert/strict'
import test from 'node:test'

import { renderPublicCreatorMarkdown } from '../app/utils/publicCreatorMarkdown'

test('renders the supported Creator Markdown presentation subset', () => {
  const html = renderPublicCreatorMarkdown(`# Building Prompt Draft

I'm **Grass** and I build [Prompt Draft](https://prompt-draft.ir).

## What I'm Building

- Product design
- Prompt engineering

![Prompt Draft](https://grassic.ir/prompts/473/01.webp)`)

  assert.match(html, /<h2>Building Prompt Draft<\/h2>/)
  assert.match(html, /<strong>Grass<\/strong>/)
  assert.match(html, /href="https:\/\/prompt-draft\.ir\/"/)
  assert.match(html, /rel="ugc noopener noreferrer"/)
  assert.match(html, /<h3>What I&#39;m Building<\/h3>/)
  assert.match(html, /<ul><li>Product design<\/li><li>Prompt engineering<\/li><\/ul>/)
  assert.match(html, /<img src="https:\/\/grassic\.ir\/prompts\/473\/01\.webp"/)
})

test('escapes raw HTML rather than trusting Creator Markdown source', () => {
  const html = renderPublicCreatorMarkdown('<script>alert("xss")</script>\n\n<img src=x onerror=alert(1)>')
  assert.equal(html.includes('<script>'), false)
  assert.equal(html.includes('<img src=x'), false)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
})

test('drops unsafe markdown link and image protocols', () => {
  const html = renderPublicCreatorMarkdown('[bad](javascript:alert(1))\n\n![bad](data:text/html;base64,abc)')
  assert.equal(html.includes('href='), false)
  assert.equal(html.includes('src='), false)
  assert.equal(html.includes('javascript:'), false)
  assert.equal(html.includes('data:text/html'), false)
  assert.match(html, /bad/)
})

test('supports fenced code without interpreting embedded markup', () => {
  const html = renderPublicCreatorMarkdown('```html\n<script>alert(1)</script>\n```')
  assert.match(html, /<pre><code class="language-html">/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.equal(html.includes('<script>alert(1)</script>'), false)
})

test('empty or non-string values render no HTML', () => {
  assert.equal(renderPublicCreatorMarkdown('   '), '')
  assert.equal(renderPublicCreatorMarkdown(null), '')
})
