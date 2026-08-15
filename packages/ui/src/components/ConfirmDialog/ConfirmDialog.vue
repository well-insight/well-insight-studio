<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useWdConfig } from '../../shared/config'
import { resolveOverlayTeleport } from '../../shared/overlay'
import WdButton from '../Button/Button.vue'
import type { ConfirmDialogProps } from './types'

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  modelValue: false,
  acceptLabel: '确认',
  rejectLabel: '取消',
  acceptSeverity: undefined,
  teleport: true,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'accept'): void
  (event: 'reject'): void
}>()

const config = useWdConfig()
const dialogElement = ref<HTMLElement | null>(null)
const teleportTarget = computed(() => resolveOverlayTeleport(props, config.value.appendTo))
let previouslyFocused: HTMLElement | null = null

const title = computed(() => props.header ?? '确认')

function close() {
  emit('update:modelValue', false)
}

function accept() {
  emit('accept')
  close()
}

function reject() {
  emit('reject')
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') reject()
}

function onOutsideClick() {
  reject()
}

watch(
  () => props.modelValue,
  async (open, previousOpen) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      dialogElement.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      if (previousOpen) previouslyFocused?.focus()
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
        class="wd-dialog-backdrop wd-dialog-backdrop--center wd-dialog-backdrop--modal wd-confirmdialog-backdrop"
        @click.self="onOutsideClick"
      >
        <section
          ref="dialogElement"
          class="wd-dialog wd-confirmdialog"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <header class="wd-dialog__header wd-confirmdialog__header">
            <slot name="header">
              <h2>{{ title }}</h2>
            </slot>
          </header>
          <div class="wd-dialog__body wd-confirmdialog__message">
            <slot>{{ message }}</slot>
          </div>
          <footer class="wd-dialog__footer wd-confirmdialog__footer">
            <slot name="footer">
              <WdButton :label="rejectLabel" severity="secondary" @click="reject" />
              <WdButton :label="acceptLabel" :severity="acceptSeverity" @click="accept" />
            </slot>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
