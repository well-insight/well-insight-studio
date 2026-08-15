---
title: Message
category: 08 / MESSAGE
description: 行内消息提示。支持 severity、closable、life 自动关闭，以及可选图标。
---

# Message

行内消息提示，用于页面内反馈。Severity 对齐 [PrimeVue Message](https://primevue.org/message/)。

## 引入

```ts
import { WdMessage } from '@well-design/ui'
```

## Basic

默认 `info` 语义；通过默认插槽传入内容。

```vue preview
<script setup lang="ts">
import { WdMessage } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage>操作已完成，可继续下一步。</WdMessage>
  </div>
</template>
```

## Severity

支持 `success`、`info`、`warn`、`error`、`secondary`、`contrast`；旧值 `warning` 映射为 `warn`。

```vue preview
<script setup lang="ts">
import { WdMessage } from '@well-design/ui'
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage severity="success">保存成功。</WdMessage>
    <WdMessage severity="info">这是一条提示信息。</WdMessage>
    <WdMessage severity="warn">请核对后再提交。</WdMessage>
    <WdMessage severity="error">请求失败，请重试。</WdMessage>
    <WdMessage severity="secondary">次要说明。</WdMessage>
    <WdMessage severity="contrast">高对比提示。</WdMessage>
  </div>
</template>
```

## Closable

设置 `closable` 显示关闭按钮；关闭时触发 `close`。

```vue preview
<script setup lang="ts">
import { ref } from 'vue'
import { WdMessage } from '@well-design/ui'

const closed = ref(false)
</script>

<template>
  <div style="display:grid;gap:0.75rem;width:min(32rem,100%)">
    <WdMessage v-if="!closed" closable @close="closed = true">可关闭的消息。</WdMessage>
    <p v-else style="margin:0;color:var(--wd-color-text-muted)">消息已关闭</p>
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'warning'` | `'info'` | 语义色。`warning` 映射为 `warn`。 |
| `closable` | `boolean` | `false` | 是否显示关闭按钮。 |
| `life` | `number` | — | 自动关闭延迟（毫秒）；省略则不自动关闭。 |
| `icon` | `boolean` | `true` | 是否显示语义图标。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `close` | — | 点击关闭或到达 `life` 时触发。 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `default` | 消息正文。 |
