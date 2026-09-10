<script setup lang="ts">
import ManageBlogMarkdownEditor from '~/components/manage/ManageBlogMarkdownEditor.vue'
import { AUTH_PERMISSIONS } from '~/config/authorization'
import type { ManageBlogArticleSummary } from '../../../shared/manage-blog'
import type { BlogLocale } from '~/shared/blog-article'
import {
  blogArticleToManageDraft,
  createEmptyManageBlogDraft,
  validateManageBlogDraft,
  type ManageBlogDraft,
} from '~/utils/manageBlogDraft'

definePageMeta({
  middleware: 'authorization',
  requiredPermission: AUTH_PERMISSIONS.BLOG_MANAGE,
})

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const blogApi = useManageBlog()
const { locale, t } = useI18n()

const articles = ref<ManageBlogArticleSummary[]>([])
const loading = ref(false)
const loadError = ref('')
const editorLoading = ref(false)
const editorError = ref('')
const activeLocale = ref<BlogLocale>('en')
const validation = ref<ReturnType<typeof validateManageBlogDraft> | null>(null)
const draft = reactive<ManageBlogDraft>(createEmptyManageBlogDraft())
const blogLocales: BlogLocale[] = ['en', 'fa']

const editingId = computed(() => (
  typeof route.query.article === 'string' ? route.query.article.trim() : ''
))
const isCreating = computed(() => route.query.new === '1')
const editorOpen = computed(() => Boolean(editingId.value) || isCreating.value)

const editorTitle = computed(() => (
  editingId.value
    ? t('manage.blog.editor.editTitle', { id: editingId.value })
    : t('manage.blog.editor.newTitle')
))

const publicLocales = computed(() => validation.value?.article?.availableLocales ?? [])
const validationIssues = computed(() => validation.value?.issues ?? [])

function resetDraft() {
  Object.assign(draft, createEmptyManageBlogDraft())
  activeLocale.value = 'en'
  validation.value = null
  editorError.value = ''
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function titleFor(article: ManageBlogArticleSummary) {
  return article.titles[locale.value as BlogLocale]
    || article.titles.en
    || article.titles.fa
    || article.slug
}

async function refresh() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await blogApi.list()
    articles.value = response.articles
  } catch (error) {
    console.error('[Prompt Draft] Blog management list failed', error)
    loadError.value = t('manage.blog.loadError')
  } finally {
    loading.value = false
  }
}

async function syncEditorFromRoute() {
  validation.value = null
  editorError.value = ''

  if (isCreating.value) {
    resetDraft()
    return
  }

  if (!editingId.value) return

  editorLoading.value = true
  try {
    const response = await blogApi.load(editingId.value)
    Object.assign(draft, blogArticleToManageDraft(response.article))
    activeLocale.value = response.article.localizations.en ? 'en' : 'fa'
  } catch (error) {
    console.error('[Prompt Draft] Blog management article load failed', error)
    editorError.value = t('manage.blog.editor.missing')
  } finally {
    editorLoading.value = false
  }
}

function openNew() {
  void router.push({
    path: route.path,
    query: { new: '1' },
  })
}

function openArticle(id: string) {
  void router.push({
    path: route.path,
    query: { article: id },
  })
}

function closeEditor() {
  void router.push({ path: route.path })
}

function runValidation() {
  validation.value = validateManageBlogDraft(draft)
}

function updateStatus(value: Event) {
  const nextStatus = (value.target as HTMLSelectElement).value === 'published'
    ? 'published'
    : 'draft'
  draft.status = nextStatus
  if (nextStatus === 'published' && !draft.publishedAt.trim()) {
    draft.publishedAt = new Date().toISOString()
  }
  validation.value = null
}

watch(
  () => [route.query.article, route.query.new],
  () => void syncEditorFromRoute(),
)

onMounted(async () => {
  await auth.initialize()
  if (!auth.can(AUTH_PERMISSIONS.BLOG_MANAGE)) return
  await refresh()
  await syncEditorFromRoute()
})
</script>

