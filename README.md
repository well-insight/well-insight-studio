# Well Design

[English](./README.md) · [中文](./README.zh-CN.md)

**Well Design** is an end-to-end platform for the full data lifecycle — from connecting sources to collecting, processing, analyzing, presenting, and visualizing data in one coherent product.

The web application uses the locally checked-out **[@well-insight/ui](../well-insight-ui)** Vue 3 component library.

| Resource        | Link                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| Source (GitHub) | [xcGoGo2/well-design](https://github.com/xcGoGo2/well-design)                         |
| Source (Gitee)  | [xcGoGo/well-design](https://gitee.com/xcGoGo/well-design)                            |
| UI library      | [`../well-insight-ui`](../well-insight-ui) · [`@well-insight/ui`](../well-insight-ui) |
| Contributors    | [Development guide](./docs/DEVELOPMENT.md)                                            |

## Platform scope

| Stage                  | Focus                                            |
| ---------------------- | ------------------------------------------------ |
| **Data access**        | Connect and ingest from heterogeneous sources    |
| **Data collection**    | Gather, schedule, and organize incoming datasets |
| **Data processing**    | Transform, clean, and prepare data for use       |
| **Data analysis**      | Explore metrics, trends, and insights            |
| **Data presentation**  | Product UI for browsing and operating on results |
| **Data visualization** | Charts, dashboards, and visual storytelling      |

The application layer (`apps/web`, `apps/api`) implements these flows. The web app consumes the shared design system from the sibling local repository `../well-insight-ui`.

## Repository layout (overview)

| Path       | Role                     |
| ---------- | ------------------------ |
| `apps/web` | Platform web application |
| `apps/api` | Platform API service     |

| `packages/shared` | Shared types across apps |
| `docs/` | Internal contributor documentation |

## Contributing

Day-to-day setup, scripts, API docs, database, commits, and releases are documented for maintainers in:

- **[Development guide](./docs/DEVELOPMENT.md)**
- [Commit convention](./docs/COMMIT_CONVENTION.md)
