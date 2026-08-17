# @well-design/theme

Well Design 设计令牌、亮暗主题与动效 / 密度偏好。

## 要求

- Vue `^3.5`（peer）

## 安装

```bash
pnpm add @well-design/theme vue
```

通常与 `@well-design/ui` 一起安装。UI 的 `styles.css` 已内联主题变量；若只使用 token / 主题 API，可单独引入样式：

```ts
import '@well-design/theme/styles.css'
import { useTheme, useMotion, useDensity } from '@well-design/theme'
```

## API 示例

```ts
import { useTheme } from '@well-design/theme'

const { isDark, setTheme, toggleTheme } = useTheme()
setTheme('dark')
```

## 构建

```bash
pnpm --filter @well-design/theme build
```

产物：`dist/index.js`、`dist/index.d.ts`、`dist/styles.css`。
