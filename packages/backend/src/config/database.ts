import Database from "better-sqlite3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// 须在读取 DB_PATH 之前加载（否则晚于本文件的 import 链拿不到 .env）
const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

const defaultDbFile = path.join(backendRoot, "data", "app.db");
const DB_PATH = (process.env.DB_PATH && process.env.DB_PATH.trim()) || defaultDbFile;

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// 每5分钟自动 checkpoint，确保 WAL 数据合并到主库
const walCheckpointTimer = setInterval(() => {
  try {
    db.pragma("wal_checkpoint(PASSIVE)");
  } catch (e) {
    console.warn("[DATABASE] 定期 WAL checkpoint 失败:", e);
  }
}, 5 * 60 * 1000);
walCheckpointTimer.unref(); // 不阻止进程正常退出

console.log(`[DATABASE] SQLite 数据库已连接: ${DB_PATH}`);

let dbClosed = false;

export function closeDatabase(): void {
  if (dbClosed) return;
  dbClosed = true;
  try {
    db.pragma("wal_checkpoint(RESTART)");
    db.pragma("wal_checkpoint(TRUNCATE)");
  } catch (e) {
    console.warn("[DATABASE] wal_checkpoint 失败:", e);
  }
  try {
    db.close();
    console.log("[DATABASE] 数据库连接已关闭，数据已落盘");
  } catch (e) {
    console.warn("[DATABASE] 关闭连接失败:", e);
  }
}

export { DB_PATH };

export default db;
