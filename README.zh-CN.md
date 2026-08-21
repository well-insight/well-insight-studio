# Well Insight Studio

[English](./README.md) · [中文](./README.zh-CN.md)

**Well Insight Studio** 定位为覆盖数据全生命周期的平台：数据接入、数据集合、数据处理、数据分析、数据展示与数据可视化，在同一产品体系中贯通。

平台前端使用位于相邻目录 `../well-insight-ui` 的 Vue 3 组件库 **[@well-insight/ui](../well-insight-ui)**。

| 资源           | 链接                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- |
| 源码（GitHub） | [well-insight/well-insight-studio](https://github.com/well-insight/well-insight-studio) |
| UI 组件库      | [`../well-insight-ui`](../well-insight-ui) · [`@well-insight/ui`](../well-insight-ui)   |
| 贡献者文档     | [开发指南](./docs/DEVELOPMENT.zh-CN.md) · [English](./docs/DEVELOPMENT.md)              |

## 平台能力

| 阶段           | 说明                         |
| -------------- | ---------------------------- |
| **数据接入**   | 对接多元数据源并完成接入     |
| **数据集合**   | 采集、调度与组织数据集       |
| **数据处理**   | 清洗、转换与加工             |
| **数据分析**   | 指标、趋势与洞察             |
| **数据展示**   | 面向业务的结果浏览与操作界面 |
| **数据可视化** | 图表、看板与可视化表达       |

应用层（`apps/web`、`apps/api`）承载上述流程；平台前端通过相邻的 `../well-insight-ui` 仓库使用统一设计系统。

## 仓库结构（概览）

| 路径       | 作用     |
| ---------- | -------- |
| `apps/web` | 平台前端 |
| `apps/api` | 平台 API |

| `packages/shared` | 前后端共享类型 |
| `docs/` | 对内开发文档 |

## 参与开发

本地命令、API / 数据库、提交与发版等维护者文档见：

- **[开发指南](./docs/DEVELOPMENT.zh-CN.md)**
- [提交规范](./docs/COMMIT_CONVENTION.md)
