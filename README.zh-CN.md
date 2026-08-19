# Well Design

[English](./README.md) · [中文](./README.zh-CN.md)

**Well Design** 定位为覆盖数据全生命周期的平台：数据接入、数据集合、数据处理、数据分析、数据展示与数据可视化，在同一产品体系中贯通。

本 Monorepo 同时包含平台所用的 Vue 3 组件库 **[@well-design/ui](./packages/ui)**。

| 资源 | 链接 |
| --- | --- |
| 源码（GitHub） | [xcGoGo2/well-design](https://github.com/xcGoGo2/well-design) |
| 源码（Gitee） | [xcGoGo/well-design](https://gitee.com/xcGoGo/well-design) |
| UI 组件库 | [`packages/ui`](./packages/ui) · [UI README（中文）](./packages/ui/README.zh-CN.md) · [English](./packages/ui/README.md) |
| npm | [`@well-design/ui`](https://www.npmjs.com/package/@well-design/ui) |
| 贡献者文档 | [开发指南](./docs/DEVELOPMENT.zh-CN.md) · [English](./docs/DEVELOPMENT.md) |

## 平台能力

| 阶段 | 说明 |
| --- | --- |
| **数据接入** | 对接多元数据源并完成接入 |
| **数据集合** | 采集、调度与组织数据集 |
| **数据处理** | 清洗、转换与加工 |
| **数据分析** | 指标、趋势与洞察 |
| **数据展示** | 面向业务的结果浏览与操作界面 |
| **数据可视化** | 图表、看板与可视化表达 |

应用层（`apps/web`、`apps/api`）承载上述流程；UI 包提供统一设计系统、主题与组件文档站。

## UI 组件库

```bash
pnpm add @well-design/ui vue
```

```ts
import { WdButton, useTheme } from '@well-design/ui'
import '@well-design/ui/styles.css'
```

安装、全局配置、主题与对外 API 见 **[UI README（中文）](./packages/ui/README.zh-CN.md)**。

## 仓库结构（概览）

| 路径 | 作用 |
| --- | --- |
| `apps/web` | 平台前端 |
| `apps/api` | 平台 API |
| `packages/ui` | Vue 3 组件库与文档站 |
| `packages/shared` | 前后端共享类型 |
| `docs/` | 对内开发文档 |

## 参与开发

本地命令、API / 数据库、提交与发版等维护者文档见：

- **[开发指南](./docs/DEVELOPMENT.zh-CN.md)**
- [提交规范](./docs/COMMIT_CONVENTION.md)
- [UI 发版脚本](./scripts/README.md)
