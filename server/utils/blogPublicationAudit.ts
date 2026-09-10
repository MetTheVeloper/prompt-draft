import type { BlogGitWriteResult } from './blogGitRepository'

function normalizeApiBase(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  try {
    return new URL(raw).toString().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export async function recordBlogPublicationAudit(
  event: any,
  result: BlogGitWriteResult,
  fetchImpl: typeof fetch = fetch,
) {
  const runtime = useRuntimeConfig(event)
  const apiBase = normalizeApiBase(runtime.apiBaseInternal || runtime.public.apiBase)
  const authorization = getHeader(event, 'authorization')?.trim() ?? ''
  if (!apiBase || !authorization) return false

  try {
    const response = await fetchImpl(new URL('/api/admin/blog/publication-audit', `${apiBase}/`), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: result.action,
        articleId: result.article.id,
        slug: result.article.slug,
        status: result.article.status,
        commitSha: result.commitSha,
        branch: result.branch,
      }),
    })

    if (!response.ok) {
      console.warn('[Prompt Draft Blog] publication audit was not recorded', response.status)
      return false
    }

    return true
  } catch (error) {
    console.warn('[Prompt Draft Blog] publication audit request failed', error)
    return false
  }
}
