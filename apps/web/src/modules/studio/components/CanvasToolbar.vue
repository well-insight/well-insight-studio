<script setup lang="ts">
import type { WidgetType } from '@well-insight/shared'
import { BarChart3, ChartLine, ChartPie, LayoutGrid, Minus, Plus, Redo2, RefreshCw, Table2, Trash2, Undo2 } from '@lucide/vue'
import { WiButton, WiFlex, WiTag } from '@well-insight/ui'
import { useWidgetStore, WIDGET_DEFAULTS } from '../../../styles/stores/widgetStore'

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
  <WiFlex class="canvas-toolbar" justify="space-between" align="center" :wrap="false" :size="4">
    <WiFlex class="toolbar-left" align="center" :wrap="false" :size="4">
      <span class="toolbar-title">画布</span>
      <WiButton icon-only variant="ghost" size="small" aria-label="撤销 (Ctrl+Z)" :disabled="!store.canUndo" @click="store.undo()">
        <Undo2 :size="13" />
      </WiButton>
      <WiButton icon-only variant="ghost" size="small" aria-label="重做 (Ctrl+Y)" :disabled="!store.canRedo" @click="store.redo()">
        <Redo2 :size="13" />
      </WiButton>
      <span class="divider" />
      <WiButton
        v-for="btn in WIDGET_BUTTONS"
        :key="btn.type"
        variant="ghost"
        size="small"
        :aria-label="`添加${WIDGET_DEFAULTS[btn.type]?.label ?? btn.type}`"
        @click="addWidget(btn.type)"
      >
        <component :is="btn.icon" :size="13" />
        <span>{{ WIDGET_DEFAULTS[btn.type]?.label }}</span>
      </WiButton>
      <span class="divider" />
      <WiButton icon-only variant="ghost" size="small" aria-label="清空画布" :disabled="store.widgets.length === 0" @click="clearCanvas">
        <Trash2 :size="13" />
      </WiButton>
    </WiFlex>
    <WiFlex class="toolbar-right" align="center" :wrap="false" :size="4">
      <WiButton variant="ghost" size="small" aria-label="刷新画布数据" :loading="loading" @click="emit('refresh')">
        <RefreshCw :size="13" :class="{ spinning: loading }" />
        <span>刷新</span>
      </WiButton>
      <WiTag :value="`${store.widgets.length} 个组件`" severity="secondary" size="small" />
      <WiFlex class="zoom-control" align="center" :wrap="false" :size="2">
        <WiButton icon-only variant="ghost" size="small" aria-label="缩小" @click="emit('zoom', -0.1)">
          <Minus :size="13" />
        </WiButton>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <WiButton icon-only variant="ghost" size="small" aria-label="放大" @click="emit('zoom', 0.1)">
          <Plus :size="13" />
        </WiButton>
      </WiFlex>
    </WiFlex>
  </WiFlex>
</template>

<style scoped>
.canvas-toolbar {
  height: 40px;
  flex-shrink: 0;
  padding: 0 10px;
  border-bottom: 1px solid var(--wi-color-border);
  background: var(--wi-color-surface);
  overflow: hidden;
}
.toolbar-left,
.toolbar-right {
  min-width: 0;
}
.toolbar-left {
  overflow: hidden;
}
.toolbar-left :deep(.wi-button) {
  white-space: nowrap;
}
.toolbar-title {
  flex-shrink: 0;
  color: var(--wi-color-text);
  font-size: 12px;
  font-weight: 600;
}
.divider {
  width: 1px;
  height: 14px;
  flex-shrink: 0;
  margin: 0 3px;
  background: var(--wi-color-border);
}
.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.zoom-level {
  min-width: 36px;
  color: var(--wi-color-text-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
</style>
