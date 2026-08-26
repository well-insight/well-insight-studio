# Well-Insight Studio 实施计划

> 配套文档：[product-design.md](./product-design.md)（PRD + 技术设计）、[demo.html](./demo.html)（交互原型，实现的行为基准）。
>
> 本文档把产品设计拆解为**可逐步执行、逐步验证**的任务清单。每个任务包含：目标、涉及文件、实现要点、验收标准。

## 0. 总则

- **增量交付**：每个 Phase 结束都是可运行、可演示的状态。
- **原型对齐**：交互行为以 `demo.html` 为准；视觉风格沿用 `@well-insight/ui` 主题，不复制原型内联样式。
- **类型先行**：前后端共用的数据结构先落在 `packages/shared`，再写实现。
- **纯函数可测**：数据处理（fieldOps）、图表配置生成（chart）等逻辑写成纯函数，配单元测试。
- **提交纪律**：遵循 [COMMIT_CONVENTION.md](../COMMIT_CONVENTION.md)，每个任务一个 commit。

## 1. 阶段总览

| Phase | 目标 | 预估 | 交付物 |
|---|---|---|---|
| P0 地基对齐 | 修配置、共享类型、依赖就位 | 0.5 天 | typecheck 通过 |
| P1 画布核心 | Vue 版画布 + 拖拽 + 5 种组件（内存数据） | 2-3 天 | `/studio` 可交互画布 |
| P2 配置弹窗 | 三栏配置弹窗 + fieldOps 纯函数 | 2 天 | 配置实时预览并生效 |
| P3 后端持久化 | projects 表 + CRUD + 自动保存 | 2-3 天 | 刷新后画布恢复 |
| P4 数据源查询 | datasources 表 + Query Builder + 缓存 | 3 天 | 真实 SQL 查询驱动画布 |

依赖关系：P0 → P1 → P2 → P3 → P4，严格串行；P2 的 fieldOps 纯函数会被 P4 的 Query Builder 复用语义。

---

## Phase 0 · 地基对齐

### 任务 0.1 修复 CORS 端口不一致
- **文件**：`apps/api/.env.example`
- **改动**：`APP_ORIGIN=http://localhost:5173` → `http://localhost:5181`（与 `apps/web/vite.config.ts` 的 `server.port` 一致）。
- **验收**：启动 api + web 后，前端 `fetch('http://localhost:3000/health')` 无 CORS 报错。

### 任务 0.2 落地共享类型
- **文件**：`packages/shared/src/index.ts`
- **内容**：`FieldOperation`、`WidgetType`、`Widget`、`ProjectConfig`（定义见 product-design.md 前端章 §4）。
- **验收**：`pnpm --filter @well-insight/shared typecheck` 通过；`apps/web`、`apps/api` 能 `import type { Widget } from '@well-insight/shared'`。

### 任务 0.3 前端依赖安装
- **命令**：`pnpm --filter @well-insight/web add pinia echarts`
- **改动**：`apps/web/src/main.ts` 注册 `createPinia()`。
- **验收**：`pnpm typecheck` 全仓通过。

---

## Phase 1 · 画布核心（纯前端、内存数据）

> 目标：把 demo.html 除配置弹窗外的全部交互搬到 Vue。数据用内置示例数据（复用原型的 orders / customers / products）。

### 任务 1.1 示例数据 + 类型
- **文件**：`apps/web/src/modules/studio/utils/sampleData.ts`
- **内容**：三张表的字段与行数据（与 demo 一致）；`TableData { fields: string[]; rows: unknown[][] }` 类型。
- **验收**：被 store 引用后 typecheck 通过。

