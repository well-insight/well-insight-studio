<script setup lang="ts">
import { computed } from 'vue'
import type { Widget } from '@well-insight/shared'
import { useDataStore } from '../../../../stores/dataStore'
import { useWidgetData } from '../../composables/useWidgetData'

const props = defineProps<{ widget: Widget }>()

const dataStore = useDataStore()

const { processed, isLoading } = useWidgetData(props.widget, dataStore.getTable(props.widget.dataSource))

const MAX_COLS = 4
const MAX_ROWS = 5

const headers = computed(() => processed.value.displayFields.slice(0, MAX_COLS))
const rows = computed(() => processed.value.rows.slice(0, MAX_ROWS))
const totalRows = computed(() => processed.value.rows.length)

function formatCell(cell: unknown): string {
  if (typeof cell === 'number') return cell.toLocaleString()
  return String(cell ?? '—')
}
</script>

<template>
  <div v-if="isLoading" class="widget-empty">加载数据中…</div>
  <div v-else-if="rows.length" class="table-wrap">
    <table class="widget-table">
      <thead>
        <tr>
          <th v-for="(h, i) in headers" :key="i">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td v-for="(cell, ci) in row.slice(0, MAX_COLS)" :key="ci">{{ formatCell(cell) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="totalRows > MAX_ROWS" class="table-note">显示前 {{ MAX_ROWS }} 条，共 {{ totalRows }} 条</div>
  </div>
  <div v-else class="widget-empty">无数据，双击配置字段</div>
</template>

<style scoped>
.table-wrap {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.widget-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}
.widget-table th {
  text-align: left;
  padding: 3px 6px;
  color: var(--wi-text-secondary, #8a9bb5);
  font-weight: 500;
  border-bottom: 1px solid var(--wi-border-color, #1e2638);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}
.widget-table td {
  padding: 3px 6px;
  border-bottom: 1px solid var(--wi-border-color, rgba(30, 38, 56, 0.5));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}
.table-note {
  margin-top: auto;
  font-size: 8px;
  color: var(--wi-text-secondary, #4a5a78);
  text-align: right;
  padding-top: 2px;
}
.widget-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--wi-text-secondary, #4a5a78);
  text-align: center;
}
</style>
