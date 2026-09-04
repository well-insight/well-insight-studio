# 开发指南

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

本仓库贡献者用的对内文档。对外说明见 [根 README（中文）](../README.zh-CN.md)。平台前端使用 npm 包 [@wex-design/ui](https://www.npmjs.com/package/@wex-design/ui)。

## Workspace

| 路径              | 作用                                |
| ----------------- | ----------------------------------- |
| `apps/web`        | 平台前端（`http://localhost:5181`） |
| `apps/api`        | Hono API（`http://localhost:3000`） |
| `packages/shared` | 共享类型                            |

## UI 组件库

在本仓库执行 `pnpm install` 即可安装 `@wex-design/ui`（见 `apps/web/package.json`）。

- 文档站：https://wex-design.github.io/wex-design-ui/
- 样式：`import '@wex-design/ui/styles.css'`
- 插件：`createWexDesign()`（来自 `@wex-design/ui`）

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

## 环境变量

如需覆盖默认值，复制 `apps/api/.env.example` 为 `.env`；不要提交 `.env`。

## 相关文档

| 文档                                           | 内容     |
| ---------------------------------------------- | -------- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | 提交规范 |
