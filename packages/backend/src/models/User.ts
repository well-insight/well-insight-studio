import { execute, query, queryOne } from '../config/database';
import { generateSnowflakeId } from '../utils/snowflake';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string | null;
  password_hash: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}
export type UserPublic = Omit<User, 'password_hash'>;

export class UserModel {
  static async findById(id: string): Promise<User | undefined> {
    return queryOne<User>('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
  }
  static async findByPk(id: string): Promise<User | undefined> {
    return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
  }
  static async findByEmail(email: string): Promise<User | undefined> {
    return queryOne<User>('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  }
  static async findByUsername(username: string): Promise<User | undefined> {
    return queryOne<User>('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
  }
  static async findByEmailOrUsername(account: string): Promise<User | undefined> {
    return (await this.findByEmail(account)) ?? this.findByUsername(account);
  }
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = generateSnowflakeId();
    await execute(
      'INSERT INTO users (id, email, username, display_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userData.email,
        userData.username,
        userData.display_name ?? null,
        userData.password_hash,
        userData.role ?? 'user',
        userData.is_active ? 1 : 0,
      ],
    );
    return id;
  }
  static async updateLastLogin(userId: string): Promise<void> {
    await execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
  }
  static async updatePasswordHash(userId: string, passwordHash: string): Promise<boolean> {
    return (
      (
        await execute(
          'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [passwordHash, userId],
        )
      ).affectedRows > 0
    );
  }
  static async findAll(): Promise<UserPublic[]> {
    return query<UserPublic[]>(
      'SELECT id, email, username, display_name, role, is_active, created_at, updated_at, last_login_at FROM users ORDER BY created_at ASC, id ASC',
    );
  }
}
export const UserDatabase = UserModel;
