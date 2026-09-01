<script setup lang="ts">
import type { Widget } from '@well-insight/shared'
import { Camera, Eye, EyeOff, Lock, Settings, Unlock, X } from '@lucide/vue'
import { message } from '@well-insight/ui'
import { ref } from 'vue'
import { useWidgetStore } from '../../../styles/stores/widgetStore'
import { exportElementToPNG } from '../utils/export'
import ChartWidget from './widgets/ChartWidget.vue'
import KpiWidget from './widgets/KpiWidget.vue'
import TableWidget from './widgets/TableWidget.vue'

const props = defineProps<{
  widget: Widget
  selected: boolean
  zIndex: number
}>()

const emit = defineEmits<{
  configure: [id: string]
  dragStart: [e: MouseEvent, widget: Widget]
  resizeStart: [e: MouseEvent, widget: Widget]
}>()

const store = useWidgetStore()

const TYPE_ICONS: Record<string, string> = {
  kpi: '指标',
  bar: '柱状',
  line: '折线',
  pie: '饼图',
  table: '表格',
}

function onRemove() {
  store.removeWidget(props.widget.id)
}

function onToggleVisibility() {
  store.toggleVisibility(props.widget.id)
}

function onToggleLock() {
  store.toggleLock(props.widget.id)
}

const widgetRef = ref<HTMLElement | null>(null)

async function onExportPNG() {
  if (!widgetRef.value) return
  try {
    await exportElementToPNG(widgetRef.value, `${props.widget.title || props.widget.type}`)
    message.success('已导出 PNG')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '导出失败')
  }
}
</script>

<template>
  <div
    ref="widgetRef"
    class="canvas-widget"
    :class="{ selected, 'is-hidden': !widget.visible, 'is-locked': widget.locked }"
    :style="{
      left: `${widget.x }px`,
      top: `${widget.y }px`,
      width: `${widget.width }px`,
      height: `${widget.height }px`,
      zIndex,
      borderColor: selected ? undefined : `${widget.color }55`,
    }"
    @mousedown="emit('dragStart', $event, widget)"
    @click="store.selectWidget(widget.id)"
    @dblclick="emit('configure', widget.id)"
  >
    <div class="widget-header">
      <span class="widget-title" :title="widget.title">
        <span class="type-badge">{{ TYPE_ICONS[widget.type] ?? widget.type }}</span>
        {{ widget.title }}
      </span>
      <span class="widget-actions" @mousedown.stop @click.stop @dblclick.stop>
        <button title="配置" @click="emit('configure', widget.id)"><Settings :size="11" /></button>
        <button :title="widget.visible ? '隐藏' : '显示'" @click="onToggleVisibility">
          <Eye v-if="widget.visible" :size="11" />
          <EyeOff v-else :size="11" />
        </button>
        <button :title="widget.locked ? '解锁' : '锁定'" @click="onToggleLock">
          <Unlock v-if="!widget.locked" :size="11" />
          <Lock v-else :size="11" />
        </button>
        <button title="导出 PNG" @click="onExportPNG"><Camera :size="11" /></button>
        <button class="danger" title="删除" @click="onRemove"><X :size="11" /></button>
      </span>
    </div>

    <div class="widget-body">
      <KpiWidget v-if="widget.type === 'kpi'" :widget="widget" />
      <ChartWidget v-else-if="widget.type === 'bar' || widget.type === 'line' || widget.type === 'pie'" :widget="widget" />
      <TableWidget v-else-if="widget.type === 'table'" :widget="widget" />
      <div v-else class="widget-unknown">
        未知类型
      </div>
    </div>

    <div
      v-if="!widget.locked"
      class="resize-handle"
      @mousedown="emit('resizeStart', $event, widget)"
    />
  </div>
</template>

<style scoped>
.canvas-widget {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--wi-color-surface);
  border: 1px solid var(--wi-color-border);
  border-radius: 6px;
  overflow: hidden;
  cursor: grab;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.canvas-widget:hover {
  border-color: var(--wi-color-primary);
}
.canvas-widget.selected {
  border-color: var(--wi-color-primary);
  box-shadow: 0 0 0 1px var(--wi-color-primary), 0 4px 16px var(--wi-color-primary-glow);
}
.canvas-widget.is-hidden {
  opacity: 0.35;
}
.canvas-widget.is-locked {
  cursor: default;
}
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  border-bottom: 1px solid var(--wi-color-border);
  flex-shrink: 0;
  gap: 4px;
}
.widget-title {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}
.type-badge {
  font-size: 8px;
  font-weight: 400;
  color: var(--wi-color-primary);
  background: var(--wi-color-primary-soft);
  padding: 0 4px;
  border-radius: 3px;
  flex-shrink: 0;
}
.widget-actions {
  display: none;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.canvas-widget:hover .widget-actions,
.canvas-widget.selected .widget-actions {
  display: flex;
}
.widget-actions button {
  background: transparent;
  border: none;
  color: var(--wi-color-text-muted);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
}
.widget-actions button:hover {
  background: var(--wi-color-surface-hover);
  color: var(--wi-color-text);
}
.widget-actions button.danger:hover {
  color: var(--wi-color-danger);
}
.widget-body {
  flex: 1;
  padding: 4px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.widget-unknown {
  color: var(--wi-color-text-muted);
  font-size: 11px;
  text-align: center;
  margin: auto;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--wi-color-primary) 50%);
  opacity: 0;
  transition: opacity 0.15s;
  border-bottom-right-radius: 6px;
}
.canvas-widget:hover .resize-handle,
.canvas-widget.selected .resize-handle {
  opacity: 0.7;
}
</style>
