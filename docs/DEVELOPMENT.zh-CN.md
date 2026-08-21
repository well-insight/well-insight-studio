# 开发指南

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

本仓库贡献者用的对内文档。对外产品说明见 [根 README（中文）](../README.zh-CN.md)。平台前端使用相邻目录 `../well-insight-ui` 中的本地组件库。

## Workspace

| 路径       | 作用                                |
| ---------- | ----------------------------------- |
| `apps/web` | 平台前端（`http://localhost:5181`） |
| `apps/api` | Hono API（`http://localhost:3000`） |

| `packages/shared` | 共享类型 |

## 常用命令

```bash
pnpm install
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm typecheck
pnpm test
pnpm build
```

## 本地 API 文档

- 文档页：`http://localhost:3000/docs`
- OpenAPI：`http://localhost:3000/openapi.json`

## API 数据库

使用 Drizzle + `mysql2`。复制 `apps/api/.env.example` 为 `.env` 并填写凭据；不要提交 `.env`。

```bash
pnpm --filter @well-insight/api db:generate
pnpm --filter @well-insight/api db:migrate
pnpm --filter @well-insight/api db:check
```

## 相关文档

| 文档                                           | 内容     |
| ---------------------------------------------- | -------- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | 提交规范 |
