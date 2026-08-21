<script setup lang="ts">
import { computed, reactive } from "vue"
import type { ElDropdownValue } from "~/types/dropdown"
import type { PromptVariable, PromptVariableType } from "~/modules/types"
import type {
  VariableBlueprint,
  VariableBlueprintGroupSlot,
  VariableBlueprintRepeatableGroup,
  VariableBlueprintSlot,
} from "~/modules/variables.blueprints"
import {
  createUniqueVariableKey,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
} from "~/utils/promptVariables"

type BlueprintEditorController = { submit: () => boolean }
type BlueprintTypeOption = { value: PromptVariableType; label: string }

type BlueprintDraftSlot = {
  id: string
  enabled: boolean
  key: string
  value: string
  description: string
  type: PromptVariableType
  optional: boolean
  typeEditable: boolean
}

type BlueprintDraftGroup = {
  id: string
  source: "static" | "repeatable" | "custom"
  sourceGroupId?: string
  label: string
  description?: string
  slots: BlueprintDraftSlot[]
}

const props = withDefaults(defineProps<{
  blueprint: VariableBlueprint
  existingKeys?: string[]
  typeOptions?: BlueprintTypeOption[]
  controller?: BlueprintEditorController
  onApply?: (variables: Array<Omit<PromptVariable, "id">>) => void
}>(), {
  existingKeys: () => [],
  typeOptions: () => [],
})

const emit = defineEmits<{ (event: "close"): void }>()
const { mobile } = useScreen()

const fallbackTypeOptions: BlueprintTypeOption[] = [
  { value: "text", label: "Text" },
  { value: "subject", label: "Subject" },
  { value: "reference", label: "Reference" },
  { value: "object", label: "Object" },
  { value: "color", label: "Color" },
  { value: "font", label: "Font" },
  { value: "custom", label: "Custom" },
]

const availableTypeOptions = computed(() => {
  return props.typeOptions.length ? props.typeOptions : fallbackTypeOptions
})

const draftGroups = reactive<BlueprintDraftGroup[]>([])
const groupCounts = reactive<Record<string, number>>({})
let customSequence = 0

function legacyPatternValue(pattern: string | undefined, index: number) {
  return String(pattern || "").replaceAll("{index}", String(index))
}

function indexedPatternValue(pattern: string | undefined, index: number) {
  return String(pattern || "").replace("#", String(index))
}

