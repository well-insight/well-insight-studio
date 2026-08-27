<script setup lang="ts">
import type { Widget, WidgetType } from '@well-insight/shared'
import { WiInput, WiInputColor, WiInputNumber, WiScrollbar, WiSelect } from '@well-insight/ui'
import { computed } from 'vue'
import { useDataStore } from '../../../styles/stores/dataStore'
import { useWidgetStore, WIDGET_DEFAULTS } from '../../../styles/stores/widgetStore'

const store = useWidgetStore()
const dataStore = useDataStore()

const widget = computed(() => store.selectedWidget)

const dataSourceOptions = computed(() =>
  dataStore.tableNames.map(name => ({ label: name, value: name })),
)

const typeOptions = (Object.keys(WIDGET_DEFAULTS) as WidgetType[]).map(t => ({
  label: WIDGET_DEFAULTS[t]!.label,
  value: t,
}))

function update<K extends keyof Widget>(key: K, value: Widget[K]) {
  if (!widget.value) return
  store.updateWidget(widget.value.id, { [key]: value } as Partial<Widget>, `${String(key)}-${widget.value.id}`)
}
</script>

<template>
  <WiScrollbar class="props-scroll" :native="false" trigger="hover" aria-label="组件属性">
    <div class="props-panel flex min-h-full flex-col gap-3 p-3">
      <div v-if="!widget" class="empty-tip p-6 text-center text-xs text-[var(--wi-color-text-muted)]">
        点击画布组件查看属性
      </div>

      <template v-else>
        <div class="prop-group">
          <WiInput
            :model-value="widget.title"
            label="标题"
            @update:model-value="update('title', String($event))"
          />
        </div>

        <div class="prop-group">
          <WiSelect
            :model-value="widget.dataSource"
            label="数据源"
            :options="dataSourceOptions"
            fluid
            @update:model-value="update('dataSource', String($event))"
          />
        </div>

        <div class="prop-group">
          <WiSelect
            :model-value="widget.type"
            label="图表类型"
            :options="typeOptions"
            fluid
            @update:model-value="update('type', $event as WidgetType)"
          />
        </div>

        <div class="prop-group">
          <label class="prop-label">主题色</label>
          <WiInputColor
            :model-value="widget.color"
            @update:model-value="update('color', String($event))"
          />
        </div>

        <div class="prop-group">
          <label class="prop-label">位置与尺寸</label>
          <div class="prop-grid">
            <WiInputNumber :model-value="widget.x" label="X" :min="0" fluid @update:model-value="update('x', Number($event) || 0)" />
            <WiInputNumber :model-value="widget.y" label="Y" :min="0" fluid @update:model-value="update('y', Number($event) || 0)" />
            <WiInputNumber :model-value="widget.width" label="宽" :min="110" fluid @update:model-value="update('width', Number($event) || 110)" />
            <WiInputNumber :model-value="widget.height" label="高" :min="70" fluid @update:model-value="update('height', Number($event) || 70)" />
          </div>
        </div>

        <div class="prop-group meta">
          <div>ID：{{ widget.id.slice(0, 8) }}…</div>
          <div>类型：{{ WIDGET_DEFAULTS[widget.type]?.label }}</div>
        </div>
      </template>
    </div>
  </WiScrollbar>
</template>

<style scoped>
.props-scroll :deep(.wi-scrollbar__wrap) {
  height: 100%;
}
.meta {
  border-top: 1px solid var(--wi-color-border);
}
</style>
