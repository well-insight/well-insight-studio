<script setup lang="ts">
import { computed } from 'vue'
import { formatLocale, useWdLocale } from '../../locale'
import { useWdConfig } from '../../shared/config'
import { resolveOverlayTeleport } from '../../shared/overlay'
import { normalizeSeverity } from '../../shared/types'
import type { ToastMessage, ToastProps } from './types'

const props = withDefaults(defineProps<ToastProps>(), {
  messages: () => [],
  position: 'top-right',
  teleport: true,
})
const emit = defineEmits<{ (event: 'close', message: ToastMessage): void }>()
const config = useWdConfig()
const locale = useWdLocale()
const teleportTarget = computed(() => resolveOverlayTeleport(props, config.value.appendTo))

function messageSeverityClass(severity?: ToastMessage['severity']) {
  return `wd-toast__message--${normalizeSeverity(severity) ?? 'info'}`
}
</script>

<template>
  <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
    <div class="wd-toast" :class="`wd-toast--${position}`" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="wd-slide-fade">
        <article
          v-for="message in messages"
          :key="message.id"
          class="wd-toast__message"
          :class="messageSeverityClass(message.severity)"
          role="status"
        >
          <div class="wd-toast__content">
            <strong>{{ message.summary }}</strong>
            <p v-if="message.detail">{{ message.detail }}</p>
          </div>
          <button
            v-if="message.closable !== false"
            type="button"
            class="wd-toast__close"
            :aria-label="formatLocale(locale.closeNamed, { summary: message.summary })"
            @click="emit('close', message)"
          >
            ×
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
