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

const articleCountLabel = computed(() => t('manage.blog.list.count', {
  count: articles.value.length,
}))

const statusItems = computed(() => [
  {
    value: 'draft',
    label: t('manage.blog.statuses.draft'),
    icon: 'edit_note',
    color: 'orange',
  },
  {
    value: 'published',
    label: t('manage.blog.statuses.published'),
    icon: 'public',
    color: 'green',
  },
])

const publicLocales = computed(() => validation.value?.article?.availableLocales ?? [])
const publicLocalesLabel = computed(() => (
  publicLocales.value.length
    ? publicLocales.value.join(', ').toUpperCase()
    : '—'
))
const validationIssues = computed(() => validation.value?.issues ?? [])

const activeDirection = computed(() => activeLocale.value === 'fa' ? 'rtl' : 'ltr')
const activeTitle = computed({
  get: () => activeLocale.value === 'en' ? draft.enTitle : draft.faTitle,
  set: value => {
    if (activeLocale.value === 'en') draft.enTitle = value
    else draft.faTitle = value
    validation.value = null
  },
})
const activeDescription = computed({
  get: () => activeLocale.value === 'en' ? draft.enDescription : draft.faDescription,
  set: value => {
    if (activeLocale.value === 'en') draft.enDescription = value
    else draft.faDescription = value
    validation.value = null
  },
})
const activeHeroAlt = computed({
  get: () => activeLocale.value === 'en' ? draft.enAlt : draft.faAlt,
  set: value => {
    if (activeLocale.value === 'en') draft.enAlt = value
    else draft.faAlt = value
    validation.value = null
  },
})
const activeBody = computed({
  get: () => activeLocale.value === 'en' ? draft.enBody : draft.faBody,
  set: value => {
    if (activeLocale.value === 'en') draft.enBody = value
    else draft.faBody = value
    validation.value = null
  },
})

const validationTone = computed(() => {
  if (!validation.value) {
    return {
      bg: 'surface',
      border: 'normal15',
      color: 'normal55',
      icon: 'fact_check',
    }
  }

  if (validation.value.ok) {
    return {
      bg: 'green10',
      border: 'green25',
      color: 'green',
      icon: 'check_circle',
    }
  }

  return {
    bg: 'red10',
    border: 'red25',
    color: 'red',
    icon: 'error',
  }
})

function statusColor(status: ManageBlogArticleSummary['status']) {
  return status === 'published' ? 'green' : 'orange'
}

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

