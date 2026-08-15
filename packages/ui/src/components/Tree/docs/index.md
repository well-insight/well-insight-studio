---
title: Tree
category: 06 / DATA
description: 可展开的树形结构，支持单选与多选。
---

# Tree

展示层级节点，支持展开/折叠与选择。

## 引入

```ts
import { WdTree } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdTree } from '@well-design/ui'

const selected = ref<string | null>(null)
const nodes = [
  {
    key: '0',
    label: 'Documents',
    children: [
      { key: '0-0', label: 'Work' },
      { key: '0-1', label: 'Home' },
    ],
  },
]
</script>

<template>
  <WdTree v-model="selected" :value="nodes" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `{ key, label, children?, icon? }[]` | — | 节点树。 |
| `modelValue` | `string \| null` | `null` | 单选选中 key。 |
| `selectionKeys` | `Record<string, boolean>` | `{}` | 多选选中表。 |
| `selectionMode` | `'single' \| 'multiple'` | `'single'` | 选择模式。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `string \| null` | 单选变化。 |
| `update:selectionKeys` | `Record<string, boolean>` | 选择表变化。 |
