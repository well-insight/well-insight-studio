<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FileUploadProps } from './types'

const props = withDefaults(defineProps<FileUploadProps>(), {
  mode: 'basic',
  multiple: false,
  disabled: false,
  chooseLabel: '选择文件',
})

const emit = defineEmits<{
  (event: 'select', files: File[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const files = ref<File[]>([])

const rootClass = computed(() => [
  'wd-fileupload',
  `wd-fileupload--${props.mode}`,
  { 'wd-fileupload--disabled': props.disabled },
])

function openPicker() {
  if (props.disabled) return
  inputRef.value?.click()
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const selected = Array.from(target.files ?? [])
  files.value = selected
  emit('select', selected)
  target.value = ''
}

function clear() {
  files.value = []
}
</script>

<template>
  <div :class="rootClass">
    <input
      ref="inputRef"
      class="wd-fileupload__input"
      type="file"
      :multiple="multiple"
      :accept="accept"
      :disabled="disabled"
      @change="onChange"
    />
    <button
      type="button"
      class="wd-fileupload__choose"
      :disabled="disabled"
      @click="openPicker"
    >
      {{ chooseLabel }}
    </button>
    <ul v-if="mode === 'advanced' && files.length" class="wd-fileupload__list">
      <li v-for="(file, index) in files" :key="`${file.name}-${index}`" class="wd-fileupload__file">
        <span class="wd-fileupload__name">{{ file.name }}</span>
        <span class="wd-fileupload__size">{{ Math.round(file.size / 1024) }} KB</span>
      </li>
    </ul>
    <button
      v-if="mode === 'advanced' && files.length"
      type="button"
      class="wd-fileupload__clear"
      @click="clear"
    >
      清除
    </button>
  </div>
</template>
