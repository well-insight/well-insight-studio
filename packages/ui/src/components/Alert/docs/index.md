---
title: Alert
category: 08 / MESSAGE
description: 告警条。带标题、描述与操作区，适合页面级提示；轻量行内反馈请用 Message。
---

# Alert

页面级告警条，带标题、描述与操作区，视觉使用 `--wd-*`。

与 [Message](/components/Message) 的分工：

- **Alert**：标题 + 描述、左边色条、可选操作区，用于页面/区块级说明。
- **Message**：单行轻量提示，可带 `life` 自动关闭。

## 引入

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
    <WdAlert title="提示" description="这是一条带标题的告警信息。" />
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
    <WdAlert title="成功" description="保存成功。" severity="success" />
    <WdAlert title="信息" description="请留意更新。" severity="info" />
    <WdAlert title="警告" description="请核对后再提交。" severity="warn" />
    <WdAlert title="错误" description="请求失败，请重试。" severity="error" />
    <WdAlert title="帮助" description="可在设置中关闭此提示。" severity="help" />
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
      title="有可用更新"
      description="新版本已准备就绪。"
      closable
      @close="open = false"
    >
      <template #action>
        <WdButton size="small" label="立即查看" />
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
    <WdAlert title="深色成功" description="effect=dark" severity="success" effect="dark" />
    <WdAlert title="深色警告" description="effect=dark" severity="warn" effect="dark" />
  </div>
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | — | 标题。 |
| `description` | `string` | — | 描述；默认插槽优先。 |
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast' \| 'help' \| 'warning'` | `'info'` | 语义色。 |
| `closable` | `boolean` | `false` | 显示关闭按钮。 |
| `showIcon` | `boolean` | `true` | 显示语义图标。 |
| `effect` | `'light' \| 'dark'` | `'light'` | 浅色底或实心底。 |

## Events

| 事件名 | 说明 |
| --- | --- |
| `close` | 点击关闭时触发。 |

## Slots

| 插槽 | 说明 |
| --- | --- |
| `title` | 自定义标题。 |
| `default` | 描述内容。 |
| `icon` | 自定义图标。 |
| `action` | 操作区。 |
