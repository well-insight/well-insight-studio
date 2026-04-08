// src/models/User.ts
import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export interface User {
  id: string;
  email: string;
  username: string;
  /** 显示名称 / 昵称，用于界面展示 */
  display_name?: string | null;
  password_hash: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

/** 对外返回的用户信息（不含密码） */
export type UserPublic = Omit<User, "password_hash">;

export class UserModel {
  static async findById(id: string): Promise<User | undefined> {
    return db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(id) as
      | User
      | undefined;
  }

  /** 按主键查询（含已禁用用户），用于管理等场景 */
  static findByPk(id: string): User | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    return db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email) as
      | User
      | undefined;
  }

  static async findByUsername(username: string): Promise<User | undefined> {
    return db.prepare("SELECT * FROM users WHERE username = ? AND is_active = 1").get(username) as
      | User
      | undefined;
  }

  /** 登录：先按邮箱匹配，再按用户名匹配 */
  static async findByEmailOrUsername(account: string): Promise<User | undefined> {
    const userByEmail = await UserModel.findByEmail(account);
    if (userByEmail) return userByEmail;
    return UserModel.findByUsername(account);
  }

  static async create(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<string> {
    const id = generateSnowflakeId();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, username, display_name, password_hash, role, is_active)
      VALUES (@id, @email, @username, @display_name, @password_hash, @role, @is_active)
    `);
    stmt.run({
      id,
      ...userData,
      display_name: userData.display_name ?? null,
    });
    return id;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    db.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
  }

  static updatePasswordHash(userId: string, passwordHash: string): boolean {
    const r = db
      .prepare(
        "UPDATE users SET password_hash = @hash, updated_at = CURRENT_TIMESTAMP WHERE id = @id",
      )
      .run({ hash: passwordHash, id: userId });
    return r.changes > 0;
  }

  /** 查询所有用户（不含 password_hash） */
  static findAll(): UserPublic[] {
    const rows = db
      .prepare(
        `
      SELECT id, email, username, display_name, role, is_active, created_at, updated_at, last_login_at
      FROM users
      ORDER BY created_at ASC, id ASC
    `,
      )
      .all() as UserPublic[];
    return rows;
  }
}

export const UserDatabase = UserModel;
