---
title: InputPassword
category: 02 / FORM
description: Password input with show/hide toggle and optional strength feedback.
---

# InputPassword

Password input. Includes a show/hide toggle by default; optional password strength feedback.

## Import

```ts
import { WdInputPassword } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdInputPassword } from '@well-design/ui'

const value = ref('')
</script>

<template>
  <WdInputPassword v-model="value" label="Password" />
</template>
```

## Feedback

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdInputPassword } from '@well-design/ui'

const value = ref('')
</script>

<template>
  <WdInputPassword v-model="value" label="Password" feedback />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | Bound value. |
| `label` | `string` | — | Label text. |
| `feedback` | `boolean` | `false` | Show strength feedback. |
| `toggleMask` | `boolean` | `true` | Show toggle for revealing the password. |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | — | Size. |
| `fluid` | `boolean` | `false` | Full width. |
| `invalid` | `boolean` | `false` | Validation failed state. |
| `disabled` | `boolean` | `false` | Disabled. |

## Events

| Event | Prop | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Value changed. |