<template>
  <el-flex rules="ccs" :gap="16" class="w100">
    <div class="manage-blog-notice">
      <div>
        <strong>{{ t('manage.blog.editor.repositoryNotice') }}</strong>
        <p>{{ t('manage.blog.editor.repositoryNoticeDetail') }}</p>
      </div>
      <span class="manage-blog-notice__badge">4E.4</span>
    </div>

    <template v-if="!editorOpen">
      <el-flex rules="rbc" :gap="10" class="w100 fw">
        <el-text :size="13" color="normal55">
          {{ articles.length }} article{{ articles.length === 1 ? '' : 's' }}
        </el-text>
        <el-flex rules="rcc" :gap="8">
          <el-button
            icon="refresh"
            :label="t('manage.blog.actions.refresh')"
            mode="flat"
            :loading="loading"
            @click="refresh"
          />
          <el-button
            icon="add"
            :label="t('manage.blog.actions.newArticle')"
            color="prim"
            @click="openNew"
          />
        </el-flex>
      </el-flex>

      <div v-if="loading" class="manage-blog-state">{{ t('manage.blog.loading') }}</div>
      <div v-else-if="loadError" class="manage-blog-state manage-blog-state--error">{{ loadError }}</div>
      <div v-else-if="!articles.length" class="manage-blog-state">{{ t('manage.blog.empty') }}</div>

      <div v-else class="manage-blog-table">
        <div class="manage-blog-table__row manage-blog-table__head">
          <span>{{ t('manage.blog.list.id') }}</span>
          <span>{{ t('manage.blog.list.slug') }}</span>
          <span>{{ t('manage.blog.list.status') }}</span>
          <span>{{ t('manage.blog.list.locales') }}</span>
          <span>{{ t('manage.blog.list.updated') }}</span>
          <span />
        </div>
        <button
          v-for="article in articles"
          :key="article.id"
          type="button"
          class="manage-blog-table__row manage-blog-table__article"
          @click="openArticle(article.id)"
        >
          <span>
            <strong>{{ titleFor(article) }}</strong>
            <small>{{ article.id }}</small>
          </span>
          <code>{{ article.slug }}</code>
          <span class="manage-blog-status" :data-status="article.status">
            {{ t(`manage.blog.statuses.${article.status}`) }}
          </span>
          <span>{{ article.availableLocales.length ? article.availableLocales.join(' / ').toUpperCase() : '—' }}</span>
          <span>{{ formatDate(article.updatedAt) }}</span>
          <span class="manage-blog-edit">{{ t('manage.blog.actions.edit') }} →</span>
        </button>
      </div>
    </template>

    <template v-else>
      <el-flex rules="rbc" :gap="10" class="w100 fw">
        <el-flex rules="ccs" :gap="3">
          <el-text type="h3" :size="20" :weight="800">{{ editorTitle }}</el-text>
          <el-text v-if="editingId" :size="12" color="normal55">{{ draft.slug }}</el-text>
        </el-flex>
        <el-flex rules="rcc" :gap="8">
          <el-button
            icon="arrow_back"
            :label="t('manage.blog.actions.backToList')"
            mode="flat"
            @click="closeEditor"
          />
          <el-button
            icon="fact_check"
            :label="t('manage.blog.actions.validate')"
            color="prim"
            :disabled="editorLoading"
            @click="runValidation"
          />
        </el-flex>
      </el-flex>

      <div v-if="editorLoading" class="manage-blog-state">{{ t('manage.blog.editor.loading') }}</div>
      <div v-else-if="editorError" class="manage-blog-state manage-blog-state--error">{{ editorError }}</div>

      <template v-else>
        <section class="manage-blog-panel">
          <h3>{{ t('manage.blog.groups.repositoryMetadata') }}</h3>
          <div class="manage-blog-grid manage-blog-grid--3">
            <label>
              <span>{{ t('manage.blog.fields.id') }}</span>
              <input v-model="draft.id" :disabled="Boolean(editingId)" :placeholder="t('manage.blog.placeholders.id')" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.slug') }}</span>
              <input v-model="draft.slug" :placeholder="t('manage.blog.placeholders.slug')" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.status') }}</span>
              <select :value="draft.status" @change="updateStatus">
                <option value="draft">{{ t('manage.blog.statuses.draft') }}</option>
                <option value="published">{{ t('manage.blog.statuses.published') }}</option>
              </select>
            </label>
            <label>
              <span>{{ t('manage.blog.fields.publishedAt') }}</span>
              <input v-model="draft.publishedAt" placeholder="2026-09-10T00:00:00.000Z" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.updatedAt') }}</span>
              <input v-model="draft.updatedAt" placeholder="2026-09-10T00:00:00.000Z" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.publicLocales') }}</span>
              <input :value="publicLocales.length ? publicLocales.join(', ').toUpperCase() : '—'" disabled />
            </label>
          </div>
        </section>

        <section class="manage-blog-panel">
          <h3>{{ t('manage.blog.groups.editorialIdentity') }}</h3>
          <div class="manage-blog-grid manage-blog-grid--2">
            <label>
              <span>{{ t('manage.blog.fields.authorName') }}</span>
              <input v-model="draft.authorName" :placeholder="t('manage.blog.placeholders.authorName')" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.authorUrl') }}</span>
              <input v-model="draft.authorUrl" :placeholder="t('manage.blog.placeholders.authorUrl')" />
            </label>
          </div>
        </section>

        <section class="manage-blog-panel">
          <h3>{{ t('manage.blog.groups.heroMedia') }}</h3>
          <div class="manage-blog-grid manage-blog-grid--2">
            <label>
              <span>{{ t('manage.blog.fields.heroFullUrl') }}</span>
              <input v-model="draft.heroFullUrl" placeholder="/media/blog/hero.webp" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.heroThumbnailUrl') }}</span>
              <input v-model="draft.heroThumbnailUrl" placeholder="/media/blog/hero-thumb.webp" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.heroWidth') }}</span>
              <input v-model="draft.heroWidth" inputmode="numeric" placeholder="1600" />
            </label>
            <label>
              <span>{{ t('manage.blog.fields.heroHeight') }}</span>
              <input v-model="draft.heroHeight" inputmode="numeric" placeholder="900" />
            </label>
          </div>
        </section>

        <section class="manage-blog-panel manage-blog-localization">
          <div class="manage-blog-localization__tabs">
            <button
              v-for="code in blogLocales"
              :key="code"
              type="button"
              :class="{ active: activeLocale === code }"
              @click="activeLocale = code"
            >
              {{ t(`manage.blog.locales.${code}`) }}
            </button>
          </div>

          <div v-if="activeLocale === 'en'" class="manage-blog-localization__body" dir="ltr">
            <div class="manage-blog-grid manage-blog-grid--2">
              <label>
                <span>{{ t('manage.blog.fields.title') }}</span>
                <input v-model="draft.enTitle" :placeholder="t('manage.blog.placeholders.title')" />
              </label>
              <label>
                <span>{{ t('manage.blog.fields.heroAlt') }}</span>
                <input v-model="draft.enAlt" :placeholder="t('manage.blog.placeholders.heroAlt')" />
              </label>
            </div>
            <label>
              <span>{{ t('manage.blog.fields.description') }}</span>
              <textarea v-model="draft.enDescription" rows="3" :placeholder="t('manage.blog.placeholders.description')" />
            </label>
            <ManageBlogMarkdownEditor
              v-model="draft.enBody"
              locale="en"
              :placeholder="t('manage.blog.placeholders.markdown')"
            />
          </div>

          <div v-else class="manage-blog-localization__body" dir="rtl">
            <div class="manage-blog-grid manage-blog-grid--2">
              <label>
                <span>{{ t('manage.blog.fields.title') }}</span>
                <input v-model="draft.faTitle" :placeholder="t('manage.blog.placeholders.title')" />
              </label>
              <label>
                <span>{{ t('manage.blog.fields.heroAlt') }}</span>
                <input v-model="draft.faAlt" :placeholder="t('manage.blog.placeholders.heroAlt')" />
              </label>
            </div>
            <label>
              <span>{{ t('manage.blog.fields.description') }}</span>
              <textarea v-model="draft.faDescription" rows="3" :placeholder="t('manage.blog.placeholders.description')" />
            </label>
            <ManageBlogMarkdownEditor
              v-model="draft.faBody"
              locale="fa"
              :placeholder="t('manage.blog.placeholders.markdown')"
            />
          </div>
        </section>

        <section
          class="manage-blog-validation"
          :data-state="validation ? (validation.ok ? 'valid' : 'invalid') : 'idle'"
        >
          <template v-if="!validation">
            <strong>{{ t('manage.blog.editor.untouched') }}</strong>
          </template>
          <template v-else-if="validation.ok">
            <strong>{{ t('manage.blog.editor.validTitle') }}</strong>
            <p>{{ t('manage.blog.editor.validDetail') }}</p>
          </template>
          <template v-else>
            <strong>{{ t('manage.blog.editor.invalidTitle') }}</strong>
            <p>{{ t('manage.blog.editor.invalidDetail', { count: validationIssues.length }) }}</p>
            <ul>
              <li v-for="(issue, index) in validationIssues" :key="`${issue.path}-${index}`">
                <code>{{ issue.path }}</code> — {{ issue.message }}
              </li>
            </ul>
          </template>
        </section>
      </template>
    </template>
  </el-flex>
