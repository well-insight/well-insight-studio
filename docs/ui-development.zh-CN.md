# UI 包开发

[English](./ui-development.md) · [中文](./ui-development.zh-CN.md)

`@well-design/ui` 维护者说明（构建、文档站、发版）。外部引用方请看 [packages/ui/README.zh-CN.md](../packages/ui/README.zh-CN.md)；Monorepo 环境见 [DEVELOPMENT.zh-CN.md](./DEVELOPMENT.zh-CN.md)。

## 构建

```bash
pnpm --filter @well-design/ui build
pnpm build:ui
```

产物在 `packages/ui/dist/`（`index.js`、`index.d.ts`、`styles.css`）。

## 文档站

```bash
pnpm --filter @well-design/ui dev
pnpm --filter @well-design/ui build:docs
```

## 仅发布到 npm

不写 CHANGELOG、不打 tag；先改好 `version`：

```bash
pnpm --filter @well-design/ui release
```

## 完整发版

在仓库根目录交互勾选 CHANGELOG、选择 bump、打 tag / 分支：

```bash
pnpm release -- --dry-run
pnpm release
```

详见 [scripts/README.md](../scripts/README.md)。

发布前检查：`version` 与 CHANGELOG 一致；`build` / `typecheck` / `test` 通过；`files` 包含 `dist` 与 `CHANGELOG.md`；peer 为 `vue`。
