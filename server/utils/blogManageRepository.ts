import { loadBlogRepository } from './blogRepository'
import {
  readBlogGitRepository,
  resolveBlogGitConfig,
  type BlogGitConfig,
} from './blogGitRepository'

export async function getBlogManageRepository(event: any) {
  const runtime = useRuntimeConfig(event)
  const gitConfig = resolveBlogGitConfig(runtime)

  if (gitConfig) {
    const snapshot = await readBlogGitRepository(gitConfig)
    return {
      source: 'git' as const,
      writeConfigured: true,
      gitConfig,
      articles: snapshot.articles,
      versions: snapshot.versions,
    }
  }

  const articles = await loadBlogRepository()
  return {
    source: 'deployed' as const,
    writeConfigured: false,
    gitConfig: null as BlogGitConfig | null,
    articles,
    versions: new Map<string, string>(),
  }
}
