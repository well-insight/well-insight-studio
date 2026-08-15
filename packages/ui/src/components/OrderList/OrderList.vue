<script setup lang="ts">
import { ref } from 'vue'
import type { OrderListProps } from './types'

const props = withDefaults(defineProps<OrderListProps>(), {
  modelValue: () => [],
  dataKey: undefined,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: unknown[]): void
}>()

const selectedIndex = ref<number | null>(null)

function itemKey(item: unknown, index: number) {
  if (props.dataKey && item && typeof item === 'object' && props.dataKey in item) {
    return String((item as Record<string, unknown>)[props.dataKey])
  }
  return index
}

function select(index: number) {
  selectedIndex.value = index
}

function move(delta: number) {
  if (selectedIndex.value === null) return
  const from = selectedIndex.value
  const to = from + delta
  if (to < 0 || to >= props.modelValue.length) return
  const next = [...props.modelValue]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  selectedIndex.value = to
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="wd-orderlist">
    <div class="wd-orderlist__controls">
      <button type="button" class="wd-orderlist__btn" aria-label="上移" @click="move(-1)">↑</button>
      <button type="button" class="wd-orderlist__btn" aria-label="下移" @click="move(1)">↓</button>
    </div>
    <ul class="wd-orderlist__list" :style="listStyle" role="listbox">
      <li
        v-for="(item, index) in modelValue"
        :key="itemKey(item, index)"
        class="wd-orderlist__item"
        :class="{ 'wd-orderlist__item--selected': selectedIndex === index }"
        role="option"
        :aria-selected="selectedIndex === index"
        @click="select(index)"
      >
        <slot name="item" :item="item" :index="index">{{ item }}</slot>
      </li>
    </ul>
  </div>
</template>
