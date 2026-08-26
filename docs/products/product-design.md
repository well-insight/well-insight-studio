# 产品需求文档 (PRD) —— Well-Insight Studio

## 1. 产品概述
Well Insight Studio 是一款面向数据团队的低代码可视化分析平台。用户通过拖拽数据字段、配置字段操作（过滤、聚合、排序、别名）即可实时生成多样化的可视化组件（指标卡、柱状图、折线图、饼图、表格），并自由编排布局。产品强调“数据驱动视图”，所见即所得。

## 2. 目标用户
- 数据分析师：快速探索数据，无需编码生成看板。
- 业务决策者：通过直观图表监控核心 KPI。
- 开发者：作为数据中台的可视化嵌入组件。

## 3. 核心用户故事
1. **连接数据**：选择已有的数据源（表），查看字段列表。
2. **拖拽生成**：将字段拖拽到画布，系统自动识别数据类型并生成合适的图表。
3. **精细配置**：在配置弹窗中勾选多个字段，批量设置别名、聚合、排序、过滤条件，并实时预览效果。
4. **自由布局**：拖拽移动组件位置，拖拽右下角调整大小，图层管理调整堆叠顺序。
5. **属性微调**：在右侧属性面板修改标题、数据源、图表类型、主题色及精确坐标尺寸。

## 4. 功能需求列表

### 4.1 数据源管理
- 支持多数据表（如 orders, customers, products），左侧展示表名和字段列表。
- 每个字段显示数据类型（数值/字符串），支持拖拽至画布。

### 4.2 画布工作区
- 顶部工具栏提供“指标卡、柱状图、折线图、饼图、表格”快速添加按钮。
- 组件支持自由拖拽移动（x, y）、右下角拖拽缩放（width, height）。
- 组件选中状态高亮，右侧属性面板同步。
- 图层管理（右侧面板）：展示所有组件列表，支持上移/下移调整 z-index，支持显示/隐藏、锁定/解锁。

### 4.3 高级配置弹窗（核心功能）
- **字段多选**：左侧字段列表支持复选框，可全选/取消。
- **批量操作**（当选中多个字段时，操作面板切换为批量模式）：
  - 批量别名：统一设置显示名称。
  - 批量聚合（仅对数值字段）：支持 sum, avg, count, min, max。
  - 批量排序：asc / desc。
  - 批量过滤：支持表达式（如 `> 1000`，`= "Electronics"`）。
  - 批量可见性：显示/隐藏字段。
- **实时预览**：右侧预览区根据当前配置（字段及操作）立即渲染图表/表格/KPI，辅助验证。

### 4.4 属性面板（右侧）
- 组件标题、数据源切换、图表类型切换。
- 主题色选择（预设调色板）。
- 精确输入 X / Y / Width / Height 数值。

### 4.5 非功能需求
- 画布操作流畅（60fps），预览响应 < 500ms。
- 支持扩展自定义图表类型。
- 数据源连接信息加密存储。
- 画布配置自动保存（防抖 1s），刷新后可恢复。

## 5. 范围边界（MVP 不做什么）
- 不做多用户实时协同编辑。
- 不做数据集之间的 JOIN / 关联分析（单表查询优先）。
- 不做行级权限、数据脱敏。
- 不做移动端适配（桌面优先，最小宽度 1280px）。
- 导出仅支持 JSON / PNG，不做 PDF 报表调度。

## 6. 原型参考
交互原型见 [`demo.html`](./demo.html)（纯 HTML 单文件，可直接在浏览器打开）。原型已验证：字段拖拽生成组件、三栏配置弹窗（多选 + 批量操作 + 实时预览）、图层管理、撤销/重做、本地持久化与 JSON 导入导出。实现时应以原型的交互行为为准。

---

# 前端技术设计文档 (Vue 3)

> 实现位置：monorepo 中的 `apps/web`（`@well-insight/web`，Vite 端口 5181）。共享类型放在 `packages/shared`（`@well-insight/shared`），前后端共同引用。

## 1. 技术选型
- **框架**：Vue 3 (Composition API) + TypeScript（strict）
- **状态管理**：Pinia
- **路由**：Vue Router（已就位，当前仅 `/` 一个占位页）
- **UI 组件库**：`@well-insight/ui`（本地 sibling 仓库 `../well-insight-ui`，提供 Button、Table、Modal、Select、Checkbox、Tabs 等基础组件）
- **图表渲染**：ECharts（封装为 `apps/web` 内的 `WiChart` 包装组件，后续可下沉到 UI 库）
- **拖拽交互**：原生鼠标事件封装 `useDrag` / `useResize` composable（与原型一致）；字段拖入画布使用 HTML5 Drag & Drop API
- **HTTP 客户端**：原生 `fetch` 封装（Hono 返回标准 Fetch Response，无需 axios）

