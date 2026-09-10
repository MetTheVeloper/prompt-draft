import { requireBlogManage } from './blogManageAuthorization'
import {
  BlogGitRepositoryError,
  resolveBlogGitConfig,
  writeBlogGitArticle,
} from './blogGitRepository'
import { recordBlogPublicationAudit } from './blogPublicationAudit'

const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function rethrowBlogWriteError(error: unknown): never {
  if (error instanceof BlogGitRepositoryError) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
      data: {
        code: error.code,
        issues: error.issues,
      },
    })
  }
  throw error
}

export async function saveManageBlogArticle(event: any, articleId: string | null) {
  await requireBlogManage(event)
  setHeader(event, 'Cache-Control', 'no-store')

  if (articleId !== null && !ARTICLE_ID_PATTERN.test(articleId)) {
    throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
  }

  const runtime = useRuntimeConfig(event)
  let gitConfig
  try {
    gitConfig = resolveBlogGitConfig(runtime)
  } catch (error) {
    rethrowBlogWriteError(error)
  }

  if (!gitConfig) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Canonical Blog Git publication is not configured',
      data: { code: 'BLOG_GIT_NOT_CONFIGURED' },
    })
  }

  let input: unknown
  try {
    input = await readBody(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must contain valid JSON',
      data: { code: 'BLOG_WRITE_INVALID' },
    })
  }

  try {
    const result = await writeBlogGitArticle({
      config: gitConfig,
      input,
      articleId,
    })
    const auditRecorded = await recordBlogPublicationAudit(event, result)

    return {
      ok: true,
      article: result.article,
      version: result.version,
      commitSha: result.commitSha,
      repositorySource: 'git' as const,
      auditRecorded,
    }
  } catch (error) {
    rethrowBlogWriteError(error)
  }
}
