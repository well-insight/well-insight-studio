<script lang="ts" setup>
import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { defineComponent } from 'vue'

const props = defineProps<{
  component: VisualEditorComponent
}>()

const PreviewHost = defineComponent({
  name: 'ComponentPreviewHost',
  setup() {
    return () => props.component.preview()
  },
})
</script>

<template>
  <PreviewHost />
</template>
