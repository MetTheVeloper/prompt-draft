import { loadBlogRepository } from './blogRepository'
import {
  readBlogGitRepository,
  resolveBlogGitConfig,
  type BlogGitConfig,
} from './blogGitRepository'

export function getConfiguredBlogGitRepository() {
  return resolveBlogGitConfig({
    blogGithubToken: process.env.BLOG_GITHUB_TOKEN,
    blogGithubRepository: process.env.BLOG_GITHUB_REPOSITORY,
    blogGithubBranch: process.env.BLOG_GITHUB_BRANCH,
  })
}

export async function getBlogManageRepository(_event: any) {
  const gitConfig = getConfiguredBlogGitRepository()

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
