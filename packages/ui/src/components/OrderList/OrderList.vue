<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import WdIcon from '../Icon/Icon.vue'
import type { OrderListProps } from './types'

const props = withDefaults(defineProps<OrderListProps>(), {
  modelValue: () => [],
  dataKey: undefined,
  dragdrop: true,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: unknown[]): void
  (event: 'reorder', value: unknown[]): void
}>()

const selectedIndex = ref<number | null>(null)

const list = computed({
  get: () => props.modelValue,
  set: (value: unknown[]) => {
    emit('update:modelValue', value)
    emit('reorder', value)
  },
})

function itemKey(item: unknown, index: number) {
  if (props.dataKey && item && typeof item === 'object' && props.dataKey in item) {
    return String((item as Record<string, unknown>)[props.dataKey])
  }
  return String(index)
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
  emit('reorder', next)
}

function onDragEnd() {
  if (selectedIndex.value != null && selectedIndex.value >= list.value.length) {
    selectedIndex.value = null
  }
}
</script>

<template>
  <div class="wd-orderlist">
    <div class="wd-orderlist__controls">
      <button type="button" class="wd-orderlist__btn" aria-label="上移" @click="move(-1)">
        <WdIcon name="chevron-up" size="sm" />
      </button>
      <button type="button" class="wd-orderlist__btn" aria-label="下移" @click="move(1)">
        <WdIcon name="chevron-down" size="sm" />
      </button>
    </div>

    <draggable
      v-if="dragdrop"
      v-model="list"
      class="wd-orderlist__list"
      tag="ul"
      :style="listStyle"
      :item-key="(item: unknown, index: number) => itemKey(item, index)"
      handle=".wd-orderlist__handle"
      ghost-class="wd-orderlist__ghost"
      drag-class="wd-orderlist__drag"
      role="listbox"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <li
          class="wd-orderlist__item"
          :class="{ 'wd-orderlist__item--selected': selectedIndex === index }"
          role="option"
          :aria-selected="selectedIndex === index"
          @click="select(index)"
        >
          <button type="button" class="wd-orderlist__handle" aria-label="拖拽排序" @click.stop>
            <WdIcon name="grip" size="sm" />
          </button>
          <span class="wd-orderlist__label">
            <slot name="item" :item="element" :index="index">{{ element }}</slot>
          </span>
        </li>
      </template>
    </draggable>

    <ul v-else class="wd-orderlist__list" :style="listStyle" role="listbox">
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
