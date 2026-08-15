---
title: 主题
order: 4
description: 亮暗主题、设计令牌与动效偏好。
---

# 主题

主题能力由 `@well-design/theme` 提供。组件只消费语义化 CSS 变量（`--wd-*`），不自行维护第二套色板。

## 亮 / 暗色

```ts
import { useTheme } from '@well-design/theme'

const { isDark, setTheme, toggleTheme } = useTheme()

setTheme('light') // 或 'dark'
toggleTheme()
```

文档站右上角的按钮调用的就是同一套 API。主题偏好会写到 `document.documentElement` 的 `data-theme`。

## 设计令牌

常用变量示例：

| Token | 用途 |
| --- | --- |
| `--wd-color-primary` | 品牌主色 |
| `--wd-color-surface` | 页面底色 |
| `--wd-color-text` | 正文 |
| `--wd-color-border` | 分割线 / 描边 |
| `--wd-radius-sm/md/lg` | 圆角阶梯 |
| `--wd-space-*` | 间距阶梯 |
| `--wd-motion-fast/normal` | 过渡时长 |

在组件页左侧「外观设置」可临时改主色、圆角与密度，用于本地预览，不会写进包默认值。

## 动效偏好

```ts
import { useMotion } from '@well-design/theme'

const { preference, setMotion } = useMotion()
setMotion('full') // 'full' | 'reduced' | 'none'
```

- `full`：标准过渡与浮层动画  
- `reduced`：缩短时长、弱化位移  
- `none`：立即切换  

## 与 ConfigProvider

主题切换是「视觉层」；`WdConfigProvider` / `createWellDesign` 负责尺寸、文案、浮层挂载等「行为默认值」。二者可同时使用，详见 [全局配置](/docs/config)。
