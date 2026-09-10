import { renderPublicMarkdown } from './publicMarkdown'

type BlogMarkdownSection = {
  level: number
  headingHtml: string
  bodyHtml: string[]
  children: BlogMarkdownSection[]
}

function makeBlogImagesInteractive(html: string) {
  return html.replace(
    /<img\s/g,
    '<img data-blog-zoom="true" role="button" tabindex="0" ',
  )
}

function dropTerminalDivider(blocks: string[]) {
  if (blocks.at(-1) === '<hr>') blocks.pop()
}

function renderSection(section: BlogMarkdownSection): string {
  const content = [
    ...section.bodyHtml,
    ...section.children.map(renderSection),
  ].join('\n')

  return [
    `<details class="blog-article-section" data-heading-level="${section.level}" open>`,
    `<summary>${section.headingHtml}</summary>`,
    `<div class="blog-article-section-content">${content}</div>`,
    '</details>',
  ].join('')
}

function sectionizeBlogMarkdownHtml(html: string) {
  if (!html) return ''

  const intro: string[] = []
  const roots: BlogMarkdownSection[] = []
  const stack: BlogMarkdownSection[] = []

  for (const block of html.split('\n')) {
    const heading = block.match(/^<h([1-6])>(.*)<\/h\1>$/)

    if (!heading) {
      const active = stack.at(-1)
      if (active) active.bodyHtml.push(block)
      else intro.push(block)
      continue
    }

    const active = stack.at(-1)
    if (active) dropTerminalDivider(active.bodyHtml)
    else dropTerminalDivider(intro)

    const level = Number(heading[1])
    const section: BlogMarkdownSection = {
      level,
      headingHtml: block,
      bodyHtml: [],
      children: [],
    }

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    const parent = stack.at(-1)
    if (parent) parent.children.push(section)
    else roots.push(section)
    stack.push(section)
  }

  const renderedIntro = intro.length
    ? `<div class="blog-article-intro">${intro.join('\n')}</div>`
    : ''

  return `${renderedIntro}${roots.map(renderSection).join('')}`
}

export function renderPublicBlogMarkdown(value: unknown) {
  const html = renderPublicMarkdown(value, {
    minimumHeadingLevel: 2,
    externalRel: 'noopener noreferrer',
    renderCitations: true,
  })

  return sectionizeBlogMarkdownHtml(makeBlogImagesInteractive(html))
}
