<script setup lang="ts">
import { ref } from 'vue'
import type { PickListProps } from './types'

const props = withDefaults(defineProps<PickListProps>(), {
  source: () => [],
  target: () => [],
  sourceHeader: '可选',
  targetHeader: '已选',
})

const emit = defineEmits<{
  (event: 'update:source', value: unknown[]): void
  (event: 'update:target', value: unknown[]): void
}>()

const selectedSource = ref<number[]>([])
const selectedTarget = ref<number[]>([])

function itemKey(item: unknown, index: number) {
  if (props.dataKey && item && typeof item === 'object' && props.dataKey in item) {
    return String((item as Record<string, unknown>)[props.dataKey])
  }
  return index
}

function toggleSelection(list: 'source' | 'target', index: number) {
  const selected = list === 'source' ? selectedSource : selectedTarget
  const pos = selected.value.indexOf(index)
  if (pos >= 0) selected.value = selected.value.filter((i) => i !== index)
  else selected.value = [...selected.value, index].sort((a, b) => a - b)
}

function moveToTarget() {
  if (!selectedSource.value.length) return
  const moving = selectedSource.value.map((i) => props.source[i])
  const nextSource = props.source.filter((_, i) => !selectedSource.value.includes(i))
  emit('update:source', nextSource)
  emit('update:target', [...props.target, ...moving])
  selectedSource.value = []
}

function moveToSource() {
  if (!selectedTarget.value.length) return
  const moving = selectedTarget.value.map((i) => props.target[i])
  const nextTarget = props.target.filter((_, i) => !selectedTarget.value.includes(i))
  emit('update:target', nextTarget)
  emit('update:source', [...props.source, ...moving])
  selectedTarget.value = []
}

function moveAllToTarget() {
  if (!props.source.length) return
  emit('update:target', [...props.target, ...props.source])
  emit('update:source', [])
  selectedSource.value = []
}

function moveAllToSource() {
  if (!props.target.length) return
  emit('update:source', [...props.source, ...props.target])
  emit('update:target', [])
  selectedTarget.value = []
}
</script>

<template>
  <div class="wd-picklist">
    <div class="wd-picklist__listbox">
      <div class="wd-picklist__header">{{ sourceHeader }}</div>
      <ul class="wd-picklist__list" role="listbox" aria-multiselectable="true">
        <li
          v-for="(item, index) in source"
          :key="itemKey(item, index)"
          class="wd-picklist__item"
          :class="{ 'wd-picklist__item--selected': selectedSource.includes(index) }"
          role="option"
          :aria-selected="selectedSource.includes(index)"
          @click="toggleSelection('source', index)"
        >
          <slot name="item" :item="item" :index="index">{{ item }}</slot>
        </li>
      </ul>
    </div>
    <div class="wd-picklist__controls">
      <button type="button" class="wd-picklist__btn" aria-label="全部移到右侧" @click="moveAllToTarget">≫</button>
      <button type="button" class="wd-picklist__btn" aria-label="移到右侧" @click="moveToTarget">›</button>
      <button type="button" class="wd-picklist__btn" aria-label="移到左侧" @click="moveToSource">‹</button>
      <button type="button" class="wd-picklist__btn" aria-label="全部移到左侧" @click="moveAllToSource">≪</button>
    </div>
    <div class="wd-picklist__listbox">
      <div class="wd-picklist__header">{{ targetHeader }}</div>
      <ul class="wd-picklist__list" role="listbox" aria-multiselectable="true">
        <li
          v-for="(item, index) in target"
          :key="itemKey(item, index)"
          class="wd-picklist__item"
          :class="{ 'wd-picklist__item--selected': selectedTarget.includes(index) }"
          role="option"
          :aria-selected="selectedTarget.includes(index)"
          @click="toggleSelection('target', index)"
        >
          <slot name="item" :item="item" :index="index">{{ item }}</slot>
        </li>
      </ul>
    </div>
  </div>
</template>
