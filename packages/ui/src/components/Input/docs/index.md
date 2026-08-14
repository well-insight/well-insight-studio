---
title: Input
category: 02 / FORM
description: 文本输入框。API 对齐 PrimeVue InputText：size、invalid、variant、fluid。
---

# Input

单行文本输入。API 对齐 [PrimeVue InputText](https://primevue.org/inputtext/)。

## 引入

```ts
import { WdInput } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdInput } from '@well-design/ui'

const value = ref('')
</script>

<template>
  <WdInput v-model="value" label="Name" placeholder="Enter your name" />
</template>
```

## Size

支持 `small` / `large`，并兼容 `sm` / `md` / `lg`。

```vue preview
<script setup lang="ts">
import { WdInput } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:1rem;width:min(24rem,100%)">
    <WdInput size="small" label="Small" placeholder="Small" />
    <WdInput label="Normal" placeholder="Normal" />
    <WdInput size="large" label="Large" placeholder="Large" />
  </div>
</template>
```

## Variant & Fluid

`variant="filled"` 使用填充样式；`fluid` 宽度撑满容器。

```vue preview
<script setup lang="ts">
import { WdInput } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:1rem;width:100%">
    <WdInput variant="outlined" label="Outlined" placeholder="Outlined" />
    <WdInput variant="filled" label="Filled" placeholder="Filled" />
    <WdInput fluid label="Fluid" placeholder="Full width" />
  </div>
</template>
```

## Invalid

优先使用 `invalid`；`error` 仍可作为别名。

```vue preview
<script setup lang="ts">
import { WdInput } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:1rem;width:min(24rem,100%)">
    <WdInput invalid label="Email" model-value="not-an-email" help-text="Enter a valid email" />
    <WdInput clearable label="Clearable" model-value="Draft note" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | 绑定值。 |
| `label` | `string` | — | 标签文案。 |
| `helpText` | `string` | — | 辅助说明。 |
| `invalid` | `boolean` | `false` | 校验失败态。 |
| `error` | `boolean` | `false` | **别名**，请优先使用 `invalid`。 |
| `id` | `string` | — | 原生 id；未传时自动生成。 |
| `type` | `'text' \| 'email' \| 'password' \| 'search' \| 'url' \| 'tel'` | `'text'` | 原生 type。 |
| `size` | `'small' \| 'large' \| 'sm' \| 'md' \| 'lg'` | — | 尺寸；默认中等。 |
| `variant` | `'outlined' \| 'filled'` | `'outlined'` | 样式变体。 |
| `fluid` | `boolean` | `false` | 宽度撑满。 |
| `disabled` | `boolean` | `false` | 禁用。 |
| `readonly` | `boolean` | `false` | 只读。 |
| `clearable` | `boolean` | `false` | 显示清除按钮。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `string` | 值变化。 |
| `clear` | — | 点击清除时触发。 |

## Instance

| 方法 | 说明 |
| --- | --- |
| `focus()` | 聚焦底层 input。 |
