# Development guide

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

Internal documentation for contributors working in this monorepo. Public overview: [root README](../README.md). The web app uses [@wex-design/ui](https://www.npmjs.com/package/@wex-design/ui) from npm.

## Workspace

| Path              | Role                                       |
| ----------------- | ------------------------------------------ |
| `apps/web`        | Platform web app (`http://localhost:5181`) |
| `apps/api`        | Hono + TypeScript API (`http://localhost:3000`) |
| `packages/shared` | Shared types                               |

## UI library

Install `@wex-design/ui` via `pnpm install` in this repo (declared in `apps/web/package.json`).

- Docs: https://wex-design.github.io/wex-design-ui/
- Styles: `import '@wex-design/ui/styles.css'`
- Plugin: `createWexDesign()` from `@wex-design/ui`

## Commands

```bash
pnpm install
pnpm dev          # web + api in parallel
pnpm dev:web
pnpm dev:api
pnpm typecheck
pnpm test
pnpm build
```

## API docs (local)

- Swagger-like UI: `http://localhost:3000/docs`
- OpenAPI 3.0: `http://localhost:3000/openapi.json`

## Environment

Copy `apps/api/.env.example` to `apps/api/.env` if you need to override defaults. Do not commit `.env`.

## Related docs

| Doc                                            | Topic                                     |
| ---------------------------------------------- | ----------------------------------------- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | Conventional Commits + husky / commitlint |
