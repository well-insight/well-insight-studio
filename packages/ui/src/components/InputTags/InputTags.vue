<script setup lang="ts">
import { ref } from 'vue'
import type { InputTagsProps } from './types'

const props = withDefaults(defineProps<InputTagsProps>(), {
  modelValue: () => [],
  placeholder: '输入后回车添加',
  disabled: false,
  addOnBlur: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void
}>()

const draft = ref('')

function addTag(raw = draft.value) {
  if (props.disabled) return
  const tag = raw.trim()
  if (!tag) return
  if (props.modelValue.includes(tag)) {
    draft.value = ''
    return
  }
  emit('update:modelValue', [...props.modelValue, tag])
  draft.value = ''
}

function removeTag(index: number) {
  if (props.disabled) return
  const next = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
    return
  }
  if (event.key === 'Backspace' && !draft.value && props.modelValue.length) {
    removeTag(props.modelValue.length - 1)
  }
}

function onBlur() {
  if (props.addOnBlur) addTag()
}
</script>

<template>
  <div class="wd-inputtags" :class="{ 'wd-inputtags--disabled': disabled }">
    <span
      v-for="(tag, index) in modelValue"
      :key="`${tag}-${index}`"
      class="wd-inputtags__chip"
    >
      {{ tag }}
      <button
        type="button"
        class="wd-inputtags__remove"
        :disabled="disabled"
        aria-label="移除标签"
        @click="removeTag(index)"
      >
        ×
      </button>
    </span>
    <input
      v-model="draft"
      class="wd-inputtags__input"
      type="text"
      :placeholder="modelValue.length ? '' : placeholder"
      :disabled="disabled"
      @keydown="onKeydown"
      @blur="onBlur"
    />
  </div>
</template>
