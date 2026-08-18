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

## 中英文

组件内置文案默认中文。切换英文时传入 `enUS`，也可通过 `WdConfigProvider` 覆盖：

```ts
import { createApp } from 'vue'
import { createWellDesign, enUS } from '@well-design/ui'
import '@well-design/ui/styles.css'

createApp(App).use(createWellDesign({ locale: enUS })).mount('#app')
```

文档站右上角「中 / EN」会同步切换站点界面、组件内置文案，以及指南 / 组件 Markdown 正文（`docs/index.en.md`）。

## 文档站

```bash
pnpm --filter @well-design/ui dev
# http://localhost:5182

pnpm --filter @well-design/ui build:docs
pnpm --filter @well-design/ui preview
```

组件文档写在各组件目录的 `docs/index.md`（中文）与 `docs/index.en.md`（英文），支持 `vue preview` 代码块。

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

### 发版

按 [提交规范](../../docs/COMMIT_CONVENTION.md) 提交。发版时会列出上一个 `v*` 以来的全部提交，**交互勾选**写入 CHANGELOG 的条目，并**由你选择** `patch` / `minor` / `major`（不会按 commit type 自动升版）。

```bash
pnpm release -- --dry-run
pnpm release
```

详见 [`scripts/README.md`](../../scripts/README.md)。

文档站「更新日志」页读取 `packages/ui/CHANGELOG.md`，与发版记录同步。Git 上每次发版会有 `v{version}` 标签和 `release/{version}` 分支。

发布前检查：

1. `version` 与 CHANGELOG 一致
2. `pnpm --filter @well-design/ui build` 与 `typecheck` / `test` 通过
3. `files` 包含 `dist` 与 `CHANGELOG.md`
4. peer：`vue`

Monorepo 开发时 `exports.development` 指向源码；对外安装走 `dist`。
