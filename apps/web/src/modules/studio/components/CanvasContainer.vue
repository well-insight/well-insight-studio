<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from '@well-insight/ui'
import { useWidgetStore } from '../../../stores/widgetStore'
import { useDataStore } from '../../../stores/dataStore'
import { isNumericField } from '../utils/sampleData'
import { useDrag } from '../../../composables/useDrag'
import { useResize } from '../../../composables/useResize'
import WidgetRenderer from './WidgetRenderer.vue'

const props = defineProps<{ zoom: number }>()

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
    toast.warn({ summary: '拖拽解析失败' })
  }
}
</script>

<template>
  <div class="canvas-area">
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
        <div class="hint">拖拽左侧字段到此处</div>
        <div class="sub-hint">或点击工具栏添加组件</div>
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
  </div>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  overflow: auto;
  position: relative;
  background: var(--wi-ground-background, #080b13);
}
.canvas-container {
  position: relative;
  width: 2400px;
  height: 1600px;
  transform-origin: top left;
  background-image:
    linear-gradient(var(--canvas-grid, rgba(58, 69, 87, 0.18)) 1px, transparent 1px),
    linear-gradient(90deg, var(--canvas-grid, rgba(58, 69, 87, 0.18)) 1px, transparent 1px);
  background-size: 40px 40px;
}
[data-theme="light"] .canvas-container {
  --canvas-grid: rgba(58, 69, 87, 0.08);
}
.canvas-container.drag-over {
  outline: 2px dashed var(--wi-primary, #3b82f6);
  outline-offset: -4px;
  background-color: rgba(59, 130, 246, 0.05);
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
  color: var(--wi-text-secondary, #6a7b98);
}
.sub-hint {
  font-size: 11px;
  color: var(--wi-text-secondary, #4a5a78);
}
</style>
