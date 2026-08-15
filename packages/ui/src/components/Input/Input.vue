<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { useWdConfig } from '../../shared/config'
import { resolveSizeClass } from '../../shared/types'
import type { InputProps } from './types'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const props = withDefaults(defineProps<InputProps>(), {
  modelValue: '',
  type: 'text',
  fluid: false,
  disabled: false,
  readonly: false,
  clearable: false,
  showCount: false,
  error: false,
  invalid: false,
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'clear'): void
}>()
const config = useWdConfig()
const inputElement = ref<HTMLInputElement | null>(null)
const inputId = computed(() => props.id ?? `wd-input-${Math.random().toString(36).slice(2, 8)}`)
const isInvalid = computed(() => props.invalid || props.error)
const sizeClass = computed(() => resolveSizeClass(props.size ?? config.value.size))
const resolvedVariant = computed(() => props.variant ?? config.value.inputVariant ?? 'outlined')
const charCount = computed(() => props.modelValue.length)
const countText = computed(() =>
  props.maxlength != null ? `${charCount.value} / ${props.maxlength}` : String(charCount.value),
)
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.helpText) ids.push(`${inputId.value}-help`)
  if (props.showCount) ids.push(`${inputId.value}-count`)
  return ids.length ? ids.join(' ') : undefined
})

const inputClass = computed(() => [
  'wd-input',
  `wd-input--${sizeClass.value}`,
  {
    'wd-input--filled': resolvedVariant.value === 'filled',
    'wd-input--fluid': props.fluid,
    'wd-input--invalid': isInvalid.value,
    'wd-input--error': isInvalid.value,
  },
])

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function clear() {
  if (props.disabled || props.readonly) return
  emit('update:modelValue', '')
  emit('clear')
  inputElement.value?.focus()
}

function focus() {
  inputElement.value?.focus()
}
defineExpose({ focus })
</script>

<template>
  <div class="wd-input-field" :class="{ 'wd-input-field--fluid': fluid }">
    <label v-if="label" class="wd-input-field__label" :for="inputId">{{ label }}</label>
    <div
      class="wd-input-field__control"
      :class="{
        'wd-input-field__control--clearable': clearable && modelValue,
        'wd-input-field__control--counted': showCount,
      }"
    >
      <input
        ref="inputElement"
        v-bind="attrs"
        :id="inputId"
        :class="inputClass"
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="describedBy"
        @input="updateValue"
      />
      <button
        v-if="clearable && modelValue"
        class="wd-input__clear"
        type="button"
        aria-label="清除输入内容"
        :disabled="disabled || readonly"
        @click="clear"
      >
        ×
      </button>
    </div>
    <div v-if="helpText || showCount" class="wd-input-field__meta">
      <span v-if="helpText" :id="`${inputId}-help`" class="wd-input-field__help">{{ helpText }}</span>
      <span
        v-if="showCount"
        :id="`${inputId}-count`"
        class="wd-input-field__count"
        aria-live="polite"
      >
        {{ countText }}
      </span>
    </div>
  </div>
</template>
