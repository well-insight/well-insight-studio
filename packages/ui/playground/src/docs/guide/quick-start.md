---
title: 快速上手
order: 2
description: 安装依赖、引入样式，并渲染第一个组件。
---

# 快速上手

## 安装

**在应用项目中（npm / pnpm / yarn）：**

```bash
pnpm add @well-design/ui @well-design/theme vue
```

需要 Vue 3.5+。`@well-design/theme` 提供主题 JS API；组件样式里的 CSS 变量已打进 `@well-design/ui/styles.css`。

**在本 Monorepo 内**已作为 workspace 包存在，直接依赖即可，开发态走源码热更新。

## 引入样式

在应用入口引入组件库样式：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App).mount('#app')
```

无需再单独引入 `@well-design/theme/styles.css`（除非你只用 theme、不装 UI）。

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

## 主题 API

亮暗切换等能力来自 `@well-design/theme`：

```ts
import { useTheme } from '@well-design/theme'

const { toggleTheme } = useTheme()
```

详见 [主题](/docs/theme)。

## 启动本仓库文档站

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182

# 构建静态文档站
pnpm --filter @well-design/ui build:docs
```
