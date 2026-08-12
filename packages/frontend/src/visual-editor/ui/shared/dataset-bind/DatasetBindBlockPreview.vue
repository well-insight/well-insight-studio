<script setup lang="ts">
import type { PropDatasetBinding } from '@/utils/datasetBinding'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { cloneDeep } from 'lodash-es'
import { computed, defineComponent, h } from 'vue'
import { useDatasetResolvedProps } from '@/hooks/useDatasetResolvedProps'
import { visualConfig } from '@/visual.config'

const props = defineProps<{
  block: VisualEditorBlockData
  propName: string
  draft: PropDatasetBinding | null
  /** 三栏布局时预览在右侧独立栏 */
  column?: boolean
}>()

const previewBlock = computed(() => {
  const b = cloneDeep(props.block) as VisualEditorBlockData
  if (!b.datasetBindings) {
    b.datasetBindings = {}
  }
  if (props.draft?.datasetId && props.draft?.field) {
    b.datasetBindings[props.propName] = { ...props.draft }
  }
  else {
    delete b.datasetBindings[props.propName]
  }
  b.focus = false
  b.focusWithChild = false
  return b
})

const { resolvedProps, datasetLoading } = useDatasetResolvedProps(
  () => previewBlock.value.componentKey,
  previewBlock,
)

const PreviewInner = defineComponent({
  name: 'DatasetBindPreviewInner',
  setup() {
    return () => {
      const block = previewBlock.value
      const props = resolvedProps.value
      void datasetLoading.value
      const comp = visualConfig.componentMap[block.componentKey]
      if (!comp) {
        return h('div', { class: 'preview-fallback' }, '无法预览该组件')
      }
      const renderFn = comp.render({
        styles: {
          ...block.styles,
          padding: '12px',
        },
        props,
        model: block.model || {},
        block,
        custom: {},
      })
      return h('div', { class: 'preview-stage' }, [h('div', { class: 'preview-stage__frame' }, [renderFn()])])
    }
  },
})
</script>

<template>
  <section class="bind-preview" :class="{ 'bind-preview--column': column }">
    <header class="section-head">
      <span class="section-head__title">组件预览</span>
      <span class="section-head__hint">绑定后实时预览效果</span>
    </header>
    <div class="bind-preview__viewport">
      <div class="bind-preview__canvas">
        <PreviewInner />
      </div>
    </div>
  </section>
</template>

<style scoped>
.bind-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  background: var(--el-bg-color);
}

.bind-preview--column {
  height: 100%;
}

.section-head {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 20px 10px;
}

.section-head__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-head__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.bind-preview--column .bind-preview__viewport {
  padding: 0 16px 16px;
}

.bind-preview__viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px 20px;
  overflow: hidden;
}

.bind-preview__canvas {
  aspect-ratio: 1;
  height: 100%;
  max-width: 100%;
  width: auto;
  flex-shrink: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.preview-stage) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.preview-stage__frame) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.preview-fallback) {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
