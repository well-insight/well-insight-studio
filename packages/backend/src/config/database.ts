import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Database from "better-sqlite3";

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

console.log(`[DATABASE] SQLite 数据库已连接: ${DB_PATH}`);

let dbClosed = false;

export function closeDatabase(): void {
  if (dbClosed) return;
  dbClosed = true;
  try {
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