### 任务 1.2 fieldOps 数据处理纯函数
- **文件**：`apps/web/src/modules/studio/utils/fieldOps.ts`
- **内容**：`applyFieldOps(data, fieldOps, visibleFields)` —— 过滤（`> < >= <= = !=`）→ 排序 → 聚合分组（sum/avg/count/min/max + GROUP BY 语义），返回 `{ fields, displayFields, rows }`。逻辑与 demo.html §5.1 一致。
- **测试**：`apps/web/src/modules/studio/utils/__tests__/fieldOps.spec.ts`（Vitest）：过滤表达式、聚合分组、别名映射、空数据。
- **验收**：`pnpm --filter @well-insight/web test` 通过。

### 任务 1.3 widgetStore（含撤销/重做）
- **文件**：`apps/web/src/stores/widgetStore.ts`
- **内容**：
  - state：`widgets: Widget[]`、`selectedId: string | null`
  - actions：`add / remove / update / select / toggleVisible / toggleLock / moveLayer / clear`
  - 历史栈：`undoStack / redoStack`（JSON 快照，上限 50），`undo() / redo()`；拖拽类操作在开始时压栈、空位移回滚快照（对齐 demo 行为）
- **验收**：单元测试覆盖增删改、撤销重做边界（空栈、上限）。

### 任务 1.4 dataStore（内存版）
- **文件**：`apps/web/src/stores/dataStore.ts`
- **内容**：`tables: Record<string, TableData>`（先装示例数据）；`getTableData(name)`；预留 `fetchSchema / fetchData` 接口签名（P4 接真实 API）。
- **验收**：typecheck 通过。

### 任务 1.5 拖拽 composables
- **文件**：`apps/web/src/composables/useDrag.ts`、`useResize.ts`
- **内容**：鼠标事件 → 更新 widget x/y/width/height；8px 网格吸附；锁定组件跳过；结束时才持久化历史。
- **验收**：画布上拖动、缩放流畅，属性面板数值同步。

### 任务 1.6 StudioView 三栏骨架 + 路由
- **文件**：`apps/web/src/modules/studio/StudioView.vue`；`apps/web/src/router/index.ts` 加 `/studio`
- **布局**：左 `DataPanel` / 中 `CanvasToolbar + CanvasContainer` / 右 `Tabs(PropsPanel | LayersPanel)`，参照 demo 三栏结构。
- **验收**：访问 `http://localhost:5181/studio` 渲染三栏。

### 任务 1.7 DataPanel（数据源树）
- **文件**：`apps/web/src/modules/studio/components/DataPanel.vue`
- **组件**：`WiTree` 展示表 → 字段；字段节点 `draggable`，dragstart 写入 `{ table, field }`。
- **验收**：树渲染三张表；字段可拖出。

### 任务 1.8 CanvasContainer + WidgetRenderer
- **文件**：`CanvasContainer.vue`、`WidgetRenderer.vue`
- **内容**：容器监听 `dragover / drop`（drop → 按字段类型生成 bar/table 组件，对齐 demo §10）；遍历 `widgets` 按类型分发到具体 widget 组件；选中高亮；双击打开配置（P2 接入，先留 emit）；缩放控件（40%-160%）。
- **验收**：工具栏点按钮、拖字段都能生成组件；组件可拖动、缩放、选中。

### 任务 1.9 五种 Widget 组件
- **文件**：`widgets/KpiWidget.vue`、`widgets/ChartWidget.vue`（bar/line/pie 合一，ECharts）、`widgets/TableWidget.vue`
- **chart 工具**：`utils/chart.ts` —— `(type, processedData, color) => EChartsOption` 纯函数。
- **要点**：ECharts 按需引入（`echarts/core` + BarChart/LineChart/PieChart）；组件 resize 时调 `chart.resize()`；应用了 fieldOps 的组件渲染处理后数据。
- **验收**：五种组件渲染正确；改数据源/配置后图表刷新。

### 任务 1.10 PropsPanel + LayersPanel
- **文件**：`PropsPanel.vue`、`LayersPanel.vue`
- **组件**：`WiInput`（标题）、`WiSelect`（数据源/图表类型）、`WiInputColor`（主题色）、`WiInputNumber`（X/Y/W/H）；图层面板用上移/下移/显隐/锁定按钮。
- **验收**：面板编辑即时生效；图层顺序与画布 z-index 一致。

