---
title: InputPassword
category: 02 / FORM
description: 密码输入框，支持显示/隐藏与强度提示。
---

# InputPassword

密码输入。默认提供显示/隐藏切换；可选密码强度反馈。

## 引入

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

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | 绑定值。 |
| `label` | `string` | — | 标签文案。 |
| `feedback` | `boolean` | `false` | 显示强度提示。 |
| `toggleMask` | `boolean` | `true` | 显示切换明文按钮。 |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | — | 尺寸。 |
| `fluid` | `boolean` | `false` | 宽度撑满。 |
| `invalid` | `boolean` | `false` | 校验失败态。 |
| `disabled` | `boolean` | `false` | 禁用。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `string` | 值变化。 |
