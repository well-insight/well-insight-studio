<script setup lang="ts">
import type { CanvasTheme } from '@/common/types/canvasTheme'
import type { PaletteColorKey } from '@/common/utils/themeBridge'
import {
  getBrandKeyForColorIndex,
  PALETTE_COLOR_KEYS,
  PALETTE_COLOR_LABELS,
  setBrandKeyForColorIndex,
} from '@/common/utils/themeBridge'
import ThemeColorField from './ThemeColorField.vue'

const props = withDefaults(defineProps<{
  modelValue: string[]
  canDisable?: boolean
  enabled?: boolean
  prefixLabels?: string[]
  showIndex?: boolean
  showBrandMapping?: boolean
}>(), {
  canDisable: false,
  enabled: true,
  prefixLabels: () => [],
  showIndex: false,
  showBrandMapping: false,
})

const theme = defineModel<CanvasTheme>('theme')

const emit = defineEmits<{
  'update:modelValue': [val: string[]]
  'update:enabled': [val: boolean]
  'brand-map-change': []
}>()

function getItemLabel(index: number): string | undefined {
  if (props.prefixLabels[index])
    return props.prefixLabels[index]
  if (props.showIndex)
    return `色值 ${index + 1}`
  return undefined
}

function getBrandSelection(index: number): PaletteColorKey | undefined {
  if (!theme.value)
    return undefined
  return getBrandKeyForColorIndex(theme.value, props.modelValue, index) ?? undefined
}

function onBrandSelectionChange(index: number, key: PaletteColorKey | null | undefined) {
  if (!theme.value)
    return
  setBrandKeyForColorIndex(theme.value, props.modelValue, index, key ?? null)
  emit('brand-map-change')
}

function updateColor(index: number, color: string) {
  const next = [...props.modelValue]
  next[index] = color
  emit('update:modelValue', next)
}

function addColor() {
  emit('update:modelValue', [...props.modelValue, '#333333'])
}

function removeColor(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function removeLast() {
  if (props.modelValue.length === 0)
    return
  emit('update:modelValue', props.modelValue.slice(0, -1))
}
</script>

<template>
  <div class="theme-color-list">
    <el-checkbox
      v-if="canDisable"
      :model-value="enabled"
      @update:model-value="emit('update:enabled', $event as boolean)"
    />
    <div v-show="!canDisable || enabled" class="theme-color-list__body">
      <div v-for="(color, index) in modelValue" :key="index" class="theme-color-list__item">
        <span v-if="getItemLabel(index)" class="theme-color-list__label">{{ getItemLabel(index) }}</span>
        <ThemeColorField
          :model-value="color"
          class="theme-color-list__field"
          @update:model-value="updateColor(index, $event)"
        />
        <el-select
          v-if="showBrandMapping && theme"
          :model-value="getBrandSelection(index)"
          clearable
          size="small"
          class="theme-color-list__brand-select"
          placeholder="品牌色"
          @update:model-value="onBrandSelectionChange(index, $event as PaletteColorKey | undefined)"
        >
          <el-option
            v-for="(label, i) in PALETTE_COLOR_LABELS"
            :key="PALETTE_COLOR_KEYS[i]"
            :label="label"
            :value="PALETTE_COLOR_KEYS[i]"
          />
        </el-select>
        <el-button
          text
          type="danger"
          size="small"
          @click="removeColor(index)"
        >
          删除
        </el-button>
      </div>
      <div class="theme-color-list__actions">
        <el-button size="small" @click="addColor">
          + 添加
        </el-button>
        <el-button v-if="modelValue.length > 0" size="small" @click="removeLast">
          - 减少
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-color-list {
  width: 100%;
}
.theme-color-list__body {
  width: 100%;
}
.theme-color-list__item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.theme-color-list__item:last-child {
  margin-bottom: 0;
}
.theme-color-list__label {
  flex-shrink: 0;
  width: 48px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: right;
}
.theme-color-list__field {
  flex: 1;
  min-width: 0;
}
.theme-color-list__brand-select {
  width: 90px;
  flex-shrink: 0;
}
.theme-color-list__brand-select :deep(.el-select__wrapper) {
  border-radius: 6px;
}
.theme-color-list__actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.theme-color-list__actions :deep(.el-button) {
  height: 28px;
  font-size: 12px;
  border-radius: 6px;
}
</style>
