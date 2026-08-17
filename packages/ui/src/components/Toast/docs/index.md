---
title: Toast
category: 04 / OVERLAY
description: 轻量消息反馈。
---

# Toast

轻量消息反馈，用于操作结果提示。Severity 

## 引入

```ts
import { WdToast } from '@well-design/ui'
```

## Basic

通过 `messages` 传入消息列表；关闭时触发 `close` 事件。

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdToast, WdButton } from '@well-design/ui'
import type { ToastMessage } from '@well-design/ui'

const messages = ref<ToastMessage[]>([])
let seq = 0

function push(severity: ToastMessage['severity'], summary: string, detail?: string) {
  messages.value = [
    ...messages.value,
    { id: `toast-${++seq}`, summary, detail, severity },
  ]
}

function onClose(message: ToastMessage) {
  messages.value = messages.value.filter((item) => item.id !== message.id)
}
</script>

<template>
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
    <WdButton label="Success" severity="success" @click="push('success', 'Saved', 'Your changes are live.')" />
    <WdButton label="Info" severity="info" @click="push('info', 'Tip', 'Something to know.')" />
    <WdButton label="Warn" severity="warn" @click="push('warn', 'Caution', 'Please double-check.')" />
    <WdButton label="Error" severity="danger" @click="push('error', 'Failed', 'Please try again.')" />
  </div>
  <WdToast :messages="messages" position="top-right" @close="onClose" />
</template>
```

## Severity

支持 `success`、`info`、`warn`、`error`；旧值 `warning` 映射为 `warn`。

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdToast } from '@well-design/ui'
import type { ToastMessage } from '@well-design/ui'

const messages = ref<ToastMessage[]>([
  { id: 1, summary: 'Success', detail: 'Operation completed.', severity: 'success', closable: false },
  { id: 2, summary: 'Info', detail: 'Neutral notice.', severity: 'info', closable: false },
  { id: 3, summary: 'Warn', detail: 'Needs attention.', severity: 'warn', closable: false },
  { id: 4, summary: 'Error', detail: 'Something failed.', severity: 'error', closable: false },
])
</script>

<template>
  <div style="min-height:14rem;position:relative">
    <WdToast :messages="messages" position="top-left" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `messages` | `ToastMessage[]` | `[]` | 当前展示的消息列表。 |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | 容器定位。 |
| `teleport` | `boolean` | `true` | 浮层 Teleport；默认挂到 `body`。 |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'` | 挂载目标；`'self'` / `false` 就地渲染。 |

### ToastMessage

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `string \| number` | — | 唯一键。 |
| `summary` | `string` | — | 标题。 |
| `detail` | `string` | — | 详情。 |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'warning'` | `'info'` | 语义色。`warning` 映射为 `warn`。 |
| `closable` | `boolean` | `true` | 是否显示关闭按钮。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `close` | `ToastMessage` | 点击关闭时触发，由调用方从 `messages` 中移除。 |
