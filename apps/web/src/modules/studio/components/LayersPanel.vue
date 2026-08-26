<script setup lang="ts">
import { computed } from 'vue'
import { ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock } from '@lucide/vue'
import { useWidgetStore, WIDGET_DEFAULTS } from '../../../stores/widgetStore'

const store = useWidgetStore()

/** 图层面板按 z 序倒序展示（最上层在最前） */
const reversedWidgets = computed(() => [...store.widgets].reverse())

function isFirst(id: string) {
  return store.widgets[store.widgets.length - 1]?.id === id
}
function isLast(id: string) {
  return store.widgets[0]?.id === id
}
</script>

<template>
  <div class="layers-panel">
    <div v-if="store.widgets.length === 0" class="empty-tip">画布暂无组件</div>

    <div
      v-for="w in reversedWidgets"
      :key="w.id"
      class="layer-item"
      :class="{ selected: store.selectedId === w.id, 'is-hidden': !w.visible }"
      @click="store.selectWidget(w.id)"
    >
      <span class="layer-type">{{ WIDGET_DEFAULTS[w.type]?.label }}</span>
      <span class="layer-name" :title="w.title">{{ w.title }}</span>
      <span class="layer-actions" @click.stop>
        <button title="上移一层" :disabled="isFirst(w.id)" @click="store.moveLayer(w.id, 1)"><ChevronUp :size="11" /></button>
        <button title="下移一层" :disabled="isLast(w.id)" @click="store.moveLayer(w.id, -1)"><ChevronDown :size="11" /></button>
        <button :title="w.visible ? '隐藏' : '显示'" @click="store.toggleVisibility(w.id)">
          <Eye v-if="w.visible" :size="11" />
          <EyeOff v-else :size="11" />
        </button>
        <button :title="w.locked ? '解锁' : '锁定'" @click="store.toggleLock(w.id)">
          <Unlock v-if="!w.locked" :size="11" />
          <Lock v-else :size="11" />
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.layers-panel {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.empty-tip {
  text-align: center;
  color: var(--wi-text-secondary, #4a5a78);
  font-size: 11px;
  padding: 24px 8px;
}
.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  border: 1px solid transparent;
}
.layer-item:hover {
  background: var(--wi-surface-hover, #141c2a);
}
.layer-item.selected {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--wi-primary, #3b82f6);
}
.layer-item.is-hidden .layer-name {
  opacity: 0.4;
}
.layer-type {
  font-size: 9px;
  color: var(--wi-primary, #3b82f6);
  flex-shrink: 0;
}
.layer-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--wi-text-color, #e8edf5);
}
.layer-actions {
  display: none;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}
.layer-item:hover .layer-actions,
.layer-item.selected .layer-actions {
  display: flex;
}
.layer-actions button {
  background: transparent;
  border: none;
  color: var(--wi-text-secondary, #8a9bb5);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
}
.layer-actions button:hover:not(:disabled) {
  background: var(--wi-surface, #1e2638);
  color: var(--wi-text-color, #e8edf5);
}
.layer-actions button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
