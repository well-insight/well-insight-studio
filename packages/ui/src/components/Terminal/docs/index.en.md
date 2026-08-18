---
title: Terminal
category: 07 / MISC
description: Simple command-prompt UI.
---

# Terminal

Shows a welcome message and command history; submitting emits `command`.

## Import

```ts
import { WdTerminal } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdTerminal } from '@well-design/ui'

const last = ref('')
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:0.5rem">
    <WdTerminal welcome-message="Well Design Terminal" @command="last = $event" />
    <div v-if="last">Last command: {{ last }}</div>
  </div>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `welcomeMessage` | `string` | `'Welcome to Well Design Terminal'` | Welcome message at the top. |
| `prompt` | `string` | `'>'` | Prompt. |

## Events

| Event | Prop | Description |
| --- | --- | --- |
| `command` | `string` | Submitted command. |