watch(
  () => draft.status,
  (nextStatus) => {
    if (nextStatus === 'published' && !draft.publishedAt.trim()) {
      draft.publishedAt = new Date().toISOString()
    }
    validation.value = null
  },
)

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
  <el-flex rules="csc" :gap="16" class="w100">
    <el-flex
      rules="rsc"
      :gap="10"
      :p="14"
      bg="surface"
      :radius="14"
      :br="1"
      bc="normal15"
      class="w100"
    >
      <el-icon icon="info" color="blue" :size="18" />
      <el-flex rules="ccs" :gap="3" class="fg100">
        <el-text :size="12" :weight="800">
          {{ t('manage.blog.editor.repositoryNotice') }}
        </el-text>
        <el-text color="normal55" :size="11">
          {{ t('manage.blog.editor.repositoryNoticeDetail') }}
        </el-text>
      </el-flex>
      <el-text color="normal45" :size="10" :weight="700" font="monospace">4E.4</el-text>
    </el-flex>

    <template v-if="!editorOpen">
      <el-flex rules="rbc" :gap="10" class="w100 fw">
        <el-text :size="13" color="normal55">{{ articleCountLabel }}</el-text>
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

      <el-flex
        rules="csc"
        class="w100"
        bg="surface"
        :radius="14"
        :br="1"
        bc="normal15"
      >
        <el-grid
          cols="minmax(200px, 1.5fr) minmax(150px, 1fr) 110px 90px 160px 44px"
          :gap="12"
          align-items="center"
          class="w100"
          :p="[12, 16]"
        >
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.list.id') }}</el-text>
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.list.slug') }}</el-text>
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.list.status') }}</el-text>
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.list.locales') }}</el-text>
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.list.updated') }}</el-text>
          <el-text color="normal55" :size="10" :weight="800">{{ t('manage.blog.actions.edit') }}</el-text>
        </el-grid>

        <el-divider />

        <el-flex v-if="loading" rules="ccc" class="w100" :p="28">
          <el-text color="normal55">{{ t('manage.blog.loading') }}</el-text>
        </el-flex>

        <el-flex v-else-if="loadError" rules="rsc" :gap="8" class="w100" bg="red10" :p="12">
          <el-icon icon="warning" color="red" :size="18" />
          <el-text color="red" :size="12">{{ loadError }}</el-text>
        </el-flex>

        <template v-else-if="articles.length">
          <template v-for="(article, index) in articles" :key="article.id">
            <el-grid
              cols="minmax(200px, 1.5fr) minmax(150px, 1fr) 110px 90px 160px 44px"
              :gap="12"
              align-items="center"
              class="w100 crp"
              :p="[12, 16]"
              @click="openArticle(article.id)"
            >
              <el-flex rules="ccs" :gap="3" class="w100">
                <el-text :size="12" :weight="700">{{ titleFor(article) }}</el-text>
                <el-text color="normal45" :size="10" font="monospace">{{ article.id }}</el-text>
              </el-flex>
              <el-text color="normal55" :size="11" font="monospace">{{ article.slug }}</el-text>
              <el-text :size="11" :weight="700" :color="statusColor(article.status)">
                {{ t(`manage.blog.statuses.${article.status}`) }}
              </el-text>
              <el-text :size="11">
                {{ article.availableLocales.length ? article.availableLocales.join(' / ').toUpperCase() : '—' }}
              </el-text>
              <el-text color="normal55" :size="10">{{ formatDate(article.updatedAt) }}</el-text>
              <el-button
                type="fab"
                mode="flat"
                icon="edit"
                :tooltip="t('manage.blog.actions.edit')"
                @click.stop="openArticle(article.id)"
              />
            </el-grid>
            <el-divider v-if="index < articles.length - 1" />
          </template>
        </template>

        <el-flex v-else rules="ccc" class="w100" :p="28">
          <el-text color="normal55">{{ t('manage.blog.empty') }}</el-text>
        </el-flex>
      </el-flex>
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
            :disable="editorLoading"
            @click="runValidation"
          />
        </el-flex>
      </el-flex>

      <el-flex v-if="editorLoading" rules="ccc" class="w100" :p="30">
        <el-text color="normal55">{{ t('manage.blog.editor.loading') }}</el-text>
      </el-flex>

      <el-flex v-else-if="editorError" rules="rsc" :gap="8" class="w100" bg="red10" :p="12" :radius="10">
        <el-icon icon="warning" color="red" :size="18" />
        <el-text color="red" :size="12">{{ editorError }}</el-text>
      </el-flex>

      <template v-else>
        <el-flex
          rules="csc"
          :gap="16"
          :p="18"
          bg="surface"
          :radius="16"
          :br="1"
          bc="normal15"
          class="w100"
        >
          <el-text :size="13" :weight="800">{{ t('manage.blog.groups.repositoryMetadata') }}</el-text>
          <el-grid cols="repeat(3, minmax(0, 1fr))" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.id') }}</el-text>
              <el-text-field
                v-model="draft.id"
                :actions="false"
                :disabled="Boolean(editingId)"
                :placeholder="t('manage.blog.placeholders.id')"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.slug') }}</el-text>
              <el-text-field
                v-model="draft.slug"
                :actions="false"
                :placeholder="t('manage.blog.placeholders.slug')"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.status') }}</el-text>
              <el-dropdown
                v-model="draft.status"
                :items="statusItems"
                icon="flag"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.publishedAt') }}</el-text>
              <el-text-field
                v-model="draft.publishedAt"
                :actions="false"
                placeholder="2026-09-10T00:00:00.000Z"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.updatedAt') }}</el-text>
              <el-text-field
                v-model="draft.updatedAt"
                :actions="false"
                placeholder="2026-09-10T00:00:00.000Z"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.publicLocales') }}</el-text>
              <el-text-field
                :model-value="publicLocalesLabel"
                :actions="false"
                disabled
              />
            </el-flex>
          </el-grid>
        </el-flex>

        <el-flex
          rules="csc"
          :gap="16"
          :p="18"
          bg="surface"
          :radius="16"
          :br="1"
          bc="normal15"
          class="w100"
        >
          <el-text :size="13" :weight="800">{{ t('manage.blog.groups.editorialIdentity') }}</el-text>
          <el-grid cols="repeat(2, minmax(0, 1fr))" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.authorName') }}</el-text>
              <el-text-field
                v-model="draft.authorName"
                :actions="false"
                :placeholder="t('manage.blog.placeholders.authorName')"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.authorUrl') }}</el-text>
              <el-text-field
                v-model="draft.authorUrl"
                :actions="false"
                :placeholder="t('manage.blog.placeholders.authorUrl')"
              />
            </el-flex>
          </el-grid>
        </el-flex>

        <el-flex
          rules="csc"
          :gap="16"
          :p="18"
          bg="surface"
          :radius="16"
          :br="1"
          bc="normal15"
          class="w100"
        >
          <el-text :size="13" :weight="800">{{ t('manage.blog.groups.heroMedia') }}</el-text>
          <el-grid cols="repeat(2, minmax(0, 1fr))" :gap="12" class="w100">
            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.heroFullUrl') }}</el-text>
              <el-text-field
                v-model="draft.heroFullUrl"
                :actions="false"
                placeholder="/media/blog/hero.webp"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.heroThumbnailUrl') }}</el-text>
              <el-text-field
                v-model="draft.heroThumbnailUrl"
                :actions="false"
                placeholder="/media/blog/hero-thumb.webp"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.heroWidth') }}</el-text>
              <el-text-field
                v-model="draft.heroWidth"
                :actions="false"
                inputmode="numeric"
                placeholder="1600"
              />
            </el-flex>

            <el-flex rules="ccs" :gap="6">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.heroHeight') }}</el-text>
              <el-text-field
                v-model="draft.heroHeight"
                :actions="false"
                inputmode="numeric"
                placeholder="900"
              />
            </el-flex>
          </el-grid>
        </el-flex>

        <el-flex
          rules="csc"
          :gap="0"
          bg="surface"
          :radius="16"
          :br="1"
          bc="normal15"
          class="w100 ofh"
        >
          <el-flex rules="rsc" :gap="6" :p="10" class="w100 fw">
            <el-button
              v-for="code in blogLocales"
              :key="code"
              :label="t(`manage.blog.locales.${code}`)"
              :mode="activeLocale === code ? 'normal' : 'flat'"
              :color="activeLocale === code ? 'prim' : undefined"
              @click="activeLocale = code"
            />
          </el-flex>

          <el-divider />

          <el-flex
            rules="csc"
            :gap="12"
            :p="16"
            class="w100"
            :dir="activeDirection"
          >
            <el-grid cols="repeat(2, minmax(0, 1fr))" :gap="12" class="w100">
              <el-flex rules="ccs" :gap="6">
                <el-text :size="11" :weight="700">{{ t('manage.blog.fields.title') }}</el-text>
                <el-text-field
                  v-model="activeTitle"
                  :actions="false"
                  :placeholder="t('manage.blog.placeholders.title')"
                />
              </el-flex>

              <el-flex rules="ccs" :gap="6">
                <el-text :size="11" :weight="700">{{ t('manage.blog.fields.heroAlt') }}</el-text>
                <el-text-field
                  v-model="activeHeroAlt"
                  :actions="false"
                  :placeholder="t('manage.blog.placeholders.heroAlt')"
                />
              </el-flex>
            </el-grid>

            <el-flex rules="ccs" :gap="6" class="w100">
              <el-text :size="11" :weight="700">{{ t('manage.blog.fields.description') }}</el-text>
              <el-text-field
                v-model="activeDescription"
                type="textarea"
                :rows="3"
                :actions="false"
                :placeholder="t('manage.blog.placeholders.description')"
              />
            </el-flex>

            <ManageBlogMarkdownEditor
              v-model="activeBody"
              :locale="activeLocale"
              :placeholder="t('manage.blog.placeholders.markdown')"
            />
          </el-flex>
        </el-flex>

        <el-flex
          rules="rsc"
          :gap="10"
          :p="14"
          class="w100"
          :bg="validationTone.bg"
          :radius="14"
          :br="1"
          :bc="validationTone.border"
        >
          <el-icon :icon="validationTone.icon" :color="validationTone.color" :size="18" />

          <el-flex rules="ccs" :gap="4" class="fg100">
            <template v-if="!validation">
              <el-text :color="validationTone.color" :size="12" :weight="700">
                {{ t('manage.blog.editor.untouched') }}
              </el-text>
            </template>

            <template v-else-if="validation.ok">
              <el-text :color="validationTone.color" :size="12" :weight="800">
                {{ t('manage.blog.editor.validTitle') }}
              </el-text>
              <el-text :color="validationTone.color" :size="11">
                {{ t('manage.blog.editor.validDetail') }}
              </el-text>
            </template>

            <template v-else>
              <el-text :color="validationTone.color" :size="12" :weight="800">
                {{ t('manage.blog.editor.invalidTitle') }}
              </el-text>
              <el-text :color="validationTone.color" :size="11">
                {{ t('manage.blog.editor.invalidDetail', { count: validationIssues.length }) }}
              </el-text>

              <el-flex rules="ccs" :gap="5" class="w100">
                <el-flex
                  v-for="(issue, index) in validationIssues"
                  :key="`${issue.path}-${index}`"
                  rules="rsc"
                  :gap="6"
                  class="w100"
                >
                  <el-text color="red" :size="10" :weight="800" font="monospace">{{ issue.path }}</el-text>
                  <el-text color="red" :size="11">{{ issue.message }}</el-text>
                </el-flex>
              </el-flex>
            </template>
          </el-flex>
        </el-flex>
      </template>
    </template>
  </el-flex>
</template>
