---
title: Icon
category: 01 / PRIMITIVE
description: 内置 SVG 图标。尺寸支持 small/large 与 sm/md/lg 别名。
---

# Icon

内置线框图标集。尺寸通过 `resolveSizeClass` 对齐 `small` / `normal` / `large`。

## 引入

```ts
import { WdIcon } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { WdIcon } from '@well-design/ui'
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center">
    <WdIcon name="search" />
    <WdIcon name="check" size="small" />
    <WdIcon name="plus" size="large" />
    <WdIcon name="trash" size="sm" label="Delete" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `IconName` | — | 图标名称。 |
| `label` | `string` | — | 可访问名称；省略时 `aria-hidden`。 |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸；`sm`/`lg` 映射到 small/large。 |
