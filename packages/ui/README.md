# @well-design/ui

本地 Vue 3 组件库，可独立启动文档站。

```ts
import { WdButton, WdInput } from '@well-design/ui'
import '@well-design/ui/styles.css'
```

所有组件消费 `@well-design/theme` 的 CSS 变量。

## 启动文档站

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182
```

## 组件文档约定

在组件目录写 `docs/index.md`，使用 Markdown + `vue preview` 代码块：

````md
---
title: Button
category: 01 / PRIMITIVE
description: 按钮简介
---

# Button

## Basic

```vue preview
<script setup lang="ts">
import { WdButton } from '@well-design/ui'
</script>

<template>
  <WdButton label="Submit" />
</template>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 按钮文案 |
````

文档站基于 `unplugin-vue-markdown` 与 `vite-plugin-markdown-preview`。
