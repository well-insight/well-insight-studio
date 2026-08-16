<script setup lang="ts">
import { computed, ref } from 'vue'
import { normalizeSeverity } from '../../shared/types'
import WdIcon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/types'
import type { AlertProps } from './types'

const props = withDefaults(defineProps<AlertProps>(), {
  severity: 'info',
  closable: false,
  showIcon: true,
  effect: 'light',
})

const emit = defineEmits<{ (event: 'close'): void }>()
const visible = ref(true)

const severityTone = computed(() => {
  if (props.severity === 'help') return 'help'
  return normalizeSeverity(props.severity) ?? 'info'
})

const iconName = computed<IconName>(() => {
  switch (severityTone.value) {
    case 'success':
      return 'check-circle'
    case 'warn':
      return 'warning'
    case 'error':
      return 'x-circle'
    case 'help':
      return 'info'
    default:
      return 'info'
  }
})

const rootClass = computed(() => [
  'wd-alert',
  `wd-alert--${severityTone.value}`,
  `wd-alert--${props.effect}`,
])

const role = computed(() =>
  severityTone.value === 'error' || severityTone.value === 'warn' ? 'alert' : 'status',
)

function close() {
  if (!visible.value) return
  visible.value = false
  emit('close')
}
</script>

<template>
  <div v-if="visible" :class="rootClass" :role="role">
    <span v-if="showIcon || $slots.icon" class="wd-alert__icon" aria-hidden="true">
      <slot name="icon">
        <WdIcon :name="iconName" size="sm" />
      </slot>
    </span>
    <div class="wd-alert__body">
      <div v-if="title || $slots.title" class="wd-alert__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.default" class="wd-alert__description">
        <slot>{{ description }}</slot>
      </div>
      <div v-if="$slots.action" class="wd-alert__action">
        <slot name="action" />
      </div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="wd-alert__close"
      aria-label="关闭"
      @click="close"
    >
      <WdIcon name="close" size="sm" />
    </button>
  </div>
</template>
