# 开发指南

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

本仓库贡献者用的对内文档。对外产品说明见 [根 README（中文）](../README.zh-CN.md)。

## Workspace

| 路径 | 作用 |
| --- | --- |
| `apps/web` | 平台前端（`http://localhost:5181`） |
| `apps/api` | Hono API（`http://localhost:3000`） |
| `packages/ui` | 组件库与文档站（`http://localhost:5182`） |
| `packages/shared` | 共享类型 |

## 常用命令

```bash
pnpm install
pnpm dev
pnpm dev:web
pnpm dev:ui
pnpm dev:api
pnpm typecheck
pnpm test
pnpm build
pnpm build:ui
pnpm release
pnpm --filter @well-design/ui release
```

## 本地 API 文档

- 文档页：`http://localhost:3000/docs`
- OpenAPI：`http://localhost:3000/openapi.json`

## API 数据库

使用 Drizzle + `mysql2`。复制 `apps/api/.env.example` 为 `.env` 并填写凭据；不要提交 `.env`。

```bash
pnpm --filter @well-design/api db:generate
pnpm --filter @well-design/api db:migrate
pnpm --filter @well-design/api db:check
```

## 相关文档

| 文档 | 内容 |
| --- | --- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | 提交规范 |
| [UI 开发](./ui-development.zh-CN.md) | `@well-design/ui` 构建与发版 |
| [scripts/README.md](../scripts/README.md) | 发版脚本说明 |
