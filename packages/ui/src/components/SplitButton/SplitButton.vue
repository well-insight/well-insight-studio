<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { resolveSizeClass } from '../../shared/types'
import type { SplitButtonItem, SplitButtonProps } from './types'

const props = withDefaults(defineProps<SplitButtonProps>(), {
  model: () => [],
  disabled: false,
  outlined: false,
})

const emit = defineEmits<{
  (event: 'click', value: MouseEvent): void
  (event: 'command', item: SplitButtonItem): void
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const sizeClass = computed(() => resolveSizeClass(props.size))

const rootClass = computed(() => [
  'wd-splitbutton',
  `wd-splitbutton--${sizeClass.value}`,
  {
    'wd-splitbutton--disabled': props.disabled,
    'wd-splitbutton--outlined': props.outlined,
    [`wd-splitbutton--${props.severity}`]: Boolean(props.severity),
    'wd-splitbutton--open': open.value,
  },
])

function onMainClick(event: MouseEvent) {
  if (props.disabled) return
  emit('click', event)
}

function toggleMenu() {
  if (props.disabled) return
  open.value = !open.value
}

function activate(item: SplitButtonItem) {
  if (item.disabled || props.disabled) return
  item.command?.()
  emit('command', item)
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('click', onDocumentClick)
  else document.removeEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="root" :class="rootClass">
    <button
      type="button"
      class="wd-splitbutton__main"
      :disabled="disabled"
      @click="onMainClick"
    >
      <span v-if="icon" class="wd-splitbutton__icon" aria-hidden="true">{{ icon }}</span>
      <span v-if="label">{{ label }}</span>
    </button>
    <button
      type="button"
      class="wd-splitbutton__trigger"
      aria-label="更多操作"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggleMenu"
    >
      ▾
    </button>
    <ul v-if="open" class="wd-splitbutton__menu" role="menu">
      <li v-for="(item, index) in model" :key="`${item.label}-${index}`" role="presentation">
        <button
          type="button"
          class="wd-splitbutton__item"
          role="menuitem"
          :disabled="item.disabled"
          @click="activate(item)"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