function hashCount(value: string) {
  return (String(value || "").match(/#/g) || []).length
}

function normalizedExternalKeys() {
  return props.existingKeys.map(normalizeVariableKey).filter(Boolean)
}

function nonRepeatableDraftSlots() {
  return draftGroups
    .filter((group) => group.source !== "repeatable")
    .flatMap((group) => group.slots)
}

function usedKeysForCustomAllocation() {
  return Array.from(new Set([
    ...normalizedExternalKeys(),
    ...nonRepeatableDraftSlots()
      .map((slot) => normalizeVariableKey(slot.key))
      .filter(Boolean),
  ]))
}

function makeStaticSlot(slot: VariableBlueprintSlot, usedKeys: string[]): BlueprintDraftSlot {
  const requestedKey = normalizeVariableKey(slot.key) || "variable"
  const key = createUniqueVariableKey(requestedKey, usedKeys)
  usedKeys.push(key)

  return {
    id: slot.id,
    enabled: !slot.optional,
    key,
    value: slot.value || "",
    description: slot.description || slot.key,
    type: slot.type,
    optional: slot.optional === true,
    typeEditable: slot.typeEditable === true,
  }
}

function makeRepeatableTemplateSlot(slot: VariableBlueprintGroupSlot): BlueprintDraftSlot {
  return {
    id: slot.id,
    enabled: !slot.optional,
    key: slot.keyPattern,
    value: slot.valuePattern || "",
    description: slot.descriptionPattern || slot.id,
    type: slot.type,
    optional: slot.optional === true,
    typeEditable: slot.typeEditable === true,
  }
}

function groupCount(group: BlueprintDraftGroup) {
  if (group.source !== "repeatable" || !group.sourceGroupId) return 1
  return groupCounts[group.sourceGroupId] || 1
}

function updateGroupCount(group: VariableBlueprintRepeatableGroup, value: ElDropdownValue) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return
  groupCounts[group.id] = Math.min(group.max, Math.max(group.min, numeric))
}

function countOptions(group: VariableBlueprintRepeatableGroup) {
  return Array.from({ length: group.max - group.min + 1 }, (_, index) => {
    const value = group.min + index
    return { value, label: String(value) }
  })
}

function nextCustomIndex() {
  const customSet = props.blueprint.customSet
  if (!customSet) return 1

  const usedKeys = new Set(usedKeysForCustomAllocation())

  for (let index = 1; index <= 999; index += 1) {
    const key = normalizeVariableKey(legacyPatternValue(customSet.keyPattern, index))
    if (key && !usedKeys.has(key) && !isReservedVariableKey(key)) return index
  }

  customSequence += 1
  return 1000 + customSequence
}

function addCustomVariable() {
  const customSet = props.blueprint.customSet
  if (!customSet) return

  const currentCount = draftGroups.filter((group) => group.source === "custom").length
  if (currentCount >= customSet.max) return

  const semanticIndex = nextCustomIndex()
  draftGroups.push({
    id: `custom:${semanticIndex}:${Date.now()}`,
    source: "custom",
    label: `Variable ${currentCount + 1}`,
    slots: [
      {
        id: `customVariable:${semanticIndex}`,
        enabled: true,
        key: legacyPatternValue(customSet.keyPattern, semanticIndex),
        value: "",
        description: `Custom variable ${currentCount + 1}`,
        type: customSet.defaultType,
        optional: false,
        typeEditable: true,
      },
    ],
  })
}

function removeCustomVariable(groupId: string) {
  const customSet = props.blueprint.customSet
  if (!customSet) return

  const customGroups = draftGroups.filter((group) => group.source === "custom")
  if (customGroups.length <= customSet.min) return

  const index = draftGroups.findIndex((group) => group.id === groupId)
  if (index >= 0) draftGroups.splice(index, 1)

  draftGroups
    .filter((group) => group.source === "custom")
    .forEach((group, groupIndex) => {
      group.label = `Variable ${groupIndex + 1}`
      if (group.slots[0]) group.slots[0].description = `Custom variable ${groupIndex + 1}`
    })
}

function initializeDraft() {
  const usedKeys = normalizedExternalKeys()

  if (props.blueprint.slots?.length) {
    draftGroups.push({
      id: "static",
      source: "static",
      label: "Variables",
      slots: props.blueprint.slots.map((slot) => makeStaticSlot(slot, usedKeys)),
    })
  }

  props.blueprint.groups?.forEach((group) => {
    groupCounts[group.id] = group.defaultCount
    draftGroups.push({
      id: `repeatable:${group.id}`,
      source: "repeatable",
      sourceGroupId: group.id,
      label: `${group.label} template`,
      description: group.description,
      slots: group.slots.map(makeRepeatableTemplateSlot),
    })
  })

  if (props.blueprint.customSet) {
    for (let index = 0; index < props.blueprint.customSet.defaultCount; index += 1) {
      addCustomVariable()
    }
  }
}

initializeDraft()

function typeLabel(type: PromptVariableType) {
  return availableTypeOptions.value.find((option) => option.value === type)?.label || type
}

function updateSlotType(slot: BlueprintDraftSlot, value: ElDropdownValue) {
  if (!slot.typeEditable) return
  const nextType = String(value || "") as PromptVariableType
  if (!availableTypeOptions.value.some((option) => option.value === nextType)) return
  slot.type = nextType
}

function ordinarySlotIssue(slot: BlueprintDraftSlot) {
  if (!slot.enabled) return ""

  const key = normalizeVariableKey(slot.key)
  if (!isValidVariableKey(key)) return "Invalid variable key"
  if (isReservedVariableKey(key)) return "Reserved variable key"
  if (normalizedExternalKeys().includes(key)) return "Variable key already exists"

  const enabledSlots = nonRepeatableDraftSlots().filter((candidate) => candidate.enabled)
  const duplicate = enabledSlots.some((candidate) => {
    return candidate !== slot && normalizeVariableKey(candidate.key) === key
  })

  return duplicate ? "Duplicate variable key" : ""
}

function repeatableSlotIssue(group: BlueprintDraftGroup, slot: BlueprintDraftSlot) {
  if (!slot.enabled) return ""

  const count = groupCount(group)
  const keyHashes = hashCount(slot.key)
  const valueHashes = hashCount(slot.value)

  if (count > 1 && keyHashes !== 1) {
    return "Key must contain exactly one # when creating multiple profiles"
  }

  if (count === 1 && keyHashes > 1) {
    return "Key can contain at most one #"
  }

  if (valueHashes > 1) {
    return "Initial value can contain at most one #"
  }

  const previewIndex = 1
  const previewKey = normalizeVariableKey(
    keyHashes === 1 ? indexedPatternValue(slot.key, previewIndex) : slot.key,
  )

  if (!isValidVariableKey(previewKey)) return "Invalid variable key pattern"
  if (isReservedVariableKey(previewKey)) return "Reserved variable key pattern"

  const enabledSlots = group.slots.filter((candidate) => candidate.enabled)
  const duplicatePattern = enabledSlots.some((candidate) => {
    if (candidate === slot) return false
    const candidateHashes = hashCount(candidate.key)
    const candidateKey = normalizeVariableKey(
      candidateHashes === 1
        ? indexedPatternValue(candidate.key, previewIndex)
        : candidate.key,
    )
    return candidateKey === previewKey
  })

  if (duplicatePattern) return "Duplicate variable key pattern"

  if (count === 1 && keyHashes === 0 && normalizedExternalKeys().includes(previewKey)) {
    return "Variable key already exists"
  }

  return ""
}

function slotIssue(group: BlueprintDraftGroup, slot: BlueprintDraftSlot) {
  return group.source === "repeatable"
    ? repeatableSlotIssue(group, slot)
    : ordinarySlotIssue(slot)
}

const hasIssues = computed(() => {
  return draftGroups.some((group) => {
    return group.slots.some((slot) => !!slotIssue(group, slot))
  })
})

const enabledCount = computed(() => {
  return draftGroups.reduce((count, group) => {
    const selected = group.slots.filter((slot) => slot.enabled).length
    return count + selected * (group.source === "repeatable" ? groupCount(group) : 1)
  }, 0)
})

const customVariableCount = computed(() => {
  return draftGroups.filter((group) => group.source === "custom").length
})

function canRemoveCustomVariable() {
  const customSet = props.blueprint.customSet
  return Boolean(customSet && customVariableCount.value > customSet.min)
}

function canAddCustomVariable() {
  const customSet = props.blueprint.customSet
  return Boolean(customSet && customVariableCount.value < customSet.max)
}

function expandedKey(slot: BlueprintDraftSlot, index: number) {
  return normalizeVariableKey(
    hashCount(slot.key) === 1 ? indexedPatternValue(slot.key, index) : slot.key,
  )
}

function expandedValue(slot: BlueprintDraftSlot, index: number) {
  return hashCount(slot.value) === 1
    ? indexedPatternValue(slot.value, index)
    : slot.value
}

function expandedDescription(slot: BlueprintDraftSlot, index: number) {
  return hashCount(slot.description) >= 1
    ? slot.description.replaceAll("#", String(index))
    : slot.description
}

function findAvailableProfileIndexes(
  group: BlueprintDraftGroup,
  count: number,
  usedKeys: Set<string>,
) {
  const enabledSlots = group.slots.filter((slot) => slot.enabled)
  const reservationSlots = group.slots.filter((slot) => {
    return slot.enabled || hashCount(slot.key) === 1
  })
  const indexes: number[] = []

  for (let index = 1; index <= 999 && indexes.length < count; index += 1) {
    const reservedProfileKeys = reservationSlots.map((slot) => expandedKey(slot, index))
    const generatedKeys = enabledSlots.map((slot) => expandedKey(slot, index))
    const uniqueGeneratedKeys = new Set(generatedKeys)

    if (uniqueGeneratedKeys.size !== generatedKeys.length) continue
    if (reservedProfileKeys.some((key) => !isValidVariableKey(key) || isReservedVariableKey(key))) continue
    if (reservedProfileKeys.some((key) => usedKeys.has(key))) continue

    indexes.push(index)
    reservedProfileKeys.forEach((key) => usedKeys.add(key))
  }

  return indexes
}

function createOrdinaryVariable(
  slot: BlueprintDraftSlot,
): Omit<PromptVariable, "id"> {
  return {
    key: normalizeVariableKey(slot.key),
    value: slot.value || "",
    description: slot.description || "",
    type: slot.type,
    enabled: true,
    source: "user",
  }
}

function createIndexedVariable(
  slot: BlueprintDraftSlot,
  index: number,
): Omit<PromptVariable, "id"> {
  return {
    key: expandedKey(slot, index),
    value: expandedValue(slot, index) || "",
    description: expandedDescription(slot, index) || "",
    type: slot.type,
    enabled: true,
    source: "user",
  }
}

function createBlueprintVariables() {
  if (hasIssues.value || enabledCount.value === 0) return false

  const usedKeys = new Set(normalizedExternalKeys())
  const created: Array<Omit<PromptVariable, "id">> = []

  for (const group of draftGroups) {
    const enabledSlots = group.slots.filter((slot) => slot.enabled)
    if (!enabledSlots.length) continue

    if (group.source !== "repeatable") {
      for (const slot of enabledSlots) {
        const variable = createOrdinaryVariable(slot)
        if (usedKeys.has(variable.key)) return false
        usedKeys.add(variable.key)
        created.push(variable)
      }
      continue
    }

    const count = groupCount(group)
    const indexes = findAvailableProfileIndexes(group, count, usedKeys)
    if (indexes.length !== count) return false

    indexes.forEach((index) => {
      enabledSlots.forEach((slot) => {
        created.push(createIndexedVariable(slot, index))
      })
    })
  }

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
      <el-text :size="13" :weight="700" :icon="blueprint.icon || 'auto_awesome'">
        {{ blueprint.label }}
      </el-text>
      <el-text :size="11" color="normal55">
        {{ blueprint.description }}
      </el-text>
    </el-flex>

    <el-flex
      v-for="group in blueprint.groups || []"
      :key="`count:${group.id}`"
      rules="rbc"
      :gap="12"
      :p="12"
      :radius="12"
      bg="normal5"
    >
      <el-flex rules="ccs" :gap="2">
        <el-text :size="11" :weight="700">{{ group.label }} profiles</el-text>
        <el-text :size="10" color="normal45">
          Configure one template and choose how many indexed profiles to create.
        </el-text>
      </el-flex>

      <el-dropdown
        :model-value="groupCounts[group.id]"
        :items="countOptions(group)"
        item-value="value"
        item-label="label"
        @update:model-value="updateGroupCount(group, $event)"
      />
    </el-flex>

    <el-flex v-if="blueprint.customSet" rules="rbc" :gap="10">
      <el-flex rules="ccs" :gap="2">
        <el-text :size="11" :weight="700">Custom variables</el-text>
        <el-text :size="10" color="normal45">
          Add any semantic handles you need and choose each variable type independently.
        </el-text>
      </el-flex>

      <el-button
        label="Add variable"
        icon="add"
        color="blue"
        mode="flat"
        :size="11"
        :disable="!canAddCustomVariable()"
        @click="addCustomVariable"
      />
    </el-flex>

    <el-flex rules="rbc" :gap="8">
      <el-text :size="11" :weight="700">Variables</el-text>
      <el-text :size="10" color="normal45">{{ enabledCount }} will be created</el-text>
    </el-flex>

    <div class="variable-blueprint__groups">
      <el-flex
        v-for="group in draftGroups"
        :key="group.id"
        rules="ccs"
        :gap="10"
        :p="12"
        :radius="12"
        :br="1"
        bc="normal10"
      >
        <el-flex rules="rbc" class="w100" :gap="10">
          <el-flex rules="ccs" :gap="2">
            <el-text :size="11" :weight="700">{{ group.label }}</el-text>
            <el-text v-if="group.description" :size="10" color="normal45">
              {{ group.description }}
            </el-text>
            <el-text v-if="group.source === 'repeatable' && groupCount(group) > 1" :size="10" color="blue60">
              Use exactly one # in every enabled key. A # in the value is optional and receives the same index.
            </el-text>
          </el-flex>

          <el-button
            v-if="group.source === 'custom'"
            label="Remove"
            icon="delete"
            color="red"
            mode="flat"
            :size="10"
            :disable="!canRemoveCustomVariable()"
            @click="removeCustomVariable(group.id)"
          />
        </el-flex>

        <div class="variable-blueprint__slots">
          <el-flex
            v-for="slot in group.slots"
            :key="`${group.id}:${slot.id}`"
            rules="ccs"
            :gap="8"
            :p="10"
            :radius="10"
            bg="normal5"
          >
            <el-flex rules="rbc" class="w100" :gap="10">
              <el-flex rules="lcc" :gap="8">
                <input
                  v-if="slot.optional"
                  v-model="slot.enabled"
                  type="checkbox"
                />
                <el-text :size="11" :weight="700">
                  {{ slot.description || slot.key }}
                </el-text>
              </el-flex>

              <el-text v-if="!slot.typeEditable" :size="10" color="normal45">
                {{ typeLabel(slot.type) }}
              </el-text>
            </el-flex>

            <el-grid :cols="mobile ? 1 : (slot.typeEditable ? 3 : 2)" :gap="8" class="w100">
              <label class="variable-blueprint__control">
                <el-text :size="10" color="normal45">
                  {{ group.source === 'repeatable' ? 'Key pattern' : 'Key' }}
                </el-text>
                <el-text-field
                  v-model="slot.key"
                  type="text"
                  :size="14"
                  :disabled="!slot.enabled"
                />
              </label>

              <div v-if="slot.typeEditable" class="variable-blueprint__control">
                <el-text :size="10" color="normal45">Type</el-text>
                <el-dropdown
                  :model-value="slot.type"
                  :items="availableTypeOptions"
                  item-value="value"
                  item-label="label"
                  :disabled="!slot.enabled"
                  @update:model-value="updateSlotType(slot, $event)"
                />
              </div>

              <label class="variable-blueprint__control">
                <el-text :size="10" color="normal45">
                  {{ group.source === 'repeatable' ? 'Initial value pattern' : 'Initial value' }}
                </el-text>
                <el-text-field
                  v-model="slot.value"
                  type="text"
                  :size="14"
                  :disabled="!slot.enabled"
                  support-variables
                  :editor-id="`variable-blueprint:${blueprint.id}:${group.id}:${slot.id}`"
                />
              </label>
            </el-grid>

            <el-text
              v-if="slotIssue(group, slot)"
              :size="10"
              color="orange"
              icon="warning"
              icon-color="orange"
            >
              {{ slotIssue(group, slot) }}
            </el-text>
          </el-flex>
        </div>
      </el-flex>
    </div>
  </div>
</template>

<style scoped>
.variable-blueprint {
  display: grid;
  gap: 12px;
  width: 100%;
  max-height: min(72vh, 720px);
  overflow: auto;
}

.variable-blueprint__groups,
.variable-blueprint__slots {
  display: grid;
  gap: 8px;
  width: 100%;
}

.variable-blueprint__control {
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
}
</style>
