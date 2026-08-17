# @well-design/ui

Vue 3 组件库（含设计令牌与主题 API）。可在 Monorepo 内源码消费，也可构建为 ESM 包对外发布。

## 要求

- Vue `^3.5`

## 安装

```bash
pnpm add @well-design/ui vue
```

在本仓库内已通过 `workspace:` 链接，无需再装。

## 使用

```ts
import { createApp } from 'vue'
import { WdButton, WdInput, useTheme } from '@well-design/ui'
import '@well-design/ui/styles.css'

createApp({ /* ... */ }).mount('#app')
```

```ts
const { toggleTheme } = useTheme()
```

## 文档站

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182

pnpm --filter @well-design/ui build:docs
pnpm --filter @well-design/ui preview
```

组件文档写在各组件目录的 `docs/index.md`，支持 `vue preview` 代码块。

## 构建与发布

```bash
pnpm --filter @well-design/ui build
# 或根目录
pnpm build:ui
```

产物在 `dist/`：

| 文件 | 说明 |
| --- | --- |
| `dist/index.js` | ESM 入口（组件 + 主题 API） |
| `dist/index.d.ts` | 类型入口 |
| `dist/styles.css` | 组件样式（含主题 token） |

发布前检查：

1. `version` 已 bump
2. `pnpm --filter @well-design/ui build` 与 `typecheck` / `test` 通过
3. `files` 仅包含 `dist`
4. peer：`vue`

Monorepo 开发时 `exports.development` 指向源码；对外安装走 `dist`。
