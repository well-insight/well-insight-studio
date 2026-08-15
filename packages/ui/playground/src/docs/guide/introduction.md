---
title: 介绍
order: 1
description: Well Design 是什么、适合谁用、与 PrimeVue 的关系。
---

# 介绍

**Well Design**（`@well-design/ui`）是一套面向 Vue 3 的本地组件库，配合 `@well-design/theme` 提供设计令牌、亮暗主题与动效偏好。

## 设计目标

- **可独立复用**：业务应用通过包入口引入组件与样式，不依赖文档站运行时。
- **API 对齐**：命名与交互尽量贴近 PrimeVue，降低迁移与记忆成本。
- **主题一体**：颜色、圆角、间距、动效走 `--wd-*` CSS 变量，组件不硬编码品牌色。
- **文档即预览**：每个组件目录下的 `docs/index.md` 支持 Markdown + 可交互 `vue preview`。

## 包结构

| 包 | 说明 |
| --- | --- |
| `@well-design/ui` | 组件、样式、文档站 |
| `@well-design/theme` | 主题 token、`useTheme` / `useMotion` |

## 下一步

- [快速上手](/docs/quick-start)：安装与最小示例
- [指南](/docs/guide)：目录约定与文档写法
- [主题](/docs/theme)：亮暗色与动效
- [全局配置](/docs/config)：`ConfigProvider` / `createWellDesign`
- [组件](/components)：浏览全部组件与 API
