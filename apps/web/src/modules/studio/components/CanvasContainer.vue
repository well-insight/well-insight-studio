<script setup lang="ts">
import { message, toast, WiProgressSpinner, WiScrollbar } from '@well-insight/ui'
import { computed, ref } from 'vue'
import { useDrag } from '../../../composables/useDrag'
import { useResize } from '../../../composables/useResize'
import { useDataStore } from '../../../styles/stores/dataStore'
import { useWidgetStore } from '../../../styles/stores/widgetStore'
import { isNumericField } from '../utils/sampleData'
import WidgetRenderer from './WidgetRenderer.vue'

const props = defineProps<{
  zoom: number
  loading?: boolean
}>()

const emit = defineEmits<{
  configure: [id: string]
  updateZoom: [value: number]
}>()

const store = useWidgetStore()
const dataStore = useDataStore()

const containerRef = ref<HTMLElement | null>(null)
const zoom = computed(() => props.zoom)
const dragOver = ref(false)

const { startDrag } = useDrag(containerRef, zoom)
const { startResize } = useResize(zoom)

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.6

function zoomBy(delta: number) {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((props.zoom + delta) * 100) / 100))
  emit('updateZoom', next)
}

interface DropPayload {
  table: string
  field: string
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const raw = e.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const { table, field } = JSON.parse(raw) as DropPayload
    const tableData = dataStore.getTable(table)
    if (!tableData.fields.includes(field)) throw new Error('unknown field')
    const type = isNumericField(tableData, field) ? 'bar' : 'table'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.max(8, (e.clientX - rect.left) / zoom.value - 110)
    const y = Math.max(8, (e.clientY - rect.top) / zoom.value - 50)
    const widget = store.addWidget(type, { title: `${field} 分析`, dataSource: table, x, y })
    toast.success({ summary: `已从「${table}.${field}」生成组件`, detail: widget.title })
  } catch {
    message.warn('拖拽解析失败')
  }
}
</script>

<template>
  <div class="canvas-area">
    <WiScrollbar class="canvas-scrollbar" :always="true" aria-label="画布">
      <div
        ref="containerRef"
        class="canvas-container"
        :class="{ 'drag-over': dragOver }"
        :style="{ transform: `scale(${zoom})` }"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
        @mousedown.self="store.selectWidget(null)"
      >
        <div v-if="store.widgets.length === 0" class="canvas-empty">
          <div class="hint">
            拖拽左侧字段到此处
          </div>
          <div class="sub-hint">
            或点击工具栏添加组件
          </div>
        </div>

        <WidgetRenderer
          v-for="(widget, idx) in store.widgets"
          :key="widget.id"
          :widget="widget"
          :selected="store.selectedId === widget.id"
          :z-index="idx + 1"
          @configure="emit('configure', $event)"
          @drag-start="startDrag"
          @resize-start="startResize"
        />
      </div>
    </WiScrollbar>
    <div v-if="loading" class="canvas-loading" aria-live="polite">
      <WiProgressSpinner size="small" aria-label="正在加载画布" />
      <span>正在加载画布…</span>
    </div>
  </div>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  min-height: 0;
  position: relative;
  background: var(--wi-color-ground-background);
}
.canvas-scrollbar {
  width: 100%;
  height: 100%;
}
.canvas-scrollbar :deep(.wi-scrollbar__wrap) {
  overscroll-behavior: contain;
}
.canvas-loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--wi-color-text-muted);
  background: color-mix(in srgb, var(--wi-color-ground-background) 72%, transparent);
  pointer-events: all;
}
.canvas-loading span {
  font-size: 12px;
}
.canvas-container {
  position: relative;
  width: 2400px;
  height: 1600px;
  transform-origin: top left;
  background-image:
    linear-gradient(var(--wi-color-canvas-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--wi-color-canvas-grid) 1px, transparent 1px);
  background-size: 40px 40px;
}
.canvas-container.drag-over {
  outline: 2px dashed var(--wi-color-primary);
  outline-offset: -4px;
  background-color: var(--wi-color-primary-soft);
}
.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
}
.hint {
  font-size: 14px;
  font-weight: 600;
  color: var(--wi-color-text-muted);
}
.sub-hint {
  font-size: 11px;
  color: var(--wi-color-text-muted);
}
</style>
