<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { normalizeSeverity } from '../../shared/types'
import WdIcon from '../Icon/Icon.vue'
import type { IconName } from '../Icon/types'
import type { MessageProps } from './types'

const props = withDefaults(defineProps<MessageProps>(), {
  severity: 'info',
  closable: false,
  icon: true,
})

const emit = defineEmits<{ (event: 'close'): void }>()

const visible = ref(true)
let lifeTimer: ReturnType<typeof setTimeout> | undefined

const severityTone = computed(() => normalizeSeverity(props.severity) ?? 'info')

const iconName = computed<IconName>(() => {
  switch (severityTone.value) {
    case 'success':
      return 'check-circle'
    case 'warn':
    case 'warning':
      return 'warning'
    case 'error':
    case 'danger':
      return 'x-circle'
    default:
      return 'info'
  }
})

const rootClass = computed(() => ['wd-message', `wd-message--${severityTone.value}`])

function clearLifeTimer() {
  if (lifeTimer != null) {
    clearTimeout(lifeTimer)
    lifeTimer = undefined
  }
}

function close() {
  if (!visible.value) return
  clearLifeTimer()
  visible.value = false
  emit('close')
}

function scheduleLife() {
  clearLifeTimer()
  if (props.life == null || props.life <= 0 || !visible.value) return
  lifeTimer = setTimeout(() => {
    close()
  }, props.life)
}

onMounted(() => {
  scheduleLife()
})

watch(
  () => props.life,
  () => {
    scheduleLife()
  },
)

onBeforeUnmount(() => {
  clearLifeTimer()
})
</script>

<template>
  <div v-if="visible" :class="rootClass" role="status">
    <span v-if="icon" class="wd-message__icon" aria-hidden="true">
      <WdIcon :name="iconName" size="sm" />
    </span>
    <div class="wd-message__content">
      <slot />
    </div>
    <button
      v-if="closable"
      type="button"
      class="wd-message__close"
      aria-label="关闭"
      @click="close"
    >
      <WdIcon name="close" size="sm" />
    </button>
  </div>
</template>
