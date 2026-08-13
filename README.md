# Well Cube

Well Cube 是一个基于 Vue 3 与 Express 的低代码平台，提供可视化页面、表单、报表、数据集和应用菜单编排能力。

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia、Element Plus、UnoCSS、ECharts、Monaco Editor
- 后端：Express、TypeScript、MySQL、JWT、Zod、Swagger
- 包管理：pnpm workspace

## 前置条件

- Node.js 18 或更高版本
- pnpm 8 或更高版本
- 可访问的 MySQL 8 数据库

## 安装

```bash
pnpm install
```

## 配置后端环境变量

在 `packages/backend/.env` 配置数据库及认证信息：

```dotenv
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=well_cube
MYSQL_PASSWORD=change-me
MYSQL_DATABASE=well_cube
MYSQL_CONNECTION_LIMIT=10
JWT_SECRET=replace-with-a-long-random-secret
PORT=8100
```

生产环境还必须显式配置允许访问 API 的前端来源：

```dotenv
NODE_ENV=production
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

`CORS_ORIGIN` 是逗号分隔的来源白名单。开发环境默认仅允许 `http://localhost:5188`。

> 后端在启动时会创建所需的表、索引、默认角色和管理员用户。请在首次启动后通过注册或数据库管理流程设置并确认可用的管理员凭据；不要在文档或仓库中保存真实密码。

## 启动开发环境

```bash
# 同时启动前端和后端
pnpm dev

# 或按模块启动
pnpm dev:frontend
pnpm dev:backend
```

- 前端：`http://localhost:5188`
- 后端健康检查：`http://localhost:8100/health`
- API 前缀：`http://localhost:8100/api/v1`

可通过前端环境变量覆盖 API 地址：

```dotenv
VITE_APP_API_URL=http://localhost:8100/api/v1
VITE_LOGIN_VARIANT=cube
```

`VITE_LOGIN_VARIANT` 支持 `classic`、`business`、`hero` 与 `cube`，默认值为 `cube`。

## 常用命令

```bash
pnpm build              # 构建前后端
pnpm build:frontend     # 构建前端
pnpm build:backend      # 构建后端
pnpm lint               # 执行前端 ESLint
pnpm test               # 执行后端单元测试
pnpm async              # 执行数据库 checkpoint 脚本
```

## 项目结构

```text
packages/
  frontend/             Vue 3 低代码工作台与编辑器
  backend/              Express API 与 MySQL 数据模型
demo/                   独立演示页面和素材
```

## 质量与安全约定

- 不要提交 `.env`、数据库密码或 JWT 密钥。
- 生产环境必须使用高强度、唯一的 `JWT_SECRET`。
- 生产环境不要使用通配 CORS；通过 `CORS_ORIGIN` 配置实际部署域名。
- 修改接口、鉴权或安全配置后，应运行 `pnpm test` 和 `pnpm build`。
