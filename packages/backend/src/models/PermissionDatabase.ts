import { execute, query, queryOne, withTransaction } from '../config/database';
import {
  ResourceType,
  ActionType,
  PermissionRule,
  PermissionRuleInput,
  Role,
  RoleInput,
  UserRole,
  PermissionCheckResult,
} from './Permission';
import { generateSnowflakeId } from '../utils/snowflake';
type DbRole = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
};
type DbUserRole = {
  id: string;
  user_id: string;
  role_id: string;
  project_id?: string | null;
  assigned_by: string;
  assigned_at: string;
  expires_at?: string | null;
};
function mapUserRole(row: DbUserRole): UserRole {
  return {
    id: row.id,
    userId: row.user_id,
    roleId: row.role_id,
    projectId: row.project_id ?? undefined,
    assignedBy: row.assigned_by,
    assignedAt: new Date(row.assigned_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}
export class PermissionDatabase {
  static async createRole(data: RoleInput, createdBy: string): Promise<Role> {
    const id = await withTransaction(async (connection) => {
      const roleId = generateSnowflakeId();
      await connection.execute(
        'INSERT INTO roles (id, name, description, created_by) VALUES (?, ?, ?, ?)',
        [roleId, data.name, data.description ?? null, createdBy],
      );
      for (const permission of data.permissions) {
        const permissionId = generateSnowflakeId();
        await connection.execute(
          'INSERT INTO permission_rules (id, resource_type, resource_id, actions, conditions, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            permissionId,
            permission.resourceType,
            permission.resourceId ?? null,
            JSON.stringify(permission.actions),
            permission.conditions ? JSON.stringify(permission.conditions) : null,
            permission.priority,
            permission.isActive ? 1 : 0,
          ],
        );
        await connection.execute(
          'INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)',
          [generateSnowflakeId(), roleId, permissionId],
        );
      }
      return roleId;
    });
    return (await this.getRoleById(id))!;
  }
  static async getRoleById(id: string): Promise<Role | undefined> {
    const role = await queryOne<DbRole>('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) return undefined;
    const permissions = await query<
      Array<{
        id: string;
        resource_type: ResourceType;
        resource_id?: string | null;
        actions: string;
        conditions?: string | null;
        priority: number;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>
    >(
      'SELECT pr.* FROM permission_rules pr INNER JOIN role_permissions rp ON pr.id = rp.permission_rule_id WHERE rp.role_id = ? AND pr.is_active = 1',
      [id],
    );
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: new Date(role.created_at),
      updatedAt: new Date(role.updated_at),
      createdBy: role.created_by,
      permissions: permissions.map((permission) => ({
        id: permission.id,
        resourceType: permission.resource_type,
        resourceId: permission.resource_id ?? undefined,
        actions: JSON.parse(permission.actions) as ActionType[],
        conditions: permission.conditions ? JSON.parse(permission.conditions) : undefined,
        priority: Number(permission.priority),
        isActive: Boolean(permission.is_active),
        createdAt: new Date(permission.created_at),
        updatedAt: new Date(permission.updated_at),
      })),
    };
  }
  static async getAllRoles(): Promise<Role[]> {
    const rows = await query<Array<{ id: string }>>(
      'SELECT id FROM roles ORDER BY created_at DESC',
    );
    const roles = await Promise.all(rows.map((row) => this.getRoleById(row.id)));
    return roles.filter((role): role is Role => Boolean(role));
  }
  static async updateRole(id: string, updates: Partial<RoleInput>): Promise<Role | null> {
    try {
      await withTransaction(async (connection) => {
        const sets: string[] = [],
          params: any[] = [];
        if (updates.name !== undefined) {
          sets.push('name = ?');
          params.push(updates.name);
        }
        if (updates.description !== undefined) {
          sets.push('description = ?');
          params.push(updates.description);
        }
        if (sets.length) {
          sets.push('updated_at = ?');
          params.push(new Date().toISOString(), id);
          await connection.execute(`UPDATE roles SET ${sets.join(', ')} WHERE id = ?`, params);
        }
        if (updates.permissions !== undefined) {
          const [linkedRows] = await connection.execute(
            'SELECT permission_rule_id FROM role_permissions WHERE role_id = ?',
            [id],
          );
          const linked = linkedRows as Array<{ permission_rule_id: string }>;
          await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
          for (const row of linked)
            await connection.execute('DELETE FROM permission_rules WHERE id = ?', [
              row.permission_rule_id,
            ]);
          for (const permission of updates.permissions as PermissionRuleInput[]) {
            const permissionId = generateSnowflakeId();
            await connection.execute(
              'INSERT INTO permission_rules (id, resource_type, resource_id, actions, conditions, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                permissionId,
                permission.resourceType,
                permission.resourceId ?? null,
                JSON.stringify(permission.actions),
                permission.conditions ? JSON.stringify(permission.conditions) : null,
                permission.priority,
                permission.isActive ? 1 : 0,
              ],
            );
            await connection.execute(
              'INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)',
              [generateSnowflakeId(), id, permissionId],
            );
          }
        }
      });
      return (await this.getRoleById(id)) ?? null;
    } catch (error) {
      console.error('更新角色失败:', error);
      return null;
    }
  }
  static async deleteRole(id: string): Promise<boolean> {
    return (await execute('DELETE FROM roles WHERE id = ?', [id])).affectedRows > 0;
  }
  static async assignRole(data: Omit<UserRole, 'id' | 'assignedAt'>): Promise<UserRole> {
    const id = generateSnowflakeId();
    await execute(
      'INSERT INTO user_roles (id, user_id, role_id, project_id, assigned_by, assigned_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        data.userId,
        data.roleId,
        data.projectId ?? null,
        data.assignedBy,
        new Date().toISOString(),
        data.expiresAt?.toISOString() ?? null,
      ],
    );
    return (await this.getUserRoleById(id))!;
  }
  static async removeUserRole(id: string): Promise<boolean> {
    return (await execute('DELETE FROM user_roles WHERE id = ?', [id])).affectedRows > 0;
  }
  static async getUserRoleById(id: string): Promise<UserRole | undefined> {
    const row = await queryOne<DbUserRole>('SELECT * FROM user_roles WHERE id = ?', [id]);
    return row && mapUserRole(row);
  }
  static async getUserRoles(userId: string, projectId?: string): Promise<UserRole[]> {
    let sql =
      'SELECT * FROM user_roles WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)';
    const params: unknown[] = [userId];
    if (projectId !== undefined) {
      sql += ' AND (project_id = ? OR project_id IS NULL)';
      params.push(projectId);
    } else sql += ' AND project_id IS NULL';
    return (await query<DbUserRole[]>(`${sql} ORDER BY assigned_at DESC`, params)).map(mapUserRole);
  }
  static async checkPermission(
    userId: string,
    resourceType: ResourceType,
    action: ActionType,
    resourceId?: string,
    projectId?: string,
  ): Promise<PermissionCheckResult> {
    const roles = await this.getUserRoles(userId, projectId),
      applicableRules: PermissionRule[] = [];
    for (const userRole of roles) {
      const role = await this.getRoleById(userRole.roleId);
      if (role)
        for (const rule of role.permissions)
          if (
            rule.resourceType === resourceType &&
            rule.isActive &&
            (!rule.resourceId || rule.resourceId === '*' || rule.resourceId === resourceId)
          )
            applicableRules.push(rule);
    }
    applicableRules.sort((a, b) => b.priority - a.priority);
    const rule = applicableRules.find(
      (candidate) =>
        candidate.actions.includes(action) &&
        (!candidate.conditions ||
          this.evaluateConditions(candidate.conditions, {
            userId,
            resourceType,
            action,
            resourceId,
          })),
    );
    return {
      allowed: Boolean(rule),
      reason: rule ? `权限规则 "${rule.id}" 允许操作` : '没有找到允许此操作的权限规则',
      applicableRules,
    };
  }
  private static evaluateConditions(
    conditions: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    return Object.entries(conditions).every(([key, value]) => context[key] === value);
  }
  static async getUserPermissionsSummary(userId: string): Promise<{
    userId: string;
    roles: string[];
    permissions: string[];
    summary: { totalRoles: number; totalPermissions: number };
  }> {
    const userRoles = await this.getUserRoles(userId),
      permissions = new Set<string>();
    for (const userRole of userRoles) {
      const role = await this.getRoleById(userRole.roleId);
      role?.permissions.forEach((rule) =>
        rule.actions.forEach((action) => permissions.add(`${rule.resourceType}:${action}`)),
      );
    }
    return {
      userId,
      roles: userRoles.map((role) => role.roleId),
      permissions: [...permissions],
      summary: { totalRoles: userRoles.length, totalPermissions: permissions.size },
    };
  }
  static async getProjectUserRoles(projectId: string): Promise<UserRole[]> {
    return (
      await query<DbUserRole[]>(
        'SELECT * FROM user_roles WHERE project_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY assigned_at DESC',
        [projectId],
      )
    ).map(mapUserRole);
  }
}
