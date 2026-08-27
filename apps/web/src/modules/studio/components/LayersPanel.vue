<script setup lang="ts">
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock } from '@lucide/vue'
import { WiButton, WiScrollbar } from '@well-insight/ui'
import { computed } from 'vue'
import { useWidgetStore, WIDGET_DEFAULTS } from '../../../styles/stores/widgetStore'

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
  <WiScrollbar class="layers-scroll" :native="false" trigger="hover" aria-label="画布图层">
    <div class="layers-panel flex min-h-full flex-col gap-1 p-2">
      <div v-if="store.widgets.length === 0" class="empty-tip p-6 text-center text-xs text-[var(--wi-color-text-muted)]">
        画布暂无组件
      </div>

      <div
        v-for="w in reversedWidgets"
        :key="w.id"
        class="layer-item flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs"
        :class="{ selected: store.selectedId === w.id, 'is-hidden': !w.visible }"
        @click="store.selectWidget(w.id)"
      >
        <span class="layer-type shrink-0 text-[10px] text-[var(--wi-color-primary)]">{{ WIDGET_DEFAULTS[w.type]?.label }}</span>
        <span class="layer-name min-w-0 flex-1 truncate text-[var(--wi-color-text)]" :title="w.title">{{ w.title }}</span>
        <span class="layer-actions hidden shrink-0 items-center gap-0.5" @click.stop>
          <WiButton icon-only variant="ghost" size="small" aria-label="上移一层" :disabled="isFirst(w.id)" @click="store.moveLayer(w.id, 1)"><ChevronUp :size="11" /></WiButton>
          <WiButton icon-only variant="ghost" size="small" aria-label="下移一层" :disabled="isLast(w.id)" @click="store.moveLayer(w.id, -1)"><ChevronDown :size="11" /></WiButton>
          <WiButton icon-only variant="ghost" size="small" :aria-label="w.visible ? '隐藏' : '显示'" @click="store.toggleVisibility(w.id)">
            <Eye v-if="w.visible" :size="11" />
            <EyeOff v-else :size="11" />
          </WiButton>
          <WiButton icon-only variant="ghost" size="small" :aria-label="w.locked ? '解锁' : '锁定'" @click="store.toggleLock(w.id)">
            <Unlock v-if="!w.locked" :size="11" />
            <Lock v-else :size="11" />
          </WiButton>
        </span>
      </div>
    </div>
  </WiScrollbar>
</template>

<style scoped>
.layers-scroll :deep(.wi-scrollbar__wrap) {
  height: 100%;
}
.layer-item:hover {
  background: var(--wi-color-surface-hover);
}
.layer-item.selected {
  background: color-mix(in srgb, var(--wi-color-primary) 12%, transparent);
  border-color: var(--wi-color-primary);
}
.layer-item.is-hidden .layer-name {
  opacity: 0.4;
}
.layer-item:hover .layer-actions,
.layer-item.selected .layer-actions {
  display: flex;
}
</style>
