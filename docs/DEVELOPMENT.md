# Development guide

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

Internal documentation for contributors working in this monorepo. Public product overview: [root README](../README.md).

## Workspace

| Path | Role |
| --- | --- |
| `apps/web` | Platform web app (`http://localhost:5181`) |
| `apps/api` | Hono + TypeScript API (`http://localhost:3000`) |
| `packages/ui` | Vue UI library + docs site (`http://localhost:5182`) |
| `packages/shared` | Shared types |

## Commands

```bash
pnpm install
pnpm dev          # web + api + ui docs in parallel
pnpm dev:web
pnpm dev:ui
pnpm dev:api
pnpm typecheck
pnpm test
pnpm build        # build ui first, then other packages
pnpm build:ui
pnpm release      # full UI release (CHANGELOG, bump, publish, tag)
pnpm --filter @well-design/ui release  # build + npm publish only (set version first)
```

## API docs (local)

- Swagger-like UI: `http://localhost:3000/docs`
- OpenAPI 3.0: `http://localhost:3000/openapi.json`

## API database

API uses Drizzle ORM + `mysql2`. Copy `apps/api/.env.example` to `apps/api/.env` and fill credentials. Do not commit `.env`.

```bash
pnpm --filter @well-design/api db:generate
pnpm --filter @well-design/api db:migrate
pnpm --filter @well-design/api db:check
```

## Related docs

| Doc | Topic |
| --- | --- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | Conventional Commits + husky / commitlint |
| [UI development](./ui-development.md) | Build, publish, changelog for `@well-design/ui` |
| [scripts/README.md](../scripts/README.md) | Interactive UI release tooling |