</template>

<style scoped>
.manage-blog-notice,
.manage-blog-panel,
.manage-blog-validation,
.manage-blog-state,
.manage-blog-table {
  width: 100%;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 14px;
  background: rgb(255 255 255 / 3%);
}

.manage-blog-notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
}

.manage-blog-notice strong {
  display: block;
  margin-bottom: 4px;
}

.manage-blog-notice p,
.manage-blog-validation p {
  margin: 0;
  color: rgb(255 255 255 / 58%);
  font-size: 12px;
  line-height: 1.7;
}

.manage-blog-notice__badge {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: rgb(255 255 255 / 65%);
  font: 700 11px/1 monospace;
}

.manage-blog-state {
  padding: 24px;
  text-align: center;
  color: rgb(255 255 255 / 58%);
}

.manage-blog-state--error {
  color: #ff9b9b;
}

.manage-blog-table {
  overflow: hidden;
}

.manage-blog-table__row {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(120px, 1fr) 110px 90px 150px 70px;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
}

.manage-blog-table__head {
  color: rgb(255 255 255 / 48%);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.manage-blog-table__article {
  border: 0;
  border-top: 1px solid rgb(255 255 255 / 7%);
  background: transparent;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
}

.manage-blog-table__article:hover {
  background: rgb(255 255 255 / 4%);
}

.manage-blog-table__article strong,
.manage-blog-table__article small {
  display: block;
}

.manage-blog-table__article small,
.manage-blog-table__article code {
  margin-top: 2px;
  color: rgb(255 255 255 / 45%);
  font-size: 11px;
}

.manage-blog-status {
  text-transform: capitalize;
}

.manage-blog-status[data-status='published'] {
  color: #86efac;
}

.manage-blog-status[data-status='draft'] {
  color: #facc15;
}

.manage-blog-edit {
  color: rgb(255 255 255 / 58%);
  font-size: 12px;
}

.manage-blog-panel {
  padding: 16px;
}

.manage-blog-panel h3 {
  margin: 0 0 14px;
  font-size: 14px;
}

.manage-blog-grid {
  display: grid;
  gap: 12px;
}

.manage-blog-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.manage-blog-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.manage-blog-panel label,
.manage-blog-localization__body > label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: rgb(255 255 255 / 58%);
  font-size: 12px;
}

