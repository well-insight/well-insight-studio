---
title: Toast
category: 04 / OVERLAY
description: Lightweight message feedback.
---

# Toast

Lightweight message feedback for operation results.

## Import

```ts
import { WdToast } from '@well-design/ui'
```

## Basic

Pass the message list via `messages`; closing emits `close`.

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

Supports `success`, `info`, `warn`, and `error`; the legacy value `warning` maps to `warn`.

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

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `messages` | `ToastMessage[]` | `[]` | Currently displayed messages. |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Container position. |
| `teleport` | `boolean` | `true` | Overlay Teleport; defaults to `body`. |
| `appendTo` | `string \| HTMLElement \| 'self' \| false` | `'body'` | Mount target; `'self'` / `false` renders in place. |

### ToastMessage

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string \| number` | — | Unique key. |
| `summary` | `string` | — | Title. |
| `detail` | `string` | — | Detail. |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'warning'` | `'info'` | Semantic color. `warning` maps to `warn`. |
| `closable` | `boolean` | `true` | Whether to show the close button. |

## Events

| Event | Prop | Description |
| --- | --- | --- |
| `close` | `ToastMessage` | Emitted when the close button is clicked; the caller should remove the item from `messages`. |
