---
title: FileUpload
category: 10 / FILE
description: 基础 / 高级文件选择与列表。
---

# FileUpload

选择本地文件并触发 `select` 事件。

## 引入

```ts
import { WdFileUpload } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdFileUpload } from '@well-design/ui'

const names = ref<string[]>([])
function onSelect(files: File[]) {
  names.value = files.map((f) => f.name)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:0.75rem">
    <WdFileUpload mode="advanced" multiple @select="onSelect" />
    <div v-if="names.length">已选：{{ names.join(', ') }}</div>
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `'basic' \| 'advanced'` | `'basic'` | 高级模式展示文件列表。 |
| `multiple` | `boolean` | `false` | 多选。 |
| `accept` | `string` | — | 接受的文件类型。 |
| `disabled` | `boolean` | `false` | 禁用。 |
| `chooseLabel` | `string` | `'选择文件'` | 按钮文案。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `select` | `File[]` | 选择完成。 |
