# Well Design

[English](./README.md) · [中文](./README.zh-CN.md)

**Well Design** is an end-to-end platform for the full data lifecycle — from connecting sources to collecting, processing, analyzing, presenting, and visualizing data in one coherent product.

This monorepo also ships **[@well-design/ui](./packages/ui)**, a Vue 3 component library used across the platform’s interfaces.

| Resource | Link |
| --- | --- |
| Source (GitHub) | [xcGoGo2/well-design](https://github.com/xcGoGo2/well-design) |
| Source (Gitee) | [xcGoGo/well-design](https://gitee.com/xcGoGo/well-design) |
| UI library | [`packages/ui`](./packages/ui) · [UI README](./packages/ui/README.md) |
| npm | [`@well-design/ui`](https://www.npmjs.com/package/@well-design/ui) |
| Contributors | [Development guide](./docs/DEVELOPMENT.md) |

## Platform scope

| Stage | Focus |
| --- | --- |
| **Data access** | Connect and ingest from heterogeneous sources |
| **Data collection** | Gather, schedule, and organize incoming datasets |
| **Data processing** | Transform, clean, and prepare data for use |
| **Data analysis** | Explore metrics, trends, and insights |
| **Data presentation** | Product UI for browsing and operating on results |
| **Data visualization** | Charts, dashboards, and visual storytelling |

The application layer (`apps/web`, `apps/api`) implements these flows. The UI package provides the shared design system, themes, and interactive documentation.

## UI library

Install and use the component library:

```bash
pnpm add @well-design/ui vue
```

```ts
import { WdButton, useTheme } from '@well-design/ui'
import '@well-design/ui/styles.css'
```

See the **[UI README](./packages/ui/README.md)** for install, configuration, theme, and consumer APIs.

## Repository layout (overview)

| Path | Role |
| --- | --- |
| `apps/web` | Platform web application |
| `apps/api` | Platform API service |
| `packages/ui` | Vue 3 UI library + component docs site |
| `packages/shared` | Shared types across apps |
| `docs/` | Internal contributor documentation |

## Contributing

Day-to-day setup, scripts, API docs, database, commits, and releases are documented for maintainers in:

- **[Development guide](./docs/DEVELOPMENT.md)**
- [Commit convention](./docs/COMMIT_CONVENTION.md)
- [UI release scripts](./scripts/README.md)
