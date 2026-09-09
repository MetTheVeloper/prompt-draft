import { renderPublicMarkdown } from './publicMarkdown'

export function renderPublicBlogMarkdown(value: unknown) {
  return renderPublicMarkdown(value, {
    headingOffset: 1,
    externalRel: 'noopener noreferrer',
  })
}