## 2. 目录结构（目标）

```text
apps/web/src/
├── main.ts                  # 已存在
├── App.vue                  # 已存在（RouterView）
├── router/index.ts          # 已存在，新增 /studio 路由
├── api/                     # HTTP 客户端与接口封装
│   ├── client.ts            # fetch 封装（baseURL、错误处理）
│   ├── datasource.ts
│   └── project.ts
├── stores/
│   ├── dataStore.ts         # 数据源 schema + 查询结果缓存
│   ├── widgetStore.ts       # 画布组件数组 + 全部变更动作 + 撤销/重做
│   └── configStore.ts       # 选中组件、配置弹窗临时状态
├── composables/
│   ├── useDrag.ts           # 组件移动
│   ├── useResize.ts         # 右下角缩放
│   └── useHistory.ts        # 撤销/重做快照栈
├── modules/
│   └── studio/              # 可视化画布模块（本 PRD 核心）
│       ├── StudioView.vue   # 页面骨架：三栏布局
│       ├── components/
│       │   ├── DataPanel.vue        # 左侧数据源树
│       │   ├── CanvasToolbar.vue    # 顶部工具栏
│       │   ├── CanvasContainer.vue  # 画布（drop 接收、缩放）
│       │   ├── WidgetRenderer.vue   # 按类型分发渲染
│       │   ├── widgets/             # KpiWidget / BarWidget / LineWidget / PieWidget / TableWidget
│       │   ├── PropsPanel.vue       # 右侧属性面板
│       │   ├── LayersPanel.vue      # 右侧图层面板
│       │   └── config/              # 配置弹窗
│       │       ├── ConfigModal.vue
│       │       ├── FieldSelector.vue
│       │       ├── OperationPanel.vue
│       │       └── PreviewPanel.vue
│       └── utils/
│           ├── fieldOps.ts  # fieldOps → 数据处理（过滤/聚合/排序），纯函数，可单测
│           └── chart.ts     # 数据 → ECharts option
└── views/HomeView.vue       # 已存在
```

## 3. 核心模块划分

### 3.1 数据层 (Store)
- **dataStore**：管理数据源（表结构、行数据），提供 `fetchTableSchema(tableName)` 和 `fetchTableData(tableName, fieldOps)` 方法（实际调用后端 API）。
- **widgetStore**：管理 `widgets` 数组，提供添加、删除、更新、移动、调整尺寸、切换可见性/锁定、调整层级等方法；内置历史栈支持撤销/重做；变更后防抖自动保存到后端。
- **configStore**：管理当前选中的组件 ID，以及配置弹窗的临时状态（`configFieldOps`、`configSelectedFields`）。

### 3.2 画布引擎
- **CanvasContainer.vue**：主容器，监听拖放事件（drop 字段生成组件），负责缩放变换。
- **WidgetRenderer.vue**：遍历 `widgets`，根据类型渲染对应的 `KpiWidget`, `BarWidget`, `TableWidget` 等子组件。
- **useDrag / useResize**：封装鼠标事件处理移动和缩放，支持 8px 网格吸附。

### 3.3 配置弹窗 (ConfigModal)
- **FieldSelector.vue**：左侧字段列表，支持 Checkbox 多选。
- **OperationPanel.vue**：根据选中字段数量自动切换为“批量模式”或“单字段模式”，提供别名、聚合、排序、过滤、可见性控件。
- **PreviewPanel.vue**：复用 `WidgetRenderer` 逻辑，但使用临时数据快照（不修改 store 中的正式数据），实时响应操作变化。

### 3.4 属性面板 (PropsPanel)
- 显示当前选中组件的基本属性，绑定 `v-model` 或 `@change` 直接更新 `widgetStore`。

## 4. 关键数据模型 (TypeScript)

以下类型定义在 `packages/shared/src/index.ts`，前后端共用：

```typescript
// 字段操作配置
export interface FieldOperation {
  alias: string;
  agg: 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max';
  sort: 'none' | 'asc' | 'desc';
  filter: string;
  hidden: boolean;
}

export type WidgetType = 'kpi' | 'bar' | 'line' | 'pie' | 'table';

// 组件/小部件
export interface Widget {
  id: string;                // 使用 UUID（与数据库主键一致），不再用自增 number
  type: WidgetType;
  title: string;
  dataSource: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
  locked: boolean;
  config: {
    fieldOps: Record<string, FieldOperation>;
    visibleFields: string[];
  };
}

// 项目画布配置（projects.config JSON 的顶层结构）
export interface ProjectConfig {
  version: 1;
  widgets: Widget[];
  canvas: { zoom: number };
}
```