### 任务 1.11 Phase 1 总验收
- demo.html 中除配置弹窗外的交互全部可用：增删、拖拽、缩放、图层、显隐、锁定、撤销/重做、缩放画布。
- `pnpm typecheck && pnpm build` 通过。

---

## Phase 2 · 配置弹窗

### 任务 2.1 configStore
- **文件**：`apps/web/src/stores/configStore.ts`
- **内容**：`targetId`、`selectedFields: string[]`、`fieldOps` 临时副本；`open(id)` 时从 widget.config 深拷贝初始化，`apply()` 时写回 widgetStore。

### 任务 2.2 ConfigModal 三栏
- **文件**：`config/ConfigModal.vue`（`WiDialog` 全屏尺寸）、`FieldSelector.vue`、`OperationPanel.vue`、`PreviewPanel.vue`
- **组件**：字段列表 `WiCheckbox` 多选 + 全选/清空；聚合/排序用 `WiSelectButton`；过滤用 `WiInput`；可见性用 `WiSwitch`。
- **要点**：`PreviewPanel` 复用任务 1.9 的 widget 组件 + 任务 1.2 的 `applyFieldOps`，传入临时 fieldOps，不触碰正式 store。
- **验收**：demo.html 配置弹窗全部交互可用；应用后画布组件按新配置渲染。

### 任务 2.3 Phase 2 总验收
- 多选字段 → 批量别名/聚合/排序/过滤/可见性 → 预览实时更新 → 应用生效 → 可撤销。

---

## Phase 3 · 后端持久化

### 任务 3.1 projects 表迁移
- **文件**：`apps/api/src/db/schema/projects.ts`；`pnpm --filter @well-insight/api db:generate`
- **字段**：见 product-design.md 后端章 §3。

### 任务 3.2 projects 路由
- **文件**：`apps/api/src/routes/projects.ts`
- **内容**：`GET /api/projects`、`POST`、`GET/:id`、`PUT/:id`（zod 校验 config 为合法 `ProjectConfig`）、`DELETE/:id`；统一错误格式 `{ error: { code, message } }`。
- **测试**：`app.request` 路由测试（参考 `hono-testing` 规范与现有 `test/health.test.ts`）。

### 任务 3.3 前端接入
- **文件**：`apps/web/src/api/client.ts`、`api/project.ts`；widgetStore 变更后防抖 1s 自动 `PUT`。
- **验收**：刷新页面画布从后端恢复；`pnpm --filter @well-insight/api test` 通过。

---

## Phase 4 · 数据源查询

### 任务 4.1 datasources + query_cache 迁移
- **文件**：`apps/api/src/db/schema/datasources.ts`、`queryCache.ts`

### 任务 4.2 Query Builder 服务
- **文件**：`apps/api/src/services/query-builder.ts`
- **内容**：fieldOps → 参数化 SQL；表名/字段名白名单校验（对 schema_cache）；filter 操作符白名单；自动 GROUP BY。
- **测试**：单测覆盖注入尝试（`; DROP TABLE` 等）必须被白名单拦截。

### 任务 4.3 datasources 路由 + 缓存
- **文件**：`apps/api/src/routes/datasources.ts`
- **内容**：`GET /:id/schema`（读 schema_cache）、`POST /:id/query`（LRU 缓存 60s，`query_hash` = SHA-256(table + fieldOps)）。

### 任务 4.4 前端切换真实数据源
- **文件**：`apps/web/src/stores/dataStore.ts`（实现 `fetchSchema / fetchData`）、`api/datasource.ts`
- **验收**：画布组件通过后端 SQL 渲染真实数据；重复查询命中缓存（响应头或日志可观测）。

---

## 2. 测试策略

