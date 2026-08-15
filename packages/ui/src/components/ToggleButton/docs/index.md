---
title: ToggleButton
category: 02 / FORM
description: 在开/关两种标签状态间切换的按钮。
---

# ToggleButton

布尔切换按钮，可配置开/关文案与图标。

## 引入

```ts
import { WdToggleButton } from '@well-design/ui'
```

## Basic

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdToggleButton } from '@well-design/ui'

const on = ref(false)
</script>

<template>
  <WdToggleButton v-model="on" on-label="开启" off-label="关闭" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | 是否开启。 |
| `onLabel` / `offLabel` | `string` | `On` / `Off` | 文案。 |
| `onIcon` / `offIcon` | `string` | — | 可选图标字符。 |
| `disabled` | `boolean` | `false` | 禁用。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `boolean` | 值变化。 |
