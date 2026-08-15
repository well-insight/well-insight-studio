---
title: CascadeSelect
category: 02 / FORM
description: 多级联级选择，支持嵌套 options 与分栏面板。
---

# CascadeSelect

从嵌套选项中逐级选择一个值。

## 引入

```ts
import { WdCascadeSelect } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdCascadeSelect } from '@well-design/ui'

const value = ref<string | number | null>(null)
const options = [
  {
    label: '电子产品',
    value: 'electronics',
    children: [
      { label: '手机', value: 'phone' },
      { label: '笔记本', value: 'laptop' },
    ],
  },
  { label: '图书', value: 'books' },
]
</script>

<template>
  <WdCascadeSelect v-model="value" :options="options" placeholder="选择分类" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number \| null` | `null` | 选中值。 |
| `options` | `CascadeSelectOption[]` | — | 嵌套选项。 |
| `placeholder` | `string` | `'请选择'` | 占位文案。 |
| `disabled` | `boolean` | `false` | 禁用。 |
| `teleport` | `boolean` | `true` | 浮层 Teleport；默认挂到 `body`。 |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'` | 挂载目标；`'self'` / `false` 就地渲染。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `CascadeSelectValue` | 选中变化。 |
