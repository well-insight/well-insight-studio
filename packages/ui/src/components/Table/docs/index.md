---
title: Table
category: 05 / DATA
description: 数据表格。支持列定义、单元格插槽与 small/large 密度。
---

# Table

基础数据表格。通过 `columns` / `rows` 渲染，列内容可用 `cell-{key}` 插槽自定义。

## 引入

```ts
import { WdTable, WdTag } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { WdTable, WdTag } from '@well-design/ui'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner', align: 'end' as const },
]
const rows = [
  { id: 1, name: 'Landing', status: 'Published', owner: 'Ada' },
  { id: 2, name: 'Dashboard', status: 'Draft', owner: 'Lin' },
]
</script>

<template>
  <WdTable :columns="columns" :rows="rows">
    <template #cell-status="{ value }">
      <WdTag :value="String(value)" :severity="value === 'Published' ? 'success' : 'secondary'" />
    </template>
  </WdTable>
</template>
```

## Size

```vue preview
<script setup lang="ts">
import { WdTable } from '@well-design/ui'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
]
const rows = [
  { id: 1, name: 'Ada', role: 'Designer' },
  { id: 2, name: 'Lin', role: 'Engineer' },
]
</script>

<template>
  <div style="display:grid;gap:1.25rem">
    <WdTable :columns="columns" :rows="rows" size="small" />
    <WdTable :columns="columns" :rows="rows" size="large" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columns` | `TableColumn[]` | — | 列定义。 |
| `rows` | `Record<string, unknown>[]` | — | 行数据。 |
| `rowKey` | `string` | `'id'` | 行主键字段。 |
| `emptyText` | `string` | `'暂无数据'` | 空状态文案。 |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | — | 行高密度。 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `cell-{key}` | 单元格内容，作用域 `{ row, value }`。 |
| `empty` | 空状态。 |
