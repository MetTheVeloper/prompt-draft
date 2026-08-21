<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type { PromptVariable, PromptVariableType } from "~/modules/types"
import type { VariableBlueprint } from "~/modules/variables.blueprints"
import {
  createUniqueVariableKey,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "~/utils/promptVariables"

type BlueprintEditorController = { submit: () => boolean }
type BlueprintDraftSlot = {
  id: string
  enabled: boolean
  key: string
  value: string
  description: string
  type: PromptVariableType
  optional: boolean
}

const props = withDefaults(defineProps<{
  blueprint: VariableBlueprint
  existingKeys?: string[]
  controller?: BlueprintEditorController
  onApply?: (variables: Array<Omit<PromptVariable, "id">>) => void
}>(), { existingKeys: () => [] })

const emit = defineEmits<{ (event: "close"): void }>()
const { mobile } = useScreen()

const repeatCount = reactive({ value: props.blueprint.repeatable?.defaultCount || 1 })
const countOptions = computed(() => {
  const repeatable = props.blueprint.repeatable
  if (!repeatable) return []
  return Array.from({ length: repeatable.max - repeatable.min + 1 }, (_, index) => {
    const value = repeatable.min + index
    return { value, label: String(value) }
  })
})

function patternValue(pattern: string | undefined, index: number) {
  return String(pattern || "").replaceAll("{index}", String(index))
}

function makeRepeatedSlot(index: number): BlueprintDraftSlot {
  const repeatable = props.blueprint.repeatable!
  return {
    id: `${repeatable.id}:${index}`,
    enabled: true,
    key: patternValue(repeatable.keyPattern, index),
    value: patternValue(repeatable.valuePattern, index),
    description: patternValue(repeatable.descriptionPattern, index),
    type: repeatable.type,
    optional: false,
  }
}

function initialSlots(): BlueprintDraftSlot[] {
  const slots = (props.blueprint.slots || []).map((slot) => ({
    id: slot.id,
    enabled: !slot.optional,
    key: slot.key,
    value: slot.value || "",
    description: slot.description || "",
    type: slot.type,
    optional: slot.optional === true,
  }))
  if (!props.blueprint.repeatable) return slots
  return [...slots, ...Array.from({ length: repeatCount.value }, (_, i) => makeRepeatedSlot(i + 1))]
}

const draftSlots = reactive<BlueprintDraftSlot[]>(initialSlots())

function syncRepeatableSlots() {
  const repeatable = props.blueprint.repeatable
  if (!repeatable) return
  const staticIds = new Set((props.blueprint.slots || []).map((slot) => slot.id))
  const staticDrafts = draftSlots.filter((slot) => staticIds.has(slot.id))
  const previous = new Map(draftSlots.filter((slot) => !staticIds.has(slot.id)).map((slot) => [slot.id, slot]))
  const repeated = Array.from({ length: repeatCount.value }, (_, i) => {
    const index = i + 1
    return previous.get(`${repeatable.id}:${index}`) || makeRepeatedSlot(index)
  })
  draftSlots.splice(0, draftSlots.length, ...staticDrafts, ...repeated)
}

watch(() => repeatCount.value, syncRepeatableSlots)

function updateRepeatCount(value: ElDropdownValue) {
  const numeric = Number(value)
  const repeatable = props.blueprint.repeatable
  if (!repeatable || !Number.isFinite(numeric)) return
  repeatCount.value = Math.min(repeatable.max, Math.max(repeatable.min, numeric))
}

function slotIssue(slot: BlueprintDraftSlot, slotIndex: number) {
  if (!slot.enabled) return ""
  const key = normalizeVariableKey(slot.key)
  if (!isValidVariableKey(key)) return "Invalid variable key"
  if (isReservedVariableKey(key)) return "Reserved variable key"
  const duplicate = draftSlots.some((candidate, index) =>
    index !== slotIndex && candidate.enabled && normalizeVariableKey(candidate.key) === key,
  )
  return duplicate ? "Duplicate variable key" : ""
}

const hasIssues = computed(() => draftSlots.some((slot, index) => !!slotIssue(slot, index)))
const enabledCount = computed(() => draftSlots.filter((slot) => slot.enabled).length)

function createBlueprintVariables() {
  if (hasIssues.value) return false
  const usedKeys = props.existingKeys.map(normalizeVariableKey).filter(Boolean)
  const created: Array<Omit<PromptVariable, "id">> = []
  draftSlots.forEach((slot) => {
    if (!slot.enabled) return
    const key = createUniqueVariableKey(normalizeVariableKey(slot.key), usedKeys)
    usedKeys.push(key)
    created.push({ key, value: slot.value || "", description: slot.description || "", type: slot.type, enabled: true, source: "user" })
  })
  if (!created.length) return false
  props.onApply?.(created)
  emit("close")
  return true
}

if (props.controller) props.controller.submit = createBlueprintVariables
</script>

<template>
  <div class="variable-blueprint">
    <el-flex rules="ccs" :gap="4">
      <el-text :size="13" :weight="700" :icon="blueprint.icon || 'auto_awesome'">{{ blueprint.label }}</el-text>
      <el-text :size="11" color="normal55">{{ blueprint.description }}</el-text>
    </el-flex>

    <el-flex v-if="blueprint.repeatable" rules="rbc" :gap="12" :p="12" :radius="12" bg="normal5">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="11" :weight="700">Count</el-text>
        <el-text :size="10" color="normal45">Choose how many variables this blueprint should create.</el-text>
      </el-flex>
      <el-dropdown :model-value="repeatCount.value" :items="countOptions" item-value="value" item-label="label" @update:model-value="updateRepeatCount" />
    </el-flex>

    <el-flex rules="rbc" :gap="8">
      <el-text :size="11" :weight="700">Variables</el-text>
      <el-text :size="10" color="normal45">{{ enabledCount }} selected</el-text>
    </el-flex>

    <div class="variable-blueprint__slots">
      <el-flex v-for="(slot, slotIndex) in draftSlots" :key="slot.id" rules="ccs" :gap="8" :p="12" :radius="12" :br="1" bc="normal10">
        <el-flex rules="rbc" class="w100" :gap="10">
          <el-flex rules="lcc" :gap="8">
            <input v-model="slot.enabled" type="checkbox" :disabled="!slot.optional && !blueprint.repeatable" />
            <el-text :size="11" :weight="700">{{ slot.description || slot.key }}</el-text>
          </el-flex>
          <el-text :size="10" color="normal45">{{ slot.type }}</el-text>
        </el-flex>

        <el-grid :cols="mobile ? 1 : 2" :gap="8" class="w100">
          <label class="variable-blueprint__control">
            <el-text :size="10" color="normal45">Key</el-text>
            <el-text-field v-model="slot.key" type="text" :size="14" :disabled="!slot.enabled" />
          </label>
          <label class="variable-blueprint__control">
            <el-text :size="10" color="normal45">Initial value</el-text>
            <el-text-field v-model="slot.value" type="text" :size="14" :disabled="!slot.enabled" support-variables :editor-id="`variable-blueprint:${blueprint.id}:${slot.id}`" />
          </label>
        </el-grid>

        <el-text v-if="slotIssue(slot, slotIndex)" :size="10" color="orange" icon="warning" icon-color="orange">{{ slotIssue(slot, slotIndex) }}</el-text>
      </el-flex>
    </div>
  </div>
</template>

<style scoped>
.variable-blueprint { display: grid; gap: 12px; width: 100%; max-height: min(72vh, 720px); overflow: auto; }
.variable-blueprint__slots { display: grid; gap: 8px; }
.variable-blueprint__control { display: grid; gap: 4px; width: 100%; }
</style>
