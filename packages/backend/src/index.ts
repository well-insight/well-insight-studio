import compression from "compression";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { closeDatabase } from "./config/database";
import { initializeDatabaseSchema } from "./config/dbSchema";
import routes from "./routes";
import { setupSwagger } from "./swagger/setupSwagger";
const app: Express = express();
const PORT = Number(process.env.PORT || 8100);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:", "https://validator.swagger.io"] } } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(compression()); app.use(express.json({ limit: "10mb" })); app.use(express.urlencoded({ extended: true, limit: "10mb" })); app.use(cors({ origin: "*", credentials: true }));
setupSwagger(app, PORT); app.use("/api/v1", routes);
app.get("/health", (_req: Request, res: Response) => res.json({ status: "OK", timestamp: new Date().toISOString(), uptime: process.uptime(), version: "1.0.0" }));
if (process.env.NODE_ENV === "production") { app.use(express.static(path.join(__dirname, "../../frontend/dist"))); app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"))); }
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { console.error(err.stack); res.status(500).json({ success: false, error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message }); });
async function bootstrap(): Promise<void> { await initializeDatabaseSchema(); const server = app.listen(PORT, () => { console.log(`[SERVER] Express 服务器已启动: http://localhost:${PORT}`); console.log("[DATABASE] MySQL 数据库已就绪"); }); server.keepAliveTimeout = 65000; server.headersTimeout = 66000; const shutdown = (signal: string) => { console.log(`[SERVER] 收到 ${signal}，正在安全退出…`); server.close(() => void closeDatabase().finally(() => process.exit(0))); setTimeout(() => void closeDatabase().finally(() => process.exit(1)), 8000).unref(); }; process.once("SIGINT", () => shutdown("SIGINT")); process.once("SIGTERM", () => shutdown("SIGTERM")); }
void bootstrap().catch(error => { console.error("[SERVER] 启动失败", error); process.exit(1); });
process.on("uncaughtException", err => console.error("[SERVER] 未捕获异常，服务继续运行:", err)); process.on("unhandledRejection", reason => console.error("[SERVER] 未处理的 Promise rejection，服务继续运行:", reason));
export default app;
