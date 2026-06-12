<script lang="ts" setup>
import type { PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import CompRender from './comp-render'

defineOptions({
  name: 'PreviewSlotItem',
})

defineProps({
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: () => [],
  },
})
</script>

<template>
  <div v-for="inner in children" :key="inner._vid" class="preview-slot-item">
    <CompRender :element="inner">
      <template v-for="(value, slotKey) in inner.props?.slots" :key="slotKey" #[slotKey]>
        <PreviewSlotItem :children="value.children ?? []" />
      </template>
    </CompRender>
  </div>
</template>

<style scoped>
.preview-slot-item {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
