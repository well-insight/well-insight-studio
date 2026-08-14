<script setup lang="ts">
import { computed } from 'vue'
import { resolveSizeClass } from '../../shared/types'
import type { TableProps } from './types'

const props = withDefaults(defineProps<TableProps>(), {
  rowKey: 'id',
  emptyText: '暂无数据',
})
const sizeClass = computed(() => resolveSizeClass(props.size))
</script>

<template>
  <div class="wd-table-wrapper" :class="`wd-table-wrapper--${sizeClass}`">
    <table class="wd-table" :class="`wd-table--${sizeClass}`">
      <thead><tr><th v-for="column in columns" :key="column.key" scope="col" :class="`wd-table__cell--${column.align ?? 'start'}`">{{ column.label }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="String(row[rowKey] ?? index)">
          <td v-for="column in columns" :key="column.key" :class="`wd-table__cell--${column.align ?? 'start'}`">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{ row[column.key] }}</slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0"><td class="wd-table__empty" :colspan="columns.length"><slot name="empty">{{ emptyText }}</slot></td></tr>
      </tbody>
    </table>
  </div>
</template>
