# Well Design

Vue 3 + TypeScript + Hono 的可复用前后端 Monorepo。组件库 `@well-design/ui`（含主题）可对内源码消费，也可构建为可发布的 ESM 包。

## Workspace

- `apps/web`：业务前端应用
- `apps/api`：Hono + TypeScript API 服务
- `packages/ui`：Vue 组件库（组件、主题、文档站 + 可发布构建）
- `packages/shared`：前后端共享类型

## Commands

```bash
pnpm install
pnpm dev          # web + api + ui 文档站
pnpm dev:web      # 仅业务前端 http://localhost:5181
pnpm dev:ui       # 仅组件库文档站 http://localhost:5182
pnpm dev:api      # 仅 API
pnpm typecheck
pnpm test
pnpm build        # 先构建 ui，再构建其余包
pnpm build:ui     # 仅构建 ui
pnpm release                          # UI 完整发版：CHANGELOG、bump、publish、打 tag
pnpm --filter @well-design/ui release # 仅 build + npm publish（需先改好 version）
```

提交规范见 [`docs/COMMIT_CONVENTION.md`](docs/COMMIT_CONVENTION.md)。发版细节见 [`scripts/README.md`](scripts/README.md)。

## 组件库（对外）

```bash
pnpm add @well-design/ui vue
```

```ts
import { WdButton, useTheme } from '@well-design/ui'
import '@well-design/ui/styles.css'
```

本地文档站与静态构建：

```bash
pnpm --filter @well-design/ui dev          # http://localhost:5182
pnpm --filter @well-design/ui build:docs
```

组件文档写在各组件目录的 `docs/index.md`（中文）与 `docs/index.en.md`（英文），支持 `vue preview` 代码块。更多说明见 [`packages/ui/README.md`](packages/ui/README.md)。发版说明见 [`scripts/README.md`](scripts/README.md)；文档站「更新日志」对应 `packages/ui/CHANGELOG.md` / `CHANGELOG.en.md`。

## API documentation

开发环境可打开以下页面查看 Swagger-like API 文档：

```text
http://localhost:3000/docs
```

机器可读的 OpenAPI 3.0 文档：

```text
http://localhost:3000/openapi.json
```

## API database

API 使用 Drizzle ORM + `mysql2` 连接 MySQL。复制 `apps/api/.env.example` 为 `apps/api/.env`，填写数据库凭据；不要把 `.env` 提交到 Git。

```bash
pnpm --filter @well-design/api db:generate
pnpm --filter @well-design/api db:migrate
pnpm --filter @well-design/api db:check
```
