# 项目 Skills 使用指南

本项目的所有项目级 Agent Skill 统一存放在：

```text
.agents/skills/<skill-name>/SKILL.md
```

每个 skill 是一组可按需加载的工作流说明，用于让 Agent 在特定任务中遵循更专业、更稳定的处理方式。skill 不等同于 npm 依赖，也不会直接参与前端构建。

## 目录结构

```text
.agents/
└── skills/
    ├── algorithmic-art/
    │   └── SKILL.md
    ├── frontend-design/
    │   └── SKILL.md
    ├── webapp-testing/
    │   └── SKILL.md
    └── ...
```

一个 skill 目录除 `SKILL.md` 外，还可以包含：

- `references/`：参考资料
- `scripts/`：辅助脚本
- `assets/`：模板、图片或其他资源
- `agents/`：特定 Agent 的配置

## 使用步骤

### 1. 判断任务是否匹配某个 skill

先根据任务类型选择最相关的 skill。例如：

| 任务                              | 推荐 skill                      |
| --------------------------------- | ------------------------------- |
| 优化已有页面 UI                   | `frontend-design`、`improve-ui` |
| 无障碍检查                        | `fixing-accessibility`          |
| 动画卡顿或滚动性能问题            | `fixing-motion-performance`     |
| 页面 SEO 或社交分享信息           | `fixing-metadata`               |
| 测试本地 Web 页面、截图、验证交互 | `webapp-testing`                |
| 生成 Word 文档                    | `docx`                          |
| 处理 PDF                          | `pdf`                           |
| 处理 Excel、CSV、TSV              | `xlsx`                          |
| 制作 PPT 或演示文稿               | `pptx`                          |
| 调用 Claude/Anthropic API         | `claude-api`                    |

如果你判断某个任务可能需要 skill，先询问用户是否要使用，再继续。除非用户明确指定，否则不要自行加载 skill。

### 2. 加载 skill

在支持 skill 自动发现的 Agent 环境中，项目启动后会从 `.agents/skills` 自动读取可用 skill。匹配任务时按需加载，不要一次性加载所有 skill。

也可以通过命令手动读取：

```bash
npx openskills read <skill-name>
```

一次加载多个 skill：

```bash
npx openskills read frontend-design,fixing-accessibility
```

读取后，按照命令输出的 skill 内容和其中引用的相对路径继续执行。

### 3. 按 skill 说明执行任务

skill 通常会规定：

- 适用场景和触发条件
- 调查顺序
- 设计或实现约束
- 必须检查的文件和资源
- 验证命令
- 输出格式或交付要求

项目通用规则仍以 `AGENTS.md` 为准。如果 skill 和项目规则存在冲突，优先遵循项目规则；如果用户明确提出了更具体的要求，优先满足用户要求。

### 4. 组合使用多个 skill

复杂任务可以组合多个 skill，但应保持最小必要范围。例如：

```text
优化一个已有页面并验证交互：
1. improve-ui：只读审计并识别真实 UI 问题
2. frontend-design：确定视觉方向和实现方式
3. fixing-accessibility：检查键盘、焦点和语义
4. webapp-testing：启动页面并通过浏览器验证
```

不要加载作用重复的 skill。比如单纯调整已有界面的间距和层级时，应依据任务选择 `frontend-design` 或 `improve-ui`，不必同时加载所有 UI skill。

## Skill 清单

### UI、设计和前端

| Skill | 作用和适用场景 |
| ----- | -------------- |

| `brand-guidelines` | 将 Anthropic 官方品牌色彩和字体规范应用到视觉或文档产物中。仅在确实需要 Anthropic 品牌风格时使用。 |
| `create-design-md` | 从已有项目或网站提取设计语言、设计 token 和界面规范，创建或更新 `DESIGN.md`；只读产品源代码。 |
| `fixing-accessibility` | 检查和修复 HTML 无障碍问题，包括 ARIA、键盘导航、焦点管理、颜色对比度和表单错误。 |
| `fixing-metadata` | 检查和修复页面标题、描述、canonical、Open Graph、Twitter Card、favicon、JSON-LD 和 robots 等元信息。 |
| `fixing-motion-performance` | 排查动画卡顿、布局抖动、滚动关联动画、模糊和合成层等性能问题。 |
| `frontend-design` | 创建或重塑有明确视觉方向的前端界面，关注布局、字体、配色、层级和独特性。 |
| `improve-ui` | 对现有页面进行只读 UI 审计，基于项目实际设计证据发现问题并输出可执行的实现计划。 |
| `theme-system` | 设计令牌和主题系统规范，涵盖颜色、间距、圆角、字体、阴影，以及亮暗主题与多主题切换。 |
| `ui-skills-root` | UI 相关任务的入口 skill，用于通过 ui-skills CLI 选择最小必要的 UI 上下文。 |
| `vue3-component-design` | Vue3 + TypeScript 组件设计规范，涵盖组件 API、v-model、Slots、样式隔离和无障碍。 |
| `vue3-component-library` | Vue3 + TypeScript 组件库工程规范，涵盖 token 消费、主题、组件 API、动效、无障碍、测试、文档和兼容性。 |
| `vue3-unit-testing` | Vue3 + TypeScript 单元与组件测试规范，涵盖 Vitest、Vue Test Utils、用户行为、v-model、异步状态、无障碍和 mock。 |
| `vue3-dynamic-renderer` | Vue3 动态渲染规范，涵盖组件注册表、递归组件、插槽、异步加载、错误处理和性能优化。 |
| `vue3-drag-drop` | Vue3 拖拽交互规范，涵盖列表排序、跨容器拖拽、手柄、键盘、触摸支持和状态同步。 |
| `schema-driven-form` | Schema 驱动表单规范，涵盖动态字段、条件联动、嵌套值、校验、可访问性和数据转换。 |
| `low-code-schema` | 低代码/无代码平台的 Schema 设计规范，涵盖组件树、属性、事件、样式、数据绑定和版本控制。 |