| 层 | 工具 | 覆盖目标 |
|---|---|---|
| 纯函数 | Vitest | fieldOps 全分支、chart option 生成、query-builder SQL 与注入防护 |
| Store | Vitest + Pinia | widgetStore 动作与历史栈 |
| API 路由 | Vitest + `app.request` | projects / datasources 全部端点含 400/404 |
| 组件 | 视情况补 | 关键交互（拖拽、配置弹窗） |
| E2E | 后续迭代 | Playwright 冒烟（可用项目内 `webapp-testing` 流程） |

## 3. 风险与对策

| 风险 | 对策 |
|---|---|
| ECharts 按需引入包体积 | `echarts/core` 按需注册；构建后检查 chunk 大小 |
| 拖拽 60fps | transform 而非 top/left 实时渲染，结束时才写 store（与 demo 一致） |
| fieldOps 前后端语义漂移 | P4 的 SQL 生成以 P2 纯函数的单测用例为行为基准 |
| MySQL 未就绪阻塞前端 | P1-P2 全部用内存数据，P3 才依赖数据库 |
| UI 库组件 API 不熟悉 | 实现时先查 `@well-insight/ui` 组件文档（MCP 可查 props/events），用 `validate_usage` 校验写法 |

## 4. 进度追踪

- [x] P0 地基对齐（2026-08-24 完成：CORS 端口修正、shared 类型、pinia/echarts/@lucide/vue 依赖）
- [ ] P1 画布核心（进行中）
  - [x] 1.1 示例数据 `sampleData.ts`
  - [x] 1.2 fieldOps 纯函数 + 14 个单测通过
  - [x] 1.3 widgetStore（含撤销/重做、编辑合并）—— 单测待补
  - [x] 1.4 dataStore 内存版
  - [x] 1.5 useDrag / useResize（8px 吸附、缩放坐标换算）
  - [x] 1.6 StudioView 三栏 + `/studio` 路由
  - [x] 1.7 DataPanel（自定义轻量树；WiTree 的 draggable 是树内排序，不适合拖出场景）
  - [x] 1.8 CanvasContainer + WidgetRenderer（drop 生成、选中、双击配置入口）
  - [x] 1.9 五种 Widget（KPI/图表用 ECharts/表格）+ chart.ts
  - [x] 1.10 PropsPanel（WiInput/WiSelect/WiInputNumber/WiInputColor）+ LayersPanel
  - [ ] 1.11 总验收（typecheck/build 已过；浏览器实测待做）
- [x] P2 配置弹窗（2026-08-24 完成：configStore + ConfigModal 三栏 + 双击/配置按钮接入）
- [x] P3 后端持久化（代码完成：projects 表迁移 + CRUD 路由 + 前端自动保存/加载；**运行时需 MySQL 就绪**）
- [ ] P4 数据源查询

### 实施过程中的决策记录
- 图标库用 `@lucide/vue`（`lucide-vue-next` 已被官方弃用并改名）。
- Toast 用 UI 库 `toast` 服务（`toast.success/info/warn/error`），`App.vue` 挂载 `<WiToast />`。
- 暗色主题通过 `useTheme().setTheme('dark')` 在 `App.vue` 开启。
- 属性面板连续编辑（如 X/Y 微调）通过 `updateWidget` 的 coalesceKey 合并历史，避免撤销栈刷屏。
- 拖拽位移在缩放状态下除以 zoom 换算回逻辑坐标（demo 原型在此有缺陷，Vue 版已修正）。
- 数据源树使用自定义轻量实现：WiTree 的 `draggable` 是树内排序，不适合把字段节点拖到外部画布。
- 配置弹窗的 `WiSelectButton` 用于聚合/排序，`WiInput` 用于别名和过滤条件。
- API 侧 `projects` 路由复用 `AppBindings` 中注入的 `db`；`app.ts` 每次请求创建 `createDb` 以兼容测试注入。
- 项目表 `user_id` 暂时可空，等 JWT 认证接入后再改为非空 FK。
