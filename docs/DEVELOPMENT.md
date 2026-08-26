# Development guide

[English](./DEVELOPMENT.md) · [中文](./DEVELOPMENT.zh-CN.md)

Internal documentation for contributors working in this monorepo. Public product overview: [root README](../README.md). The web app uses the local sibling dependency `../well-insight-ui`.

## Workspace

| Path       | Role                                            |
| ---------- | ----------------------------------------------- |
| `apps/web` | Platform web app (`http://localhost:5181`)      |
| `apps/api` | Hono + TypeScript API (`http://localhost:3000`) |

| `packages/shared` | Shared types |

## Local UI library

`apps/web` consumes the sibling repo `../well-insight-ui` in two ways:

1. **Package link**: `"@well-insight/ui": "link:../../../well-insight-ui"` in `package.json` (local package, not the npm registry).
2. **Source alias**: `vite.config.ts` / `tsconfig.json` map `@well-insight/ui` to `well-insight-ui/src` so component edits hot-reload without building the UI first.

Keep `well-insight-ui` as a sibling of `well-design`, then run `pnpm install` in this repo.

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

## API database

API uses Drizzle ORM + `mysql2`. Copy `apps/api/.env.example` to `apps/api/.env` and fill credentials. Do not commit `.env`.

```bash
pnpm --filter @well-insight/api db:generate
pnpm --filter @well-insight/api db:migrate
pnpm --filter @well-insight/api db:check
```

## Related docs

| Doc                                            | Topic                                     |
| ---------------------------------------------- | ----------------------------------------- |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | Conventional Commits + husky / commitlint |
