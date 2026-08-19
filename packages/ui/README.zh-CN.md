# @well-design/ui

[English](./README.md) · [中文](./README.zh-CN.md)

面向 [Well Design](../../README.zh-CN.md) 平台的 Vue 3 组件库：带主题的表单、浮层、数据展示与反馈等基础控件。

| | |
| --- | --- |
| **npm** | [`@well-design/ui`](https://www.npmjs.com/package/@well-design/ui) |
| **源码** | [GitHub](https://github.com/xcGoGo2/well-design) · [Gitee](https://gitee.com/xcGoGo/well-design) |
| **更新日志** | [CHANGELOG.md](./CHANGELOG.md) · [English](./CHANGELOG.en.md) |

## 要求

- Vue `^3.5`
- 能解析包 `exports` 的构建工具（Vite、webpack 5+ 等）

## 安装

```bash
pnpm add @well-design/ui vue
# npm i @well-design/ui vue
# yarn add @well-design/ui vue
```

## 快速上手

在应用入口**只引入一次**样式，再按需引入组件：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App).mount('#app')
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { WdButton, WdInput } from '@well-design/ui'

const name = ref('')
</script>

<template>
  <div style="display: grid; gap: 1rem; max-width: 20rem">
    <WdInput v-model="name" label="名称" placeholder="输入名称" />
    <WdButton label="提交" />
  </div>
</template>
```

支持按需导入（Tree-shaking）。样式需单独引入 `@well-design/ui/styles.css`。

## 应用级默认配置（`createWellDesign`）

可选插件，用于全局默认值（浮层挂载、尺寸、密度、语言、z-index）：

```ts
import { createApp } from 'vue'
import { createWellDesign, enUS } from '@well-design/ui'
import App from './App.vue'
import '@well-design/ui/styles.css'

createApp(App)
  .use(
    createWellDesign({
      appendTo: 'body',
      size: 'small',
      density: 'comfortable',
      zIndex: 1100,
      locale: enUS,
    }),
  )
  .mount('#app')
```

| 选项 | 作用 |
| --- | --- |
| `appendTo` | 浮层默认 Teleport 目标（默认 `'body'`） |
| `size` | 控件默认尺寸 |
| `density` | `compact` / `comfortable` / `spacious` |
| `inputVariant` | `outlined` / `filled` |
| `zIndex` | 浮层 z-index 基准 |
| `locale` | 内置文案（默认 `zhCN`，可传 `enUS` 或部分覆盖） |

局部覆盖可用 `<WdConfigProvider>`。优先级：

**组件 Props → `WdConfigProvider` → `createWellDesign` → 内置默认**

## 语言

内置文案默认**中文**。切换英文或覆盖部分文案：

```ts
import { createWellDesign, enUS, zhCN } from '@well-design/ui'

createWellDesign({ locale: enUS })

createWellDesign({
  locale: {
    ...zhCN,
    accept: '确定',
  },
})
```

## 主题

亮暗主题与相关 API 同包提供：

```ts
import { useTheme } from '@well-design/ui'

const { theme, isDark, setTheme, toggleTheme } = useTheme()
```

`useTheme` 会把选择写入 `localStorage`；未设置时遵循 `prefers-color-scheme`。相关 API：`useDensity`、`useMotion`、`applyTheme`、`lightTokens`、`darkTokens`。

## 反馈 API

命令式反馈，无需自行挂载宿主（需要时会自动挂载）：

```ts
import { message, toast } from '@well-design/ui'

message.success('已保存')
message.error('出错了')

toast.add({ severity: 'info', summary: '提示', detail: '详细说明' })
```

如需受控宿主，仍可渲染 `<WdMessage />` / `<WdToast />`。

## 你需要引入什么

| 引入 | 用途 |
| --- | --- |
| `@well-design/ui` | 组件（`WdButton`、`WdTable` 等）、`createWellDesign`、`WdConfigProvider`、主题与语言、`message` / `toast` |
| `@well-design/ui/styles.css` | 必需样式（token + 组件样式） |

TypeScript 类型已通过包 `exports` 提供。

## 许可证

MIT — 见仓库根目录。

---

参与本 Monorepo 开发（构建、文档站、发版）见：[UI 开发](../../docs/ui-development.zh-CN.md)。
