<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { StyleModule } from '../../../modules/style.module'
import { compileStyle, getStylePresetValues, type StyleValues } from '../../../utils/compileStyle'

const values = reactive<StyleValues>({
  preset: '',
  medium: '',
  realism: '',
  genre: '',
  intensity: '',
  customText: ''
})

const isAdvancedOpen = ref(false)
const isCopied = ref(false)

const presetKeys = Object.keys(StyleModule.presets) as Array<keyof typeof StyleModule.presets>

const output = computed(() => compileStyle(values))

const isCustomOverride = computed(() => Boolean(values.customText?.trim()))

function applyPreset(presetKey: keyof typeof StyleModule.presets) {
  const presetValues = getStylePresetValues(presetKey)

  values.preset = presetValues.preset || ''
  values.medium = presetValues.medium || ''
  values.realism = presetValues.realism || ''
  values.genre = presetValues.genre || ''
  values.intensity = presetValues.intensity || ''
}

function clearStyle() {
  values.preset = ''
  values.medium = ''
  values.realism = ''
  values.genre = ''
  values.intensity = ''
  values.customText = ''
}

async function copyOutput() {
  if (!output.value) return

  try {
    await navigator.clipboard.writeText(output.value)
    isCopied.value = true

    window.setTimeout(() => {
      isCopied.value = false
    }, 1500)
  } catch (error) {
    console.error('Copy failed:', error)
  }
}
</script>

<template>
  <section class="module-panel">
    <header class="module-panel__header">
      <div class="module-panel__title-wrap">
        <span class="module-panel__eyebrow">Key Module</span>
        <h2>{{ StyleModule.label }}</h2>
        <p>{{ StyleModule.description }}</p>
      </div>

      <button
        type="button"
        class="module-panel__clear"
        @click="clearStyle"
      >
        Clear
      </button>
    </header>

    <div class="module-panel__section">
      <div class="module-panel__section-head">
        <h3>Presets</h3>
        <span>Choose a base style quickly</span>
      </div>

      <div class="module-panel__chips">
        <button
          v-for="presetKey in presetKeys"
          :key="presetKey"
          type="button"
          class="module-panel__chip"
          :class="{ 'is-active': values.preset === StyleModule.presets[presetKey].values.preset }"
          @click="applyPreset(presetKey)"
        >
          {{ StyleModule.presets[presetKey].label }}
        </button>
      </div>
    </div>

    <label class="module-panel__custom">
      <span>
        Custom Style Output
        <small>Overrides all selected fields when filled</small>
      </span>

      <textarea
        v-model="values.customText"
        rows="3"
        placeholder="Write a complete custom style phrase..."
      />
    </label>

    <div
      v-if="isCustomOverride"
      class="module-panel__notice"
    >
      Custom override is active. Form options are ignored in compiled output.
    </div>

    <button
      type="button"
      class="module-panel__advanced-toggle"
      @click="isAdvancedOpen = !isAdvancedOpen"
    >
      <span>Advanced Options</span>
      <span>{{ isAdvancedOpen ? '−' : '+' }}</span>
    </button>

    <div
      v-if="isAdvancedOpen"
      class="module-panel__advanced"
    >
      <label>
        Preset
        <select v-model="values.preset">
          <option value="">None</option>
          <option
            v-for="option in StyleModule.fields.preset.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        Medium
        <select v-model="values.medium">
          <option value="">None</option>
          <option
            v-for="option in StyleModule.fields.medium.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        Realism
        <select v-model="values.realism">
          <option value="">None</option>
          <option
            v-for="option in StyleModule.fields.realism.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        Genre
        <select v-model="values.genre">
          <option value="">None</option>
          <option
            v-for="option in StyleModule.fields.genre.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        Intensity
        <select v-model="values.intensity">
          <option value="">None</option>
          <option
            v-for="option in StyleModule.fields.intensity.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="module-panel__output">
      <div class="module-panel__output-head">
        <h3>Compiled Style</h3>

        <button
          type="button"
          :disabled="!output"
          class="module-panel__copy"
          @click="copyOutput"
        >
          {{ isCopied ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <p v-if="output">{{ output }}</p>
      <p v-else class="module-panel__empty">No style selected yet.</p>
    </div>
  </section>
</template>

<style scoped>
.module-panel {
  display: grid;
  gap: 20px;
  padding: clamp(16px, 3vw, 24px);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.28);
}

.module-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.module-panel__title-wrap {
  display: grid;
  gap: 6px;
}

.module-panel__eyebrow {
  font-size: 12px;
  opacity: 0.55;
}

.module-panel h2,
.module-panel h3,
.module-panel p {
  margin: 0;
}

.module-panel h2 {
  font-size: clamp(22px, 4vw, 28px);
}

.module-panel p {
  line-height: 1.7;
  opacity: 0.72;
}

.module-panel__clear,
.module-panel__copy,
.module-panel__chip,
.module-panel__advanced-toggle {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  font: inherit;
}

.module-panel__clear,
.module-panel__copy {
  min-width: 64px;
  padding: 9px 12px;
  border-radius: 12px;
}

.module-panel__section {
  display: grid;
  gap: 12px;
}

.module-panel__section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.module-panel__section-head span {
  font-size: 13px;
  opacity: 0.55;
}

.module-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.module-panel__chip {
  padding: 10px 14px;
  border-radius: 999px;
}

.module-panel__chip.is-active {
  border-color: rgba(0, 0, 0, 0.65);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.55);
}

.module-panel__custom {
  display: grid;
  gap: 8px;
  font-weight: 700;
}

.module-panel__custom span {
  display: grid;
  gap: 4px;
}

.module-panel__custom small {
  font-weight: 400;
  opacity: 0.55;
}

.module-panel textarea,
.module-panel select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 14px;
  background: #fff;
  font: inherit;
}

.module-panel textarea {
  resize: vertical;
  min-height: 96px;
}

.module-panel__notice {
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff6d8;
  color: #6b4b00;
  line-height: 1.6;
}

.module-panel__advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 800;
}

.module-panel__advanced {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.module-panel__advanced label {
  display: grid;
  gap: 8px;
  font-weight: 700;
}

.module-panel__output {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.52);
}

.module-panel__output-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-panel__copy:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.module-panel__empty {
  opacity: 0.5;
}

@media (max-width: 640px) {
  .module-panel {
    border-radius: 18px;
  }

  .module-panel__header,
  .module-panel__section-head,
  .module-panel__output-head {
    align-items: stretch;
    flex-direction: column;
  }

  .module-panel__clear,
  .module-panel__copy {
    width: 100%;
  }

  .module-panel__advanced {
    grid-template-columns: 1fr;
  }

  .module-panel__chips {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>