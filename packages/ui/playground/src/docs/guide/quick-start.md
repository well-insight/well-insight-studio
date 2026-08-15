---
title: 快速上手
order: 2
description: 安装依赖、引入样式，并渲染第一个组件。
---

# 快速上手

## 安装

在 monorepo 内已作为 workspace 包存在时，直接依赖即可：

```bash
pnpm add @well-design/ui @well-design/theme
```

## 引入样式

在应用入口引入组件库样式（样式已包含对主题变量的消费）：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App).mount('#app')
```

## 使用组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdInput } from '@well-design/ui'

const name = ref('')
</script>

<template>
  <div style="display: grid; gap: 1rem; max-width: 20rem">
    <WdInput v-model="name" label="名称" placeholder="输入名称" />
    <WdButton label="提交" @click="() => undefined" />
  </div>
</template>
```

## 可选：应用级全局配置

```ts
import { createApp } from 'vue'
import { createWellDesign } from '@well-design/ui'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      size: 'small',
      zIndex: 1100,
    }),
  )
  .mount('#app')
```

更多说明见 [全局配置](/docs/config)。

## 启动本仓库文档站

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182
```
