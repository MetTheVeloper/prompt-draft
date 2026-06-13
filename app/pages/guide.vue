<script setup lang="ts">
import { promptModules } from '~/modules/registry'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { mobile, mini } = useScreen()

const pageCols = computed(() => {
  if (mobile.value) return 1

  return ['220px', 'minmax(0, 1fr)']
})

const contentPadding = computed(() => {
  return mobile.value || mini.value ? 16 : 24
})

const queryModuleKey = computed(() => {
  return typeof route.query.module === 'string'
    ? route.query.module
    : undefined
})

const moduleItems = computed(() => {
  return promptModules.map((module) => {
    const titleKey = `modules.${module.key}.title`
    const descriptionKey = `modules.${module.key}.description`

    return {
      ...module,
      title: getTranslation(titleKey, module.key),
      description: getTranslation(descriptionKey, ''),
    }
  })
})

const hasValidModuleQuery = computed(() => {
  if (!queryModuleKey.value) return false

  return moduleItems.value.some((module) => module.key === queryModuleKey.value)
})

const showModuleList = computed(() => {
  return !mobile.value || !hasValidModuleQuery.value
})

const showModuleDetails = computed(() => {
  return !mobile.value || hasValidModuleQuery.value
})

const activeModuleKey = computed(() => {
  if (queryModuleKey.value && hasValidModuleQuery.value) {
    return queryModuleKey.value
  }

  if (mobile.value) {
    return undefined
  }

  return moduleItems.value[0]?.key
})

const activeModule = computed(() => {
  if (!activeModuleKey.value) return undefined

  return moduleItems.value.find((module) => module.key === activeModuleKey.value)
})

const activeFields = computed(() => {
  if (!activeModule.value?.fields) return []

  return Object.entries(activeModule.value.fields).map(([key, field]) => {
    const fieldBaseKey = `modules.${activeModule.value?.key}.fields.${key}`

    return {
      key,
      field,
      label: getTranslation(`${fieldBaseKey}.label`, key),
      description: getTranslation(`${fieldBaseKey}.description`, ''),
      placeholder: getTranslation(`${fieldBaseKey}.placeholder`, ''),
      guide: getTranslation(`guide.modules.${activeModule.value?.key}.fields.${key}.guide`, ''),
      tip: getTranslation(`guide.modules.${activeModule.value?.key}.fields.${key}.tip`, ''),
      optionsCount: getFieldOptionsCount(field),
      categoriesCount: getFieldCategoriesCount(field),
      isCustomText: key === 'customText',
      isExtraDetails: key === 'extraDetails',
    }
  })
})

const activeGuide = computed(() => {
  if (!activeModule.value) {
    return {
      overview: '',
      whenToUse: '',
      workflow: '',
    }
  }

  const baseKey = `guide.modules.${activeModule.value.key}`

  return {
    overview: getTranslation(`${baseKey}.overview`, ''),
    whenToUse: getTranslation(`${baseKey}.whenToUse`, ''),
    workflow: getTranslation(`${baseKey}.workflow`, ''),
  }
})

function getTranslation(key: string, fallback = '') {
  const value = t(key)

  return value === key ? fallback : value
}

function getFieldOptionsCount(field: any) {
  if (!Array.isArray(field?.options)) return 0

  return field.options.length
}

function getFieldCategoriesCount(field: any) {
  if (!Array.isArray(field?.options)) return 0

  const categories = new Set(
    field.options
      .map((option: any) => option.category)
      .filter(Boolean),
  )

  return categories.size
}

function selectModule(moduleKey: string) {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      module: moduleKey,
    },
  })
}

function backToModuleList() {
  const query = { ...route.query }

  delete query.module

  router.push({
    path: route.path,
    query,
  })
}
</script>

