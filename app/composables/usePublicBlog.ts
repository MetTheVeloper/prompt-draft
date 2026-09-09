import type {
  PublicBlogArticleResponse,
  PublicBlogListResponse,
  PublicBlogLocale,
} from '~/shared/public-blog'

export function usePublicBlog() {
  const requestFetch = useRequestFetch()

  return {
    list(locale: PublicBlogLocale) {
      return requestFetch<PublicBlogListResponse>('/api/public/blog', {
        query: { locale },
      })
    },
    load(slug: string, locale: PublicBlogLocale) {
      return requestFetch<PublicBlogArticleResponse>(`/api/public/blog/${encodeURIComponent(slug)}`, {
        query: { locale },
      })
    },
  }
}
