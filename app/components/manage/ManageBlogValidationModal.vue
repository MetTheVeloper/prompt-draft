<script setup lang="ts">
import type { BlogValidationIssue } from '~/shared/blog-article'

const props = defineProps<{
  ok: boolean
  issues: BlogValidationIssue[]
}>()

const { t } = useI18n()
</script>

<template>
  <el-flex rules="csc" :gap="12" class="w100">
    <el-flex rules="rsc" :gap="10" class="w100">
      <el-icon
        :icon="props.ok ? 'check_circle' : 'error'"
        :color="props.ok ? 'normal70' : 'red'"
        :size="22"
      />
      <el-flex rules="ccs" :gap="4" class="fg100">
        <el-text :color="props.ok ? 'normal70' : 'red'" :size="13" :weight="800">
          {{ props.ok ? t('manage.blog.editor.validTitle') : t('manage.blog.editor.invalidTitle') }}
        </el-text>
        <el-text color="normal70" :size="11">
          {{
            props.ok
              ? t('manage.blog.editor.validDetail')
              : t('manage.blog.editor.invalidDetail', { count: props.issues.length })
          }}
        </el-text>
      </el-flex>
    </el-flex>

    <el-flex
      v-if="!props.ok && props.issues.length"
      rules="csc"
      :gap="8"
      class="w100"
    >
      <el-divider />
      <el-flex
        v-for="(issue, index) in props.issues"
        :key="`${issue.path}-${index}`"
        rules="ccs"
        :gap="3"
        :p="10"
        bg="normal5"
        :radius="10"
        class="w100"
      >
        <el-text color="red" :size="10" :weight="800" font="monospace">
          {{ issue.path }}
        </el-text>
        <el-text color="normal70" :size="11">
          {{ issue.message }}
        </el-text>
      </el-flex>
    </el-flex>
  </el-flex>
</template>
