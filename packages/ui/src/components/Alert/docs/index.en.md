---
title: Alert
category: 08 / MESSAGE
description: Alert banner with title, description, and action area for page-level notices; use Message for lightweight inline feedback.
---

# Alert

Page-level alert banner with title, description, and action area. Visuals use `--wd-*`.

Division of responsibility with [Message](/components/Message):

- **Alert**: Title + description, left accent bar, optional action area — for page or section-level notices.
- **Message**: Single-line lightweight toast; can auto-dismiss with `life`.

## Import

```ts
import { WdAlert } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { WdAlert } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(36rem,100%)">
    <WdAlert title="Notice" description="This is an alert with a title." />
  </div>
</template>
```

## Severity

```vue preview
<script setup lang="ts">
import { WdAlert } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(36rem,100%)">
    <WdAlert title="Success" description="Saved successfully." severity="success" />
    <WdAlert title="Info" description="Please note the update." severity="info" />
    <WdAlert title="Warning" description="Please review before submitting." severity="warn" />
    <WdAlert title="Error" description="Request failed. Please try again." severity="error" />
    <WdAlert title="Help" description="You can turn this tip off in settings." severity="help" />
  </div>
</template>
```

## Closable + Action

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdAlert, WdButton } from '@well-design/ui'

const open = ref(true)
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(36rem,100%)">
    <WdAlert
      v-if="open"
      title="Update available"
      description="A new version is ready."
      closable
      @close="open = false"
    >
      <template #action>
        <WdButton size="small" label="View now" />
      </template>
    </WdAlert>
  </div>
</template>
```

## Dark effect

```vue preview
<script setup lang="ts">
import { WdAlert } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(36rem,100%)">
    <WdAlert title="Dark success" description="effect=dark" severity="success" effect="dark" />
    <WdAlert title="Dark warning" description="effect=dark" severity="warn" effect="dark" />
  </div>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Title. |
| `description` | `string` | — | Description; default slot takes precedence. |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'help' \| 'warning'` | `'info'` | Semantic color. |
| `closable` | `boolean` | `false` | Show close button. |
| `showIcon` | `boolean` | `true` | Show semantic icon. |
| `effect` | `'light' \| 'dark'` | `'light'` | Light background or solid fill. |

## Events

| Event | Description |
| --- | --- |
| `close` | Fired when the close button is clicked. |

## Slots

| Slot | Description |
| --- | --- |
| `title` | Custom title. |
| `default` | Description content. |
| `icon` | Custom icon. |
| `action` | Action area. |
