---
title: Splitter
category: 05 / PANEL
description: 双栏分割布局，支持水平 / 垂直。
---

# Splitter

将内容拆成两个可并排或上下排列的区域。

## 引入

```ts
import { WdSplitter } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { WdSplitter } from '@well-design/ui'
</script>

<template>
  <WdSplitter style="min-height: 8rem">
    <template #panel1>
      <div style="padding: 0.75rem">Panel A</div>
    </template>
    <template #panel2>
      <div style="padding: 0.75rem">Panel B</div>
    </template>
  </WdSplitter>
</template>
```

## Vertical

```vue preview
<script setup lang="ts">
import { WdSplitter } from '@well-design/ui'
</script>

<template>
  <WdSplitter layout="vertical" style="min-height: 10rem">
    <template #panel1>
      <div style="padding: 0.75rem">Top</div>
    </template>
    <template #panel2>
      <div style="padding: 0.75rem">Bottom</div>
    </template>
  </WdSplitter>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | 分割方向。 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `panel1` | 左侧 / 上方面板。 |
| `panel2` | 右侧 / 下方面板。 |
| `default` | 未使用命名插槽时取前两个子节点。 |
