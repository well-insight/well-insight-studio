---
title: OrderList
category: 06 / DATA
description: 列表项上移下移排序。
---

# OrderList

通过上下按钮重排列表。

## 引入

```ts
import { WdOrderList } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdOrderList } from '@well-design/ui'

const items = ref(['设计', '开发', '测试', '发布'])
</script>

<template>
  <WdOrderList v-model="items" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `unknown[]` | `[]` | 列表数据。 |
| `dataKey` | `string` | — | 对象项的唯一键。 |
| `listStyle` | `string \| object` | — | 列表样式。 |

## Slots

| 插槽 | 说明 |
| --- | --- |
| `item` | `{ item, index }` 自定义项。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `unknown[]` | 顺序变化。 |
