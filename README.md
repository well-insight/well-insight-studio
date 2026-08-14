# Well Design

Vue 3 + TypeScript + Hono 的可复用前后端 Monorepo。

## Workspace

- `apps/web`：业务前端应用
- `apps/api`：Hono + TypeScript API 服务
- `packages/ui`：本地 Vue 组件库（可独立启动文档站）
- `packages/theme`：设计令牌与主题样式
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
pnpm build
```

## 组件库文档

组件文档写在各组件目录的 `docs/index.md` 中，支持 ` ```vue preview ` 代码块预览（`unplugin-vue-markdown` + `vite-plugin-markdown-preview`）。

```bash
pnpm --filter @well-design/ui dev
```

打开：`http://localhost:5182`

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
