import { query, queryOne } from '../config/database';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
export class RoleModel {
  static async findByName(name: string): Promise<Role | undefined> {
    return queryOne<Role>('SELECT * FROM roles WHERE name = ?', [name]);
  }
  static async findById(id: string): Promise<Role | undefined> {
    return queryOne<Role>('SELECT * FROM roles WHERE id = ?', [id]);
  }
  static async getAll(): Promise<Role[]> {
    return query<Role[]>('SELECT * FROM roles ORDER BY name ASC');
  }
}
