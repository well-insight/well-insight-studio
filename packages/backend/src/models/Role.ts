// src/models/Role.ts
import { db } from "../config/database";

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
    return db.prepare("SELECT * FROM roles WHERE name = ?").get(name) as Role | undefined;
  }

  static async findById(id: string): Promise<Role | undefined> {
    return db.prepare("SELECT * FROM roles WHERE id = ?").get(id) as Role | undefined;
  }

  static async getAll(): Promise<Role[]> {
    return db.prepare("SELECT * FROM roles ORDER BY name ASC").all() as Role[];
  }
}
