---
title: Message
category: 08 / MESSAGE
description: Inline message. Supports severity, closable, auto-dismiss via life, and an optional icon.
---

# Message

Inline message for in-page feedback.

For page-level alerts that need a title, description, and action area, use [Alert](/components/Alert).

## Import

```ts
import { WdMessage } from '@well-design/ui'
```

## Basic

Defaults to `info` severity. Pass content through the default slot.

```vue preview
<script setup lang="ts">
import { WdMessage } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage>The action is complete. You can continue.</WdMessage>
  </div>
</template>
```

## Severity

Supports `success`, `info`, `warn`, `error`, `secondary`, and `contrast`. The legacy value `warning` maps to `warn`.

```vue preview
<script setup lang="ts">
import { WdMessage } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage severity="success">Saved successfully.</WdMessage>
    <WdMessage severity="info">This is an informational message.</WdMessage>
    <WdMessage severity="warn">Please review before submitting.</WdMessage>
    <WdMessage severity="error">The request failed. Please try again.</WdMessage>
    <WdMessage severity="secondary">Secondary note.</WdMessage>
    <WdMessage severity="contrast">High-contrast message.</WdMessage>
  </div>
</template>
```

## Closable

Set `closable` to show a close button. Closing emits `close`.

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdMessage } from '@well-design/ui'

const closed = ref(false)
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage v-if="!closed" closable @close="closed = true">Closable message.</WdMessage>
    <p v-else style="margin:0;color:var(--wd-color-text-muted)">Message closed</p>
  </div>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'warning'` | `'info'` | Semantic color. `warning` maps to `warn`. |
| `closable` | `boolean` | `false` | Whether to show the close button. |
| `life` | `number` | — | Auto-dismiss delay in milliseconds. Omit to keep the message open. |
| `icon` | `boolean` | `true` | Whether to show the severity icon. |

## Events

| Event | Prop | Description |
| --- | --- | --- |
| `close` | — | Emitted when the close button is clicked or `life` elapses. |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Message body. |