## 5. @well-insight/ui 组件使用计划
- `WiTable`：用于左侧数据树、配置弹窗字段列表、预览表格。
- `WiModal`：高级配置弹窗。
- `WiButton`、`WiSelect`、`WiCheckbox`、`WiTabs`、`WiInput`、`WiColorPicker`（如有）等。
- 图表组件在 `apps/web` 内封装 ECharts（`modules/studio/utils/chart.ts`），稳定后再评估是否下沉到 UI 库。

## 6. 与后端交互
- `api/client.ts` 基于原生 `fetch` 封装：`baseURL = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:3000'`，统一错误处理。
- 主要接口：
  - `GET /api/datasources/:id/schema` → 获取表字段信息。
  - `POST /api/datasources/:id/query` → 传递 `{ table, fieldOps }`，返回处理后的数据。
  - `GET /api/projects/:id` → 加载项目配置。
  - `PUT /api/projects/:id` → 保存项目配置（前端防抖 1s 自动保存）。

---

# 后端技术设计文档 (Hono + MySQL)

> 实现位置：monorepo 中的 `apps/api`（`@well-insight/api`，端口 3000）。现有骨架：Hono 应用工厂（`src/app.ts`）、CORS / requestId / 统一错误处理中间件、OpenAPI 文档路由（`/docs`、`/openapi.json`）、Drizzle + mysql2 客户端与迁移脚手架（当前仅 `users` 表）、Vitest 测试。本章在其上扩展业务模块。

## 1. 技术选型
- **运行时**：Node.js 20+，Hono 4（`@hono/node-server`）
- **ORM**：Drizzle ORM（`drizzle-orm` + `mysql2` 连接池，`drizzle-kit` 管理迁移）
- **数据库**：MySQL 8.0
- **校验**：zod（`@hono/zod-validator` 校验请求体/参数）
- **缓存**：进程内 LRU（`lru-cache`，MVP）；Redis 作为后续可替换实现
- **认证**：JWT（`hono/jwt` 中间件）
- **测试**：Vitest（`app.request` 路由级测试，参考项目内 `hono-testing` 规范）
- **部署**：Docker + PM2

## 2. 目录结构（目标）

```text
apps/api/src/
├── server.ts                # 已存在：入口
├── app.ts                   # 已存在：应用工厂，挂载路由
├── config/env.ts            # 已存在：zod 环境变量
├── middleware/              # 已存在 request-id / error-handler，新增 auth.ts
├── routes/
│   ├── health.ts            # 已存在
│   ├── docs.ts              # 已存在
│   ├── projects.ts          # 新增：项目 CRUD + 配置保存
│   └── datasources.ts       # 新增：schema 同步 + 查询
├── services/
│   ├── query-builder.ts     # 新增：fieldOps → SQL（参数化）
│   └── crypto.ts            # 新增：连接串 AES-256-GCM 加解密
└── db/
    ├── client.ts            # 已存在
    └── schema/              # 现有 users.ts，新增 projects.ts / datasources.ts / queryCache.ts
```

## 3. 数据库设计（Drizzle schema）

### 表 `users`（已存在）
- `id` varchar(36) PK
- `email` varchar(320) unique
- `display_name` varchar(120)
- `created_at` timestamp

> 待补充：`password_hash` varchar(255)（认证功能落地时加迁移）。

### 表 `projects`
- `id` varchar(36) PK（UUID）
- `name` varchar(255)
- `user_id` varchar(36) FK → users.id
- `config` json —— 存储 `ProjectConfig`（画布布局、组件列表、fieldOps 完整配置）
- `created_at`, `updated_at` timestamp

### 表 `datasource_connections`
- `id` varchar(36) PK（UUID）
- `project_id` varchar(36) FK → projects.id, ON DELETE CASCADE
- `name` varchar(255)
- `type` enum('mysql', 'postgres', 'csv')
- `connection_string` text（AES-256-GCM 加密存储）
- `schema_cache` json（缓存表结构，如 `{ "orders": { "fields": [{ "name": "amount", "type": "number" }] } }`）
- `last_sync_at` timestamp

### 表 `query_cache`
- `id` varchar(36) PK（UUID）
- `datasource_id` varchar(36) FK → datasource_connections.id
- `query_hash` varchar(64)（对 `table + fieldOps` 做 SHA-256）
- `result_data` json（二维数组）
- `expires_at` timestamp（默认 TTL 60s）

## 4. API 接口设计

统一约定：所有业务路由挂在 `/api` 前缀下；错误响应为 `{ error: { code, message } }`；请求体用 zod 校验，校验失败返回 400。

### 4.1 数据源相关
- `GET /api/datasources/:id/schema`
  - 响应：`{ tables: { [table]: { fields: [{ name, type }] } } }`（优先读 `schema_cache`）
