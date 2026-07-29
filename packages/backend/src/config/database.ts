import dotenv from "dotenv";
import mysql, { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import path from "path";

const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[DATABASE] 缺少必填环境变量 ${name}`);
  return value;
}

export const pool = mysql.createPool({
  host: requiredEnv("MYSQL_HOST"),
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: requiredEnv("MYSQL_USER"),
  password: requiredEnv("MYSQL_PASSWORD"),
  database: requiredEnv("MYSQL_DATABASE"),
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,
});

export async function query<T = unknown[]>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params as any[]);
  return rows as T;
}

export async function queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T[]>(sql, params);
  return rows[0];
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute(sql, params as any[]);
  return result as ResultSetHeader;
}

export async function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log("[DATABASE] MySQL 连接池已关闭");
}

export default pool;
