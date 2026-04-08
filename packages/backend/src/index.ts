import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes";
import { initializeDatabaseSchema } from "./config/dbSchema"; // 添加数据库初始化
import { closeDatabase } from "./config/database";
import { setupSwagger } from "./swagger/setupSwagger";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// 初始化数据库
initializeDatabaseSchema();

// 安全中间件（放宽 CSP 以兼容 Swagger UI 内联脚本与样式）
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
      },
    },
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
  }),
);

// 解析中间件
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS 配置
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:5173", "http://localhost:10086"],
    credentials: true,
  }),
);

setupSwagger(app, PORT);

// API 路由
app.use("/api/v1", routes);

// 健康检查
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  });
}

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Express 服务器已启动: http://localhost:${PORT}`);
  console.log(`[SERVER] 环境: ${process.env.NODE_ENV || "development"}`);
  console.log(`[SERVER] Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`[SERVER] OpenAPI JSON: http://localhost:${PORT}/api-docs/openapi.json`);
  console.log(`[DATABASE] SQLite 数据库已就绪`);
});

function shutdown(signal: string) {
  console.log(`[SERVER] 收到 ${signal}，正在安全退出…`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  setTimeout(() => {
    closeDatabase();
    process.exit(1);
  }, 8000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export default app;