- `POST /api/datasources/:id/query`
  - Body: `{ table: string, fieldOps: Record<string, FieldOperation> }`
  - 处理流程：
    1. zod 校验 body。
    2. 根据 `fieldOps` 构建参数化 SQL 查询。
    3. 计算 `query_hash`，命中缓存且未过期则直接返回。
    4. 执行查询，写入缓存（TTL 60s）。
    5. 返回 `{ fields: string[], rows: any[][] }`。

### 4.2 项目相关
- `GET /api/projects` → 当前用户的项目列表。
- `POST /api/projects` → 新建项目（Body: `{ name }`）。
- `GET /api/projects/:id` → 返回项目 JSON（含 `config`）。
- `PUT /api/projects/:id` → 更新 `config` 字段（前端防抖自动保存）。
- `DELETE /api/projects/:id` → 删除项目。

### 4.3 导出
- `POST /api/projects/:id/export`
  - Body: `{ format: 'json' | 'png' }`
  - MVP 仅支持 JSON；PNG 使用 Puppeteer，作为后续迭代。

## 5. 数据处理引擎（核心逻辑）

### Query Builder 服务（`services/query-builder.ts`）
- 输入：`tableName`, `fieldOps`
- 输出：`{ sql, params }`
- 功能：
  - 解析 `filter` 表达式（支持 `>`, `<`, `>=`, `<=`, `=`, `!=`），操作符白名单校验，值一律走参数绑定。
  - 根据 `agg` 生成聚合函数（`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`）。
  - 根据 `sort` 生成 `ORDER BY`。
  - 存在聚合字段且存在非聚合字段时自动 `GROUP BY` 非聚合字段。
- **安全**：表名/字段名对 `schema_cache` 做白名单校验；值全部参数化，杜绝 SQL 注入。

### 缓存策略
- MVP：进程内 LRU（key = `query_hash`，TTL 60s），零外部依赖。
- 后续可切换 Redis / `query_cache` 表，接口保持不变。

## 6. 安全设计
- **连接字符串加密**：AES-256-GCM，密钥从环境变量 `SECRET_KEY` 读取。
- **权限控制**：`hono/jwt` 中间件验证 JWT；Service 层校验 `project.user_id` 与当前用户匹配，不匹配返回 403。
- **CORS**：`app.ts` 已按 `APP_ORIGIN` 配置，需将 `apps/api/.env` 中的 `APP_ORIGIN` 对齐为 `http://localhost:5181`（当前 `.env.example` 默认值 5173 与 web 实际端口不一致，需修正）。
- **限流**：查询接口按用户限流（如 30 req/s），防止大查询打爆数据库（后续迭代）。

---

# 实施路线图

> 原则：每个里程碑结束都是可运行、可演示的状态；优先打通"前端画布 + 内存数据"闭环，再接后端持久化。

## M0 · 地基对齐（0.5 天）
- 修正 `apps/api/.env.example` 的 `APP_ORIGIN` 为 `http://localhost:5181`。
- `packages/shared` 落地 `FieldOperation` / `Widget` / `ProjectConfig` 类型。
- `apps/web` 安装 Pinia、ECharts；`pnpm typecheck` 通过。

## M1 · 画布核心（2-3 天，纯前端、内存数据）
- `widgetStore`（含撤销/重做）+ `useDrag` / `useResize`。
- `StudioView` 三栏布局 + `CanvasContainer` + `WidgetRenderer` + 5 种 widget（ECharts）。
- 左侧 `DataPanel` 用内置示例数据（复用 demo 的 orders/customers/products），字段拖拽生成组件。
- 右侧 `PropsPanel` + `LayersPanel`。
- 验收：demo.html 中除配置弹窗外的全部交互在 Vue 版可用。

## M2 · 配置弹窗（2 天）
- `ConfigModal` 三栏：`FieldSelector`（多选）/ `OperationPanel`（批量+单字段）/ `PreviewPanel`（实时预览）。
- `fieldOps.ts` 纯函数（过滤/聚合/排序/分组），画布渲染与预览共用；补单元测试。
- 验收：demo.html 全部交互在 Vue 版可用。

## M3 · 后端持久化（2-3 天）
- Drizzle 迁移：`projects` 表；`routes/projects.ts` CRUD + zod 校验 + 路由测试。
- 前端 `api/project.ts`：加载 / 防抖自动保存。
- 验收：刷新页面后画布状态从后端恢复。

## M4 · 数据源查询（3 天，可选拆分）
- Drizzle 迁移：`datasource_connections`、`query_cache`；`services/query-builder.ts` + 单测。
- `routes/datasources.ts`：schema 同步、query 接口 + 缓存。
- 前端 `dataStore` 切换到真实 API。
- 验收：画布组件通过后端 SQL 查询渲染真实数据。

## 后续迭代（不在本期）
- JWT 认证与用户体系、JSON/PNG 导出、Redis 缓存、限流、协同编辑。