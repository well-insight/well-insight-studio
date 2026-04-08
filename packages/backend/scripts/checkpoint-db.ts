/**
 * 提交 Git 前运行：把 WAL 并入 app.db，避免协作者拉到不一致的库。
 * 用法：pnpm --filter backend db:checkpoint（需先停掉占用数据库的本地服务）
 */
import path from "path";
import dotenv from "dotenv";
import Database from "better-sqlite3";

const backendRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

const defaultDbFile = path.join(backendRoot, "data", "app.db");
const dbPath = (process.env.DB_PATH && process.env.DB_PATH.trim()) || defaultDbFile;

const db = new Database(dbPath);
db.pragma("wal_checkpoint(TRUNCATE)");
db.close();
console.log(`[db:checkpoint] 已完成，可提交: ${dbPath}`);
