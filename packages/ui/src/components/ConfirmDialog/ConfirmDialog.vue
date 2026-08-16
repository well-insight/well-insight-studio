<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useWdConfig } from '../../shared/config'
import { resolveOverlayTeleport } from '../../shared/overlay'
import { useModalOverlay } from '../../shared/useModalOverlay'
import WdButton from '../Button/Button.vue'
import type { ConfirmDialogProps } from './types'

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  modelValue: false,
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
const title = computed(() => props.header ?? '确认')
const acceptText = computed(() => props.acceptLabel ?? config.value.locale?.accept ?? '确认')
const rejectText = computed(() => props.rejectLabel ?? config.value.locale?.reject ?? '取消')

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

useModalOverlay({
  open: toRef(props, 'modelValue'),
  container: dialogElement,
  blockScroll: true,
  onEscape: reject,
})
</script>

<template>
  <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
    <Transition name="wd-fade">
      <div
        v-if="modelValue"
        class="wd-dialog-backdrop wd-dialog-backdrop--center wd-dialog-backdrop--modal wd-confirmdialog-backdrop"
        @click.self="reject"
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
              <WdButton :label="rejectText" severity="secondary" @click="reject" />
              <WdButton :label="acceptText" :severity="acceptSeverity" @click="accept" />
            </slot>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
