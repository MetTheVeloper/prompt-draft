export type PublicMarkdownRenderOptions = {
  headingOffset?: number
  externalRel?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safePublicUrl(value: string) {
  const raw = value.trim()
  if (!raw) return null
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

function renderInline(value: string, externalRel: string) {
  const tokens: string[] = []
  const store = (html: string) => {
    const index = tokens.push(html) - 1
    return `\u0000PD_TOKEN_${index}\u0000`
  }

  let source = value

  source = source.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    return store(`<code>${escapeHtml(code)}</code>`)
  })

  source = source.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt: string, rawUrl: string) => {
    const url = safePublicUrl(rawUrl)
    if (!url) return escapeHtml(alt)
    return store(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`)
  })

  source = source.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, rawUrl: string) => {
    const url = safePublicUrl(rawUrl)
    if (!url) return escapeHtml(label)
    const escapedUrl = escapeHtml(url)
    const escapedLabel = escapeHtml(label)
    const external = /^https?:\/\//i.test(url)
    return store(external
      ? `<a href="${escapedUrl}" target="_blank" rel="${escapeHtml(externalRel)}">${escapedLabel}</a>`
      : `<a href="${escapedUrl}">${escapedLabel}</a>`)
  })

  let escaped = escapeHtml(source)
  escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  escaped = escaped.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')

  for (let index = 0; index < tokens.length; index += 1) {
    escaped = escaped.replaceAll(`\u0000PD_TOKEN_${index}\u0000`, tokens[index])
  }

  return escaped
}

function isBlockStart(line: string) {
  return /^\s*(#{1,6})\s+/.test(line)
    || /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)
    || /^\s*>\s?/.test(line)
    || /^\s*[-+*]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line)
    || /^\s*```/.test(line)
}

export function renderPublicMarkdown(value: unknown, options: PublicMarkdownRenderOptions = {}) {
  if (typeof value !== 'string') return ''
  const source = value.replace(/\r\n?/g, '\n').trim()
  if (!source) return ''

  const headingOffset = Math.max(0, Math.min(5, Number(options.headingOffset) || 0))
  const externalRel = typeof options.externalRel === 'string' && options.externalRel.trim()
    ? options.externalRel.trim()
    : 'noopener noreferrer'

  const lines = source.split('\n')
  const html: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^\s*```([^\s`]*)\s*$/)
    if (fence) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : ''
      html.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const markdownLevel = heading[1].length
      const htmlLevel = Math.min(markdownLevel + headingOffset, 6)
      html.push(`<h${htmlLevel}>${renderInline(heading[2], externalRel)}</h${htmlLevel}>`)
      index += 1
      continue
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push('<hr>')
      index += 1
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = []
      while (index < lines.length) {
        const match = lines[index].match(/^\s*>\s?(.*)$/)
        if (!match) break
        quote.push(match[1])
        index += 1
      }
      html.push(`<blockquote>${renderInline(quote.join(' '), externalRel)}</blockquote>`)
      continue
    }

    if (/^\s*[-+*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length) {
        const match = lines[index].match(/^\s*[-+*]\s+(.+)$/)
        if (!match) break
        items.push(`<li>${renderInline(match[1], externalRel)}</li>`)
        index += 1
      }
      html.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length) {
        const match = lines[index].match(/^\s*\d+[.)]\s+(.+)$/)
        if (!match) break
        items.push(`<li>${renderInline(match[1], externalRel)}</li>`)
        index += 1
      }
      html.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    const paragraph: string[] = [line.trim()]
    index += 1
    while (
      index < lines.length
      && lines[index].trim()
      && !isBlockStart(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    html.push(`<p>${renderInline(paragraph.join(' '), externalRel)}</p>`)
  }

  return html.join('\n')
}
