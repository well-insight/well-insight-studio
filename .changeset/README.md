# Changesets

本仓库用 [Changesets](https://github.com/changesets/changesets) 管理 `@well-design/ui` 的版本与更新日志。

## 日常改动

在影响对外 API / 行为 / 样式契约的改动后执行：

```bash
pnpm changeset
```

按提示选择 `patch` / `minor` / `major`，并写清用户可见的变更说明。会在 `.changeset/` 生成一条 markdown 记录。

## 发版

```bash
# 1. 汇总 changeset → bump package.json + 写入 CHANGELOG.md
pnpm version-packages

# 2. 构建并发布到 npm（仅非 private 包）
pnpm release
```

首次发布 `0.1.0`（版本号已在 package.json，且 CHANGELOG 已有初版条目）可直接：

```bash
pnpm build:ui
pnpm --filter @well-design/ui publish --access public
```

之后请走 `changeset` → `version-packages` → `release` 流程，保证「更新日志」页与 npm 版本同步。

`changeset status` 的对比基线分支为 `master`（见 `.changeset/config.json` 的 `baseBranch`）。
