// src/models/Permission.ts
import { db } from "../config/database";

export interface PermissionRule {
  id: number;
  resource_type: string;
  resource_id: string | null;
  actions: string; // JSON string
  conditions: string | null; // JSON string
  priority: number;
  is_active: boolean;
  created_at: string;
}

export class PermissionModel {
  /**
   * 获取用户在特定资源类型上的所有权限
   */
  static async getUserPermissionsForResource(
    userId: number,
    resourceType: string,
    resourceId?: string,
  ): Promise<{ resource_type: string; actions: string[] }[]> {
    const sql = `
      SELECT DISTINCT pr.resource_type, pr.actions
      FROM permission_rules pr
      JOIN role_permissions rp ON pr.id = rp.permission_rule_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
        AND pr.is_active = 1
        AND pr.resource_type = ?
        AND (pr.resource_id IS NULL OR pr.resource_id = '*')
      ORDER BY pr.priority DESC
    `;
    const rows = db.prepare(sql).all(userId, resourceType) as any[];

    return rows.map((row) => ({
      resource_type: row.resource_type,
      actions: JSON.parse(row.actions),
    }));
  }

  /**
   * 获取用户在特定资源实例上的权限
   */
  static async getUserPermissionsForResourceInstance(
    userId: number,
    resourceType: string,
    resourceId: string,
  ): Promise<string[]> {
    const allActions = new Set<string>();

    // 1. 获取通用权限 (resource_id = '*')
    const genericPerms = await this.getUserPermissionsForResource(userId, resourceType);
    for (const perm of genericPerms) {
      JSON.parse(perm.actions).forEach((action: string) => allActions.add(action));
    }

    // 2. 获取具体实例权限 (resource_id = specific_id)
    const sql = `
      SELECT pr.actions
      FROM permission_rules pr
      JOIN role_permissions rp ON pr.id = rp.permission_rule_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
        AND pr.is_active = 1
        AND pr.resource_type = ?
        AND pr.resource_id = ?
      ORDER BY pr.priority DESC
    `;
    const instanceRows = db.prepare(sql).all(userId, resourceType, resourceId) as any[];

    for (const row of instanceRows) {
      JSON.parse(row.actions).forEach((action: string) => allActions.add(action));
    }

    return Array.from(allActions);
  }
}
