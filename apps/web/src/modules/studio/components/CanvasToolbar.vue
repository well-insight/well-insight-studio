<script setup lang="ts">
import type { WidgetType } from '@well-insight/shared'
import { BarChart3, ChartLine, ChartPie, LayoutGrid, Minus, Plus, RefreshCw, Table2, Undo2, Redo2, Trash2 } from '@lucide/vue'
import { useWidgetStore, WIDGET_DEFAULTS } from '../../../stores/widgetStore'

defineProps<{
  zoom: number
  loading?: boolean
}>()

const emit = defineEmits<{
  zoom: [delta: number]
  refresh: []
}>()

const store = useWidgetStore()

const WIDGET_BUTTONS: { type: WidgetType; icon: typeof BarChart3 }[] = [
  { type: 'kpi', icon: LayoutGrid },
  { type: 'bar', icon: BarChart3 },
  { type: 'line', icon: ChartLine },
  { type: 'pie', icon: ChartPie },
  { type: 'table', icon: Table2 },
]

function addWidget(type: WidgetType) {
  store.addWidget(type)
}

function clearCanvas() {
  if (store.widgets.length === 0) return
  if (window.confirm('确定清空画布所有组件？（可撤销）')) {
    store.clear()
  }
}
</script>

<template>
  <div class="canvas-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-title">画布</span>
      <button class="tool-btn" title="撤销 (Ctrl+Z)" :disabled="!store.canUndo" @click="store.undo()">
        <Undo2 :size="13" />
      </button>
      <button class="tool-btn" title="重做 (Ctrl+Y)" :disabled="!store.canRedo" @click="store.redo()">
        <Redo2 :size="13" />
      </button>
      <span class="divider"></span>
      <button
        v-for="btn in WIDGET_BUTTONS"
        :key="btn.type"
        class="tool-btn labeled"
        :title="`添加${WIDGET_DEFAULTS[btn.type]?.label ?? btn.type}`"
        @click="addWidget(btn.type)"
      >
        <component :is="btn.icon" :size="13" />
        <span>{{ WIDGET_DEFAULTS[btn.type]?.label }}</span>
      </button>
      <span class="divider"></span>
      <button class="tool-btn" title="清空画布" :disabled="store.widgets.length === 0" @click="clearCanvas">
        <Trash2 :size="13" />
      </button>
    </div>
    <div class="toolbar-right">
      <button class="tool-btn" title="刷新画布数据" :disabled="loading" @click="emit('refresh')">
        <RefreshCw :size="13" :class="{ spinning: loading }" />
        <span>刷新</span>
      </button>
      <span class="widget-count">{{ store.widgets.length }} 个组件</span>
      <div class="zoom-control">
        <button class="tool-btn" title="缩小" @click="emit('zoom', -0.1)"><Minus :size="13" /></button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button class="tool-btn" title="放大" @click="emit('zoom', 0.1)"><Plus :size="13" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid var(--wi-border-color, #1e2638);
  background: var(--wi-surface, #0c111c);
  flex-shrink: 0;
  gap: 8px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.toolbar-title {
  font-size: 12px;
  font-weight: 600;
  margin-right: 6px;
  color: var(--wi-text-color, #e8edf5);
}
.divider {
  width: 1px;
  height: 14px;
  background: var(--wi-border-color, #1e2638);
  margin: 0 3px;
}
.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--wi-text-secondary, #8a9bb5);
  font-size: 11px;
  padding: 4px 7px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
}
.tool-btn:hover:not(:disabled) {
  background: var(--wi-surface-hover, #1e2638);
  color: var(--wi-text-color, #e8edf5);
}
.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.widget-count {
  font-size: 11px;
  color: var(--wi-text-secondary, #8a9bb5);
  margin-right: 6px;
}
.zoom-control {
  display: flex;
  align-items: center;
  gap: 2px;
}
.zoom-level {
  font-size: 10px;
  color: var(--wi-text-secondary, #8a9bb5);
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