<template>
  <el-grid type="main" class="w100" :cols="pageCols" :gap="16" :p="16">
    <el-flex v-if="showModuleList" rules="csc" class="w100" :gap="12">
      <el-grid :gap="6" class="w100">
        <el-text type="h1" :size="22" weight="700">
          {{ $t('guide.title') }}
        </el-text>

        <el-text type="p" :size="13" color="normal60">
          {{ $t('guide.description') }}
        </el-text>
      </el-grid>

      <el-grid :gap="8" :cols="mobile ? 1 : 1" class="w100">
        <el-grid v-for="module in moduleItems" :key="module.key" :gap="8" :p="12" :radius="14" :br="1"
          :effect="{ color: module.key === activeModuleKey ? 'blue0' : 'prim25' }"
          :bc="module.key === activeModuleKey ? 'prim' : 'normal5'"
          :bg="module.key === activeModuleKey ? 'prim10' : 'normal5'" style="cursor: pointer"
          @click="selectModule(module.key)">
          <el-flex rules="rsc" :gap="10">
            <el-icon v-if="module.icon" :icon="module.icon" :size="26"
              :color="module.key === activeModuleKey ? 'prim' : 'normal60'" />

            <el-grid :gap="4">
              <el-text :size="12" weight="700" class="lh1">
                {{ module.title }}
              </el-text>

              <el-text :size="12" color="normal50" class="lh1" v-if="false">
                {{ module.key }}
              </el-text>
            </el-grid>
          </el-flex>
        </el-grid>
      </el-grid>
    </el-flex>

    <el-flex v-if="activeModule && showModuleDetails" rules="csc" class="w100" :gap="20" :p="contentPadding"
      :radius="16" bg="surface">
      <el-flex v-if="mobile" rules="rsc" :gap="8" :p="[8, 10]" :radius="12" bg="normal10" bd="b4"
        class="w100 crp post t0 zi200" @click="backToModuleList">
        <el-icon icon="arrow-left" :size="18" color="normal70" />

        <el-text :size="13" weight="700" color="normal70">
          {{ $t('guide.common.backToModules') }}
        </el-text>
      </el-flex>

      <el-grid :gap="10" class="w100">
        <el-flex rules="rsc" :gap="12">
          <el-icon v-if="activeModule.icon" :icon="activeModule.icon" :size="mini ? 40 : 56" color="prim" />

          <el-grid :gap="0">
            <el-text type="h1" :size="mini ? 20 : 28" weight="800">
              {{ activeModule.title }}
            </el-text>

            <el-text :size="13" color="normal50">
              {{ activeModule.key }}
            </el-text>
          </el-grid>
        </el-flex>

        <el-text v-if="activeModule.description" type="p" :size="mini ? 14 : 16" color="normal70">
          {{ activeModule.description }}
        </el-text>

        <el-grid v-if="activeGuide.overview || activeGuide.whenToUse || activeGuide.workflow" :gap="12" class="w100">
          <el-flex rules="ccs" v-if="activeGuide.overview" :gap="6" :p="16" :radius="14" :br="1" bc="normal10"
            bg="normal0">
            <el-text :size="15" weight="800" marker="blue15">
              {{ getTranslation('guide.common.overview', 'Overview') }}
            </el-text>

            <el-text type="p" :size="14" color="normal70">
              {{ activeGuide.overview }}
            </el-text>
          </el-flex>

          <el-flex rules="ccs" v-if="activeGuide.whenToUse" :gap="6" :p="16" :radius="14" :br="1" bc="normal10"
            bg="normal0">
            <el-text :size="15" weight="800" marker="green15">
              {{ getTranslation('guide.common.whenToUse', 'When to use') }}
            </el-text>

            <el-text type="p" :size="14" color="normal70">
              {{ activeGuide.whenToUse }}
            </el-text>
          </el-flex>

          <el-flex rules="ccs" v-if="activeGuide.workflow" :gap="6" :p="16" :radius="14" :br="1" bc="normal10"
            bg="normal0">
            <el-text :size="15" weight="800" marker="orange15">
              {{ getTranslation('guide.common.recommendedWorkflow', 'Recommended workflow') }}
            </el-text>

            <el-text type="p" :size="14" color="normal70">
              {{ activeGuide.workflow }}
            </el-text>
          </el-flex>
        </el-grid>
      </el-grid>

      <el-grid :gap="12" class="w100">
        <el-text type="h2" :size="20" weight="800" icon="settings">
          {{ $t('guide.common.fields') }}
        </el-text>

        <el-grid :gap="12">
          <el-grid v-for="item in activeFields" :key="item.key" :gap="10" :p="16" :radius="14" :br="1" bc="normal10"
            bg="normal0">
            <el-flex :rules="mini ? 'css' : 'rbc'" :gap="12">
              <el-grid :gap="5">
                <el-flex rules="rsc">
                  <el-text :size="16" weight="800">
                    {{ item.label }}
                  </el-text>

                  <el-text v-if="item.categoriesCount" :size="12" :p="[4, 8]" :radius="100" marker="green15">
                    {{ $t('guide.common.categories', { d: item.categoriesCount }) }}
                  </el-text>
                  <el-text v-if="item.optionsCount" :size="12" :p="[4, 8]" :radius="100" marker="blue15">
                    {{ $t('guide.common.options', { d: item.optionsCount }) }}
                  </el-text>

                </el-flex>

                <el-text :size="12" color="normal50">
                  {{ item.key }}
                </el-text>
              </el-grid>

              <el-flex rules="rsc" :gap="16" wrap>
                <el-text v-if="item.isCustomText" :size="12" :p="[4, 8]" :radius="100" marker="orange15">
                  {{ $t('guide.common.override') }}
                </el-text>

                <el-text v-if="item.isExtraDetails" :size="12" :p="[4, 8]" :radius="100" marker="normal15">
                  {{ $t('guide.common.optional') }}
                </el-text>
              </el-flex>
            </el-flex>

            <el-text v-if="item.description" type="p" :size="14" color="normal70">
              {{ item.description }}
            </el-text>

            <el-flex rules="ccs" v-if="item.guide" :gap="6" :p="12" :radius="12" bg="blue5">
              <el-text :size="13" weight="800" marker="blue20">
                {{ getTranslation('guide.common.fieldGuide', 'Guide') }}
              </el-text>

              <el-text type="p" :size="13" color="normal70">
                {{ item.guide }}
              </el-text>
            </el-flex>

            <el-flex rules="ccs" v-if="item.tip" :gap="6" :p="12" :radius="12" bg="green5">
              <el-text :size="13" weight="800" marker="green20">
                {{ getTranslation('guide.common.tip', 'Tip') }}
              </el-text>

              <el-text type="p" :size="13" color="normal70">
                {{ item.tip }}
              </el-text>
            </el-flex>

            <el-text v-if="item.placeholder && false" :size="13" color="normal50">
              Placeholder: {{ item.placeholder }}
            </el-text>

            <el-text v-if="item.isCustomText" type="p" :size="12" color="normal80">
              {{ $t('guide.common.customTextNote') }}
            </el-text>

            <el-text v-if="item.isExtraDetails" type="p" :size="12" color="normal80">
              {{ $t('guide.common.extraDetailsNote') }}
            </el-text>
          </el-grid>
        </el-grid>
      </el-grid>
    </el-flex>
  </el-grid>
</template>