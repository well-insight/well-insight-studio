# UI package development

[English](./ui-development.md) · [中文](./ui-development.zh-CN.md)

Maintainer notes for `@well-design/ui` (build, docs playground, publish). External consumers should use [packages/ui/README.md](../packages/ui/README.md). Monorepo setup: [DEVELOPMENT.md](./DEVELOPMENT.md).

## Build

```bash
pnpm --filter @well-design/ui build
# or from the repo root
pnpm build:ui
```

Output is under `packages/ui/dist/` (`index.js`, `index.d.ts`, `styles.css`).

## Docs site

```bash
pnpm --filter @well-design/ui dev          # http://localhost:5182
pnpm --filter @well-design/ui build:docs
pnpm --filter @well-design/ui preview
```

Component pages: `packages/ui/src/components/*/docs/index.md` and `index.en.md`. Changelog pages read `packages/ui/CHANGELOG.md` / `CHANGELOG.en.md`.

## Publish to npm only

Does not write CHANGELOG or create git tags. Bump `packages/ui/package.json` `version` first:

```bash
pnpm --filter @well-design/ui release
# or: cd packages/ui && pnpm release
```

Equivalent to `build` + `pnpm publish --access public --no-git-checks`.

## Full release

Interactive CHANGELOG selection, bump, tag / branch — from the repo root:

```bash
pnpm release -- --dry-run
pnpm release
```

Details: [scripts/README.md](../scripts/README.md).

Before publishing, verify:

1. `version` matches CHANGELOG
2. `build`, `typecheck`, and `test` pass for the UI package
3. `files` includes `dist` and `CHANGELOG.md`
4. peer dependency: `vue`
