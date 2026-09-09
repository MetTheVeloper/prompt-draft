import { renderPublicMarkdown } from './publicMarkdown'

export function renderPublicCreatorMarkdown(value: unknown) {
  return renderPublicMarkdown(value, {
    headingOffset: 1,
    externalRel: 'ugc noopener noreferrer',
  })
}
