# @well-design/ui

Vue 3 组件库。可在 Monorepo 内源码消费，也可构建为 ESM 包对外发布。

## 要求

- Vue `^3.5`
- 同时安装 `@well-design/theme`（主题 JS API：`useTheme` / `useMotion` / `useDensity`）

## 安装

```bash
pnpm add @well-design/ui @well-design/theme vue
```

在本仓库内已通过 `workspace:` 链接，无需再装。

## 使用

```ts
import { createApp } from 'vue'
import { WdButton, WdInput } from '@well-design/ui'
import '@well-design/ui/styles.css' // 已内联主题 CSS 变量

createApp({ /* ... */ }).mount('#app')
```

主题切换等能力从 theme 包引入：

```ts
import { useTheme } from '@well-design/theme'
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
# 先 theme 后 ui（根目录也可用 pnpm build:ui）
pnpm --filter @well-design/theme build
pnpm --filter @well-design/ui build
```

产物在 `dist/`：

| 文件 | 说明 |
| --- | --- |
| `dist/index.js` | ESM 入口 |
| `dist/index.d.ts` | 类型入口 |
| `dist/styles.css` | 组件样式（含主题 token） |

发布前检查：

1. `version` 已 bump
2. `pnpm --filter @well-design/ui build` 与 `typecheck` / `test` 通过
3. `files` 仅包含 `dist`（README / LICENSE 由 npm 自动附带）
4. peer：`vue`；依赖：`@well-design/theme`

Monorepo 开发时 `exports.development` 指向源码；对外安装走 `dist`。
