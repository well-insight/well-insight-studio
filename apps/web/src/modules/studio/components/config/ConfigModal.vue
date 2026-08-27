<script setup lang="ts">
import type { Widget } from '@well-insight/shared'
import { message, WiDialog, WiSelect } from '@well-insight/ui'
import { computed } from 'vue'
import { useConfigStore } from '../../../../styles/stores/configStore'
import { useDataStore } from '../../../../styles/stores/dataStore'
import { useWidgetStore } from '../../../../styles/stores/widgetStore'
import FieldSelector from './FieldSelector.vue'
import OperationPanel from './OperationPanel.vue'
import PreviewPanel from './PreviewPanel.vue'

const config = useConfigStore()
const dataStore = useDataStore()
const widgetStore = useWidgetStore()

const visible = computed({
  get: () => config.isOpen,
  set: v => { if (!v) config.close() },
})

const dataSourceOptions = computed(() =>
  dataStore.tableNames.map(name => ({ label: name, value: name })),
)

function onDataSourceChange(name: string) {
  config.dataSource = name
  // 切换数据源后清空选中，重新初始化 ops
  config.selectedFields = []
  const ops = config.fieldOps
  for (const field of dataStore.getTable(name).fields) {
    if (!ops[field]) {
      ops[field] = { alias: field, agg: 'none', sort: 'none', filter: '', hidden: false }
    }
  }
}

function apply() {
  const widget = widgetStore.widgets.find(w => w.id === config.targetId)
  if (!widget) {
    config.close()
    return
  }
  const visibleFields = config.fields
    .filter(f => {
      const ops = config.fieldOps[f]
      return ops && !ops.hidden
    })
    .filter(f => config.selectedFields.includes(f))

  if (visibleFields.length === 0) {
    message.warn('至少保留一个可见字段')
    return
  }

  widgetStore.pushHistory()
  widget.dataSource = config.dataSource
  widget.config.fieldOps = Object.fromEntries(
    Object.entries(config.fieldOps).map(([k, v]) => [k, { ...v }]),
  )
  widget.config.visibleFields = visibleFields

  const firstField = visibleFields[0]!
  const alias = config.fieldOps[firstField]?.alias || firstField
  widget.title = `${alias} 分析`

  config.close()
  message.success(`已应用配置到「${widget.title}」`)
}

function cancel() {
  config.close()
}

function open(widget: Widget) {
  config.open(widget)
}

defineExpose({ open })
</script>

<template>
  <WiDialog
    v-model:visible="visible"
    header="配置组件"
    :style="{ width: '720px', height: '520px' }"
    :modal="true"
    :closable="true"
    :close-on-escape="true"
  >
    <div class="config-modal-body">
      <div class="config-modal-header">
        <div class="ds-selector">
          <span>数据源</span>
          <WiSelect
            :model-value="config.dataSource"
            :options="dataSourceOptions"
            @update:model-value="onDataSourceChange($event as string)"
          />
        </div>
        <span class="field-count">{{ config.fields.length }} 个字段</span>
      </div>

      <div class="config-modal-columns">
        <div class="column field-list-col">
          <FieldSelector />
        </div>
        <div class="column op-col">
          <OperationPanel />
        </div>
        <div class="column preview-col">
          <PreviewPanel />
        </div>
      </div>

      <div class="config-modal-footer">
        <button class="btn-cancel" @click="cancel">
          取消
        </button>
        <button class="btn-apply" @click="apply">
          应用
        </button>
      </div>
    </div>
  </WiDialog>
</template>

<style scoped>
.config-modal-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  min-height: 0;
}
.config-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--wi-border-color, #1a212e);
}
.ds-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--wi-text-secondary, #8a9bb5);
}
.field-count {
  font-size: 10px;
  color: var(--wi-text-secondary, #6a7b98);
  margin-left: auto;
}
.config-modal-columns {
  flex: 1;
  display: grid;
  grid-template-columns: 180px 1fr 1fr;
  gap: 6px;
  min-height: 0;
}
.column {
  border: 1px solid var(--wi-border-color, #1a212e);
  border-radius: 6px;
  overflow: hidden;
  min-width: 0;
  background: var(--wi-surface, #0a0f18);
}
.config-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 4px;
  border-top: 1px solid var(--wi-border-color, #1a212e);
}
.btn-cancel,
.btn-apply {
  font-size: 11px;
  padding: 5px 14px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid var(--wi-border-color, #2a3448);
}
.btn-cancel {
  background: transparent;
  color: var(--wi-text-secondary, #8a9bb5);
}
.btn-cancel:hover {
  color: var(--wi-text-color, #e8edf5);
}
.btn-apply {
  background: var(--wi-primary, #3b82f6);
  border-color: var(--wi-primary, #3b82f6);
  color: white;
}
.btn-apply:hover {
  opacity: 0.9;
}
</style>
