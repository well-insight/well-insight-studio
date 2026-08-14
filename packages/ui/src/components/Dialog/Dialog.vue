<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { resolveOverlayTeleport } from '../../shared/overlay'
import type { DialogProps } from './types'

const props = withDefaults(defineProps<DialogProps>(), {
  modelValue: false,
  closeOnEsc: true,
  closable: true,
  modal: true,
  position: 'center',
  teleport: true,
  appendTo: 'body',
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'close'): void
  (event: 'show'): void
  (event: 'hide'): void
}>()
const dialogElement = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const dialogTitle = computed(() => props.header ?? props.title)
const teleportTarget = computed(() => resolveOverlayTeleport(props))
const isDismissableMask = computed(() => {
  if (props.dismissableMask !== undefined) return props.dismissableMask
  if (props.closeOnOutsideClick !== undefined) return props.closeOnOutsideClick
  return true
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (props.closeOnEsc && event.key === 'Escape') close()
}

function onOutsideClick() {
  if (isDismissableMask.value) close()
}

watch(
  () => props.modelValue,
  async (open, previousOpen) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', onKeydown)
      emit('show')
      await nextTick()
      dialogElement.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      if (previousOpen) emit('hide')
      previouslyFocused?.focus()
    }
  },
  { immediate: true },
)

onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
    <Transition name="wd-fade">
      <div
        v-if="modelValue"
        class="wd-dialog-backdrop"
        :class="[`wd-dialog-backdrop--${position}`, { 'wd-dialog-backdrop--modal': modal }]"
        @click.self="onOutsideClick"
      >
        <section
          ref="dialogElement"
          class="wd-dialog"
          :style="width ? { width } : undefined"
          role="dialog"
          :aria-modal="modal || undefined"
          :aria-label="dialogTitle"
          tabindex="-1"
        >
          <header v-if="$slots.header || dialogTitle || closable" class="wd-dialog__header">
            <slot name="header"><h2 v-if="dialogTitle">{{ dialogTitle }}</h2></slot>
            <button v-if="closable" type="button" aria-label="关闭" @click="close">×</button>
          </header>
          <div class="wd-dialog__body"><slot /></div>
          <footer v-if="$slots.footer" class="wd-dialog__footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
