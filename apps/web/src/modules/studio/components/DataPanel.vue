<script setup lang="ts">
import { ChevronRight, Database, GripVertical, Hash, Type } from '@lucide/vue'
import { WiButton, WiFlex, WiScrollbar, WiTag } from '@well-insight/ui'
import { ref } from 'vue'
import { useDataStore } from '../../../styles/stores/dataStore'
import { isNumericField } from '../utils/sampleData'

const dataStore = useDataStore()

/** 默认展开所有表 */
const collapsed = ref<Record<string, boolean>>({})

function toggleTable(name: string) {
  collapsed.value[name] = !collapsed.value[name]
}

function onFieldDragStart(e: DragEvent, table: string, field: string) {
  e.dataTransfer?.setData('text/plain', JSON.stringify({ table, field }))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="data-panel w-full h-full flex min-h-0 flex-1 flex-col">
    <WiFlex class="panel-header" align="center" :size="6" :wrap="false">
      <Database :size="13" class="header-icon" />
      <h3>数据源</h3>
      <WiTag :value="`${dataStore.tableNames.length} 表`" severity="secondary" size="small" />
    </WiFlex>

    <WiScrollbar class="data-tree min-h-0 flex-1 py-1" :native="false" trigger="hover" aria-label="数据表和字段">
      <div v-if="dataStore.isLoadingSchema" class="data-empty px-3.5 py-6 text-center text-xs leading-relaxed text-[var(--wi-color-text-muted)]">
        正在加载真实数据源结构…
      </div>
      <div v-else-if="!dataStore.datasourceId" class="data-empty px-3.5 py-6 text-center text-xs leading-relaxed text-[var(--wi-color-text-muted)]">
        请先配置并选择真实数据源
      </div>
      <div v-else-if="dataStore.tableNames.length === 0" class="data-empty px-3.5 py-6 text-center text-xs leading-relaxed text-[var(--wi-color-text-muted)]">
        数据源中暂无可用数据表
      </div>
      <div v-for="name in dataStore.tableNames" :key="name" class="table-node">
        <WiButton class="table-header flex items-center gap-1.5 px-3 text-left text-xs font-medium" variant="ghost" fluid :aria-label="`${collapsed[name] ? '展开' : '收起'}表 ${name}`" @click="toggleTable(name)">
          <ChevronRight :size="11" class="chevron" :class="{ open: !collapsed[name] }" />
          <span class="table-name">{{ name }}</span>
          <WiTag class="ml-auto" :value="String(dataStore.getTable(name).rows.length)" severity="secondary" size="small" />
        </WiButton>
        <ul v-show="!collapsed[name]" class="field-list">
          <li
            v-for="field in dataStore.getTable(name).fields"
            :key="field"
            class="field-item flex cursor-grab select-none items-center gap-1.5 px-3 py-1 pl-[22px] text-xs text-[var(--wi-color-text-muted)] hover:bg-[var(--wi-color-surface-hover)] hover:text-[var(--wi-color-text)] active:cursor-grabbing"
            draggable="true"
            :title="`拖拽 ${field} 到画布`"
            @dragstart="onFieldDragStart($event, name, field)"
          >
            <GripVertical :size="11" class="grip" />
            <component :is="isNumericField(dataStore.getTable(name), field) ? Hash : Type" :size="11" class="type-icon" />
            <span class="field-name min-w-0 flex-1 truncate">{{ field }}</span>
            <WiTag class="ml-auto shrink-0" :value="isNumericField(dataStore.getTable(name), field) ? 'num' : 'str'" severity="secondary" size="small" />
          </li>
        </ul>
      </div>
    </WiScrollbar>


    <div class="panel-footer px-3 py-2 text-[10px] text-[var(--wi-color-text-muted)]">
      拖入画布生成组件
    </div>
  </aside>
</template>

<style scoped>
.data-panel {
  background: var(--wi-color-surface);
}
.data-tree :deep(.wi-scrollbar__wrap),
.data-tree :deep(.wi-scrollbar__view) {
  min-height: 100%;
  height: 100%;
}
.chevron {
  color: var(--wi-color-text-muted);
  transition: transform 0.15s;
}
.chevron.open {
  transform: rotate(90deg);
}
.field-list {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
}
</style>
