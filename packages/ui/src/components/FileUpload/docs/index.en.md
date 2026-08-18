---
title: FileUpload
category: 10 / FILE
description: Basic / advanced file selection and list.
---

# FileUpload

Select local files and emit a `select` event.

## Import

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
    <div v-if="names.length">Selected: {{ names.join(', ') }}</div>
  </div>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'basic' \| 'advanced'` | `'basic'` | Advanced mode shows a file list. |
| `multiple` | `boolean` | `false` | Multiple selection. |
| `accept` | `string` | — | Accepted file types. |
| `disabled` | `boolean` | `false` | Disabled. |
| `chooseLabel` | `string` | `'Choose file'` | Button label. |

## Events

| Event | Prop | Description |
| --- | --- | --- |
| `select` | `File[]` | Selection complete. |
