<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useWdConfig } from '../../shared/config'
import { resolveOverlayTeleport } from '../../shared/overlay'
import type { DrawerProps } from './types'

const props = withDefaults(defineProps<DrawerProps>(), {
  modelValue: false,
  position: 'left',
  modal: true,
  dismissable: true,
  showCloseIcon: true,
  blockScroll: false,
  teleport: true,
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'show'): void
  (event: 'hide'): void
}>()

const config = useWdConfig()
const drawerElement = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null
let previousBodyOverflow = ''

const teleportTarget = computed(() => resolveOverlayTeleport(props, config.value.appendTo))

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onOutsideClick() {
  if (props.dismissable) close()
}

function lockScroll(lock: boolean) {
  if (!props.blockScroll || typeof document === 'undefined') return
  if (lock) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
}

watch(
  () => props.modelValue,
  async (open, previousOpen) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', onKeydown)
      lockScroll(true)
      emit('show')
      await nextTick()
      drawerElement.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      lockScroll(false)
      if (previousOpen) emit('hide')
      previouslyFocused?.focus()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  lockScroll(false)
})
</script>

<template>
  <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
    <Transition name="wd-fade">
      <div
        v-if="modelValue"
        class="wd-drawer-backdrop"
        :class="{ 'wd-drawer-backdrop--modal': modal }"
        @click.self="onOutsideClick"
      >
        <aside
          ref="drawerElement"
          class="wd-drawer"
          :class="`wd-drawer--${position}`"
          role="dialog"
          :aria-modal="modal || undefined"
          :aria-label="header"
          tabindex="-1"
        >
          <header v-if="$slots.header || header || showCloseIcon" class="wd-drawer__header">
            <slot name="header"><h2 v-if="header">{{ header }}</h2></slot>
            <button
              v-if="showCloseIcon"
              type="button"
              class="wd-drawer__close"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </header>
          <div class="wd-drawer__body"><slot /></div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