### Web 和交互产物

| Skill               | 作用和适用场景                                                                    |
| ------------------- | --------------------------------------------------------------------------------- |
| `algorithmic-art`   | 使用 p5.js、随机种子、粒子系统或 flow field 创建原创算法艺术。                    |
| `canvas-design`     | 创建海报、封面、静态视觉设计、PNG 或 PDF 视觉作品；要求原创设计。                 |
| `slack-gif-creator` | 创建符合 Slack 尺寸、体积和播放约束的 GIF 动图。                                  |
| `webapp-testing`    | 使用 Playwright 测试本地 Web 应用，验证交互、截图、查看浏览器日志和排查前端问题。 |

### 文档和办公文件

| Skill             | 作用和适用场景                                                            |
| ----------------- | ------------------------------------------------------------------------- |
| `doc-coauthoring` | 按结构化流程协作撰写技术方案、规格说明、提案、决策记录等文档。            |
| `docx`            | 创建、读取、编辑和整理 Word 文档，包括目录、表格、页码、信函和正式报告。  |
| `internal-comms`  | 编写项目进展、状态更新、事故复盘、FAQ、团队公告等内部沟通材料。           |
| `pdf`             | 读取、提取、合并、拆分、OCR、加水印、填写或生成 PDF。                     |
| `pptx`            | 创建、读取、编辑、整理和生成 PowerPoint 演示文稿、deck 或 slides。        |
| `xlsx`            | 读取、清洗、编辑、计算、格式化、图表化或转换 Excel、CSV、TSV 等表格数据。 |

### API、工具和技能开发

| Skill                  | 作用和适用场景                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-api`           | Claude/Anthropic API 与 SDK 参考，包括模型、参数、流式输出、工具调用、缓存、MCP 和 token。涉及 Claude 时应优先加载。                                                                                     |
| `vite-docs`            | Vite 官方文档优先 skill。只要用户提到 Vite、vite.config、vite dev/build/preview、server/build/preview、插件、迁移、优化、部署、SSR、alias、base 或代理，就先联网读取最新官方文档再回答；不要凭记忆回答。 |
| `mcp-builder`          | 使用 FastMCP 或 Node/TypeScript MCP SDK 构建 MCP 服务和高质量工具。                                                                                                                                      |
| `hono-api-design`      | Hono + TypeScript API 设计规范，涵盖路由、RESTful 约定、校验、响应格式、分页、过滤、错误和版本控制。                                                                                                     |
| `hono-auth-middleware` | Hono 认证与授权中间件设计，涵盖 JWT、Session、角色权限、资源所有权与令牌刷新。                                                                                                                           |
| `hono-backend`         | Hono + TypeScript 服务工程规范，涵盖应用组织、配置、中间件、错误处理、数据库、文件、测试和部署。                                                                                                         |
| `hono-testing`         | Hono + TypeScript 单元与路由测试规范，涵盖 app.request、依赖注入、Fetch 语义、鉴权、错误处理、mock 和测试隔离。                                                                                          |
| `skill-creator`        | 创建、修改、评测和优化 Agent Skill，包括触发描述、工作流和性能对比。                                                                                                                                     |
| `template`             | skill 占位模板，仅用于示例；正式使用前必须替换为真实名称和描述。                                                                                                                                         |

## 新增或修改 Skill

新增 skill 时，目录名必须使用小写字母、数字和单个连字符，例如：

```text
.agents/skills/api-review/SKILL.md
```

`SKILL.md` 必须以 YAML frontmatter 开始：

```markdown
---
name: api-review
description: Review API changes for compatibility, security, and test coverage. Use when...
---

# API Review

写给 Agent 的具体工作指令。
```

要求：

1. `name` 必须与目录名完全一致。
2. `description` 要明确说明作用和触发场景。
3. 指令应具体，包含调查路径、命令、输出和验证方式。
4. 资源引用使用 skill 目录内的相对路径。
5. 新 skill 应放在 `.agents/skills`，不要再创建 `.claude/skills` 或其他项目级 skill 目录。
6. 修改 skill 后，检查 frontmatter、目录名和相对资源路径是否正确。

创建或优化 skill 时，可使用：

```bash
npx openskills read skill-creator
```

## 维护约定

- 所有项目级 skill 统一放在 `.agents/skills`。
- `.claude/skills` 不再作为项目 skill 存放位置。
- 不要复制同名 skill；如需变体，使用清晰且唯一的名称。
- skill 只保存可复用的工作流和领域规则，不保存项目运行时数据或密钥。
- 每次新增 skill 后同步更新本文件的“Skill 清单”。
- 提交前检查是否误加入大型构建产物、缓存或敏感信息。
