---
name: hono-backend
description: Hono + TypeScript 服务工程规范。涵盖应用组织、运行时配置、中间件、错误处理、数据库接入、文件处理、可观测性、测试与部署。适用于任何 Hono 后端服务。
---

# Hono Backend

Use this skill for the overall structure and operational concerns of a Hono service. Use `hono-api-design` for individual API contracts, `hono-auth-middleware` for authentication or authorization, and `hono-testing` for focused unit and route tests.

## Project structure

```text
src/
├── index.ts              # App composition and export
├── routes/               # Feature routers
├── middleware/           # Error, request ID, logging, CORS
├── services/             # Business logic and integrations
├── db/                   # Client, schema, repositories, migrations
├── config/               # Typed environment configuration
├── lib/                  # Shared clients and utilities
└── types/                # Shared TypeScript types
```

Keep HTTP handlers thin: parse input, call a service, return a response. Keep database and third-party access out of route modules when it is shared or non-trivial.

## App composition

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import healthRoutes from "./routes/health";
import userRoutes from "./routes/users";

export type AppBindings = { Bindings: Env; Variables: { requestId: string } };

const app = new Hono<AppBindings>();

app.use("*", requestId);
app.use("*", logger());
app.use("/api/*", cors({ origin: ["https://app.example.com"] }));

app.route("/health", healthRoutes);
app.route("/api/users", userRoutes);
app.onError(errorHandler);

export default app;
```

## Typed configuration

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export function getConfig(env: Record<string, string | undefined>) {
  return envSchema.parse(env);
}
```

- Read secrets from environment bindings or secret stores, never source files.
- Validate configuration at startup or request-entry for edge runtimes.
- Keep Node-only APIs out of code intended for Workers or Deno.

## Errors and observability

```ts
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler: ErrorHandler = (error, c) => {
  const requestId = c.get("requestId");
  if (error instanceof HTTPException) {
    return c.json(
      { error: { code: "REQUEST_ERROR", message: error.message, requestId } },
      error.status,
    );
  }

  console.error({ requestId, error });
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        requestId,
      },
    },
    500,
  );
};
```

- Log structured context such as request ID, route, status, and duration.
- Never log passwords, authorization headers, tokens, raw cookies, or full sensitive request bodies.
- Expose a lightweight health endpoint; keep readiness checks dependent on required services.

## Database and files

- Use a typed database client and parameterized queries.
- Keep migrations in source control and run them through deployment automation.
- Apply transactions for multi-step writes that must succeed or fail together.
- Validate file type and size before storage; generate server-side object keys.
- Store files in object storage for production rather than local runtime disks when deploying to serverless/edge environments.

## Testing and deployment

```ts
import { describe, expect, it } from "vitest";
import app from "../src";

describe("health", () => {
  it("returns healthy", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
  });
});
```

- Test routers with `app.request()` before adding end-to-end infrastructure.
- Pin the runtime target explicitly: Node, Cloudflare Workers, Deno, Bun, or another Fetch-compatible runtime.
- Apply CORS allowlists, rate limiting, and security headers according to the deployment boundary.
- Run health checks, migrations, and rollback planning as part of release procedures.

## Checklist

- [ ] Routes, services, middleware, and data access have clear ownership.
- [ ] Configuration is typed and secrets are externalized.
- [ ] Errors have a consistent response shape and request ID.
- [ ] Logs are structured and do not expose secrets.
- [ ] Database access is parameterized and migrations are versioned.
- [ ] Uploaded files are validated and stored safely.
- [ ] Tests cover critical route behavior; follow `hono-testing` for app.request, dependency injection, mocks, and isolation.
- [ ] Runtime, CORS, rate limiting, and health checks are configured for deployment.