.manage-blog-panel input,
.manage-blog-panel textarea,
.manage-blog-panel select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 10px;
  outline: none;
  background: rgb(0 0 0 / 18%);
  color: inherit;
  padding: 10px 11px;
  font: inherit;
}

.manage-blog-panel textarea {
  resize: vertical;
}

.manage-blog-localization {
  padding: 0;
  overflow: hidden;
}

.manage-blog-localization__tabs {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.manage-blog-localization__tabs button {
  border: 0;
  border-radius: 9px;
  padding: 8px 12px;
  background: transparent;
  color: rgb(255 255 255 / 58%);
  cursor: pointer;
}

.manage-blog-localization__tabs button.active {
  background: rgb(255 255 255 / 9%);
  color: inherit;
}

.manage-blog-localization__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.manage-blog-validation {
  padding: 14px 16px;
}

.manage-blog-validation[data-state='valid'] {
  border-color: rgb(134 239 172 / 28%);
}

.manage-blog-validation[data-state='invalid'] {
  border-color: rgb(248 113 113 / 35%);
}

.manage-blog-validation ul {
  margin: 10px 0 0;
  padding-inline-start: 22px;
  color: #ffb4b4;
  font-size: 12px;
  line-height: 1.65;
}

@media (max-width: 980px) {
  .manage-blog-table {
    overflow-x: auto;
  }

  .manage-blog-table__row {
    min-width: 820px;
  }

  .manage-blog-grid--3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .manage-blog-grid--2,
  .manage-blog-grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
