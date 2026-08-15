<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { resolveSizeClass } from '../../shared/types'
import type { InputPasswordProps, PasswordStrength } from './types'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const props = withDefaults(defineProps<InputPasswordProps>(), {
  modelValue: '',
  disabled: false,
  invalid: false,
  fluid: false,
  feedback: false,
  toggleMask: true,
})
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const unmasked = ref(false)
const inputId = computed(() => props.id ?? `wd-password-${Math.random().toString(36).slice(2, 8)}`)
const sizeClass = computed(() => resolveSizeClass(props.size))

const strength = computed<PasswordStrength>(() => {
  const value = props.modelValue ?? ''
  if (!value) return 'empty'
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (score <= 1) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
})

const strengthLabel = computed(() => {
  if (strength.value === 'weak') return '弱'
  if (strength.value === 'medium') return '中'
  if (strength.value === 'strong') return '强'
  return ''
})

const rootClass = computed(() => [
  'wd-password',
  `wd-password--${sizeClass.value}`,
  {
    'wd-password--fluid': props.fluid,
    'wd-password--invalid': props.invalid,
    'wd-password--disabled': props.disabled,
  },
])

function updateValue(event: Event) {
  if (props.disabled) return
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="wd-password-field" :class="{ 'wd-password-field--fluid': fluid }">
    <label v-if="label" class="wd-password-field__label" :for="inputId">{{ label }}</label>
    <div :class="rootClass">
      <input
        v-bind="attrs"
        :id="inputId"
        class="wd-password__input"
        :type="unmasked ? 'text' : 'password'"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        autocomplete="current-password"
        @input="updateValue"
      />
      <button
        v-if="toggleMask"
        class="wd-password__toggle"
        type="button"
        :aria-label="unmasked ? '隐藏密码' : '显示密码'"
        :disabled="disabled"
        @click="unmasked = !unmasked"
      >
        {{ unmasked ? '隐藏' : '显示' }}
      </button>
    </div>
    <span
      v-if="feedback && strength !== 'empty'"
      class="wd-password__feedback"
      :class="`wd-password__feedback--${strength}`"
    >
      强度：{{ strengthLabel }}
    </span>
  </div>
</template>
