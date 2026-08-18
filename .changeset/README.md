# Changesets

本仓库用 [Changesets](https://github.com/changesets/changesets) 管理 `@well-design/ui` 的版本与更新日志。

## 日常改动

在影响对外 API / 行为 / 样式契约的改动后执行：

```bash
pnpm changeset
```

按提示选择 `patch` / `minor` / `major`，并写清用户可见的变更说明。会在 `.changeset/` 生成一条 markdown 记录。

## 发版

日常先记变更：

```bash
pnpm changeset
```

然后一条命令完成 UI 发版（bump CHANGELOG → `release/{version}` 分支 → 提交 → 构建 → npm publish → `v{version}` 标签 → 推送）：

```bash
pnpm release
```

只要本地打 tag / 建分支、不推远程：

```bash
pnpm release -- --no-push
```

`changeset publish` 仍会打 `@well-design/ui@X.Y.Z`；另外还有友好标签 `vX.Y.Z` 和分支 `release/X.Y.Z`（标签与分支不能同名）。

只补 git 引用、不重新 publish：

```bash
pnpm release:git
node scripts/release-git.mjs --tag --branch --push
```

没有待处理 changeset 时，`pnpm release` 会发布当前 `packages/ui` 版本（适合首次 `0.1.0`）。

`changeset status` 的对比基线分支为 `master`（见 `.changeset/config.json` 的 `baseBranch`）。
