---
title: Timeline
category: 06 / DATA
description: 垂直时间轴，可左/右/交替对齐。
---

# Timeline

按时间顺序展示事件节点。

## 引入

```ts
import { WdTimeline } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { WdTimeline } from '@well-design/ui'

const events = [
  { status: 'Ordered', date: '15/10/2024', content: 'Order placed' },
  { status: 'Shipped', date: '16/10/2024', content: 'On the way', color: '#22c55e' },
  { status: 'Delivered', date: '17/10/2024', content: 'Arrived' },
]
</script>

<template>
  <WdTimeline :value="events" align="alternate" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `{ status?, content?, date?, icon?, color? }[]` | — | 事件。 |
| `align` | `'left' \| 'right' \| 'alternate'` | `'left'` | 对齐。 |

## Slots

| 插槽 | 说明 |
| --- | --- |
| `content` | 主内容，`{ item, index }`。 |
| `opposite` | 对侧内容，默认显示 `date`。 |
