---
name: hono-testing
description: Hono + TypeScript 服务的单元与路由测试规范。用于为 Hono 路由、中间件、服务层、认证、输入校验、错误处理、数据库边界或文件处理补充、修复、重构测试，也用于配置 Vitest 测试环境。涵盖 app.request、依赖注入、Fetch 语义、mock、错误响应、鉴权、并发与测试隔离。
---

# Hono Testing

为 Hono + TypeScript 服务建立快速、隔离、面向 HTTP 契约的测试。默认使用现有测试工具；新项目优先使用 Vitest 和 Hono 原生 `app.request()`。先测试路由与服务边界，只有需要验证真实基础设施协议时才增加集成测试。

## 流程

1. 阅读运行时目标、app 组合入口、路由、中间件、服务接口、测试配置和同类测试；不检查 `node_modules`、缓存或 vendor。
2. 列出被测契约：请求方法/路径、认证上下文、输入、状态码、响应头、响应体、服务副作用和失败条件。
3. 将 app 组合与运行入口分离，使测试能导入一个不监听端口的 Hono 实例。
4. 用 `app.request()` 测试 Fetch 行为；以替换服务或 repository 的方式隔离数据库、网络、队列、时钟和对象存储。
5. 先运行目标测试，再运行类型检查、全量测试与覆盖率命令；不要为通过测试降低授权、校验或错误处理要求。

## 可测试的应用组合

导出 app 工厂或可注入依赖的 app，而不是在模块加载时直接连接数据库或启动服务器：

```ts
import { Hono } from 'hono'

export interface AppDependencies {
  users: UserService
}

export function createApp(deps: AppDependencies) {
  const app = new Hono()
  app.route('/users', createUserRoutes(deps.users))
  return app
}
```

运行入口负责读取真实环境和启动 runtime；测试负责构造内存 fake 或类型安全 mock。这样可避免 import 时连接数据库、泄漏环境变量或产生跨测试状态。

## 路由测试

用真实的 `Request`、`Response` 与 JSON body 验证 HTTP 契约：

```ts
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp({
  users: {
    async getById(id) {
      return id === 'u_1' ? { id, name: 'Ada' } : null
    },
  },
})

describe('GET /users/:id', () => {
  it('returns a user', async () => {
    const response = await app.request('/users/u_1')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'u_1', name: 'Ada' })
  })
})
```

每个公开路由至少覆盖（按实际适用）：

- 成功响应的状态码、内容类型、稳定响应体和必要 headers。
- 缺失、格式错误、越界或不允许的输入，且不得调用业务服务。
- 未认证、认证失效、权限不足、资源不存在和资源归属错误。
- 领域冲突（如重复创建）、可预期业务错误和未处理异常的统一错误格式。
- 分页、过滤、排序、上传限制、幂等性或条件请求等实际契约。

不要只断言 `200`；也不要对完整动态对象做脆弱快照。对响应 body 断言稳定字段，对 request ID、日期等动态字段使用格式或存在性断言。

## 服务层单元测试

服务层测试业务规则和副作用，不通过 HTTP 路由间接测试全部逻辑。

- 将 repository、外部 API、存储、队列和 clock 定义成接口或窄依赖，在测试中替换为 fake/mock。
- 对每个分支验证返回值、领域错误和必要调用；避免断言无关的内部调用顺序。
- 对多步写入测试事务边界、失败回滚或补偿逻辑；用 fake 明确模拟中途失败。
- 使用固定时钟、固定 ID 和确定性数据，避免真实时间和随机性使测试不稳定。

## 中间件与错误处理

- 单独测试认证、授权、CORS、请求 ID、速率限制和错误处理等有明确可观察输出的中间件。
- 认证测试覆盖缺失/非法凭据、有效凭据、过期凭据和权限不足；不要在日志或断言输出真实 token。
- 验证错误响应不会泄露堆栈、SQL、密钥、Authorization、Cookie 或内部服务信息。
- 错误处理应保持统一响应形状和正确 Content-Type；500 只暴露安全、通用信息。
- 请求上下文变量应在每次 `app.request()` 中重新创建，避免把用户/租户状态存到模块级变量。

## 数据库与外部系统边界

- 单元测试默认不连接真实数据库、Redis、对象存储、邮件、支付或第三方 HTTP 服务。
- repository 层可使用测试数据库进行少量集成测试，但每个测试应通过 transaction、schema reset 或独立数据命名实现隔离。
- 外部 HTTP 使用 mock server 或 fetch mock 验证请求契约；不要调用真实生产服务。
- 文件上传测试使用内存 `FormData` 和 `File`，覆盖类型、大小、空文件和服务失败；不写入真实用户目录。

## 运行时兼容性

Hono 以 Fetch API 为核心。测试时使用目标运行时支持的 Web API，不假定 Node 专有对象在 Workers、Deno 或 Bun 可用。

- 若部署到 Workers/Deno/Bun，增加针对目标运行时或官方模拟环境的最小集成测试。
- Node-only adapter、环境绑定和 crypto 行为应在运行时边界测试，而不是污染所有路由单测。
- 测试并发请求时确保依赖没有共享可变状态；用 `Promise.all` 验证租户、认证和请求 ID 不会串扰（适用时）。

## Mock 与稳定性

- 只 mock 系统边界，保留校验、授权和业务规则的真实实现。
- 每个测试创建独立 app 与依赖 fake，完成后恢复 spy、timer、环境修改和 mock。
- 不监听随机端口、不依赖执行顺序、不使用真实网络或生产凭据。
- 对生成式 ID、时钟和随机数注入确定性实现，或断言格式而非具体值。

## 覆盖率与完成检查

覆盖率用于定位未验证的风险分支。优先覆盖认证、权限、输入校验、领域规则、错误映射、事务和数据隔离，而不是机械追逐百分比。

- [ ] app 可在不启动网络监听器的情况下导入和构造。
- [ ] 路由覆盖成功、输入错误、认证/授权和关键失败响应。
- [ ] 服务覆盖核心领域规则及失败副作用。
- [ ] 中间件和错误响应不泄露敏感信息。
- [ ] 数据库与外部系统均隔离，或明确标注为集成测试并完成清理。
- [ ] 动态时间、ID、环境和 mock 已复位，测试可重复运行。
- [ ] 相关 Vitest 测试、类型检查、完整测试或覆盖率命令已运行，或说明无法运行的原因。
