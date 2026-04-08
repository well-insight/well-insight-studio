import { db } from "../config/database";
import {
  ResourceType,
  ActionType,
  PermissionRule,
  PermissionRuleInput,
  Role,
  RoleInput,
  UserRole,
  PermissionCheckResult,
} from "./Permission";
import { generateSnowflakeId } from "../utils/snowflake";

export class PermissionDatabase {
  static async createRole(
    roleData: RoleInput,
    createdBy: string,
  ): Promise<Role> {
    const trans = db.transaction(() => {
      const roleId = generateSnowflakeId();
      const roleStmt = db.prepare(`
        INSERT INTO roles (id, name, description, created_by) VALUES (?, ?, ?, ?)
      `);
      roleStmt.run(roleId, roleData.name, roleData.description ?? null, createdBy);

      for (const permission of roleData.permissions) {
        const permId = generateSnowflakeId();
        const permStmt = db.prepare(`
          INSERT INTO permission_rules (id, resource_type, resource_id, actions, conditions, priority, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        permStmt.run(
          permId,
          permission.resourceType,
          permission.resourceId ?? null,
          JSON.stringify(permission.actions),
          permission.conditions ? JSON.stringify(permission.conditions) : null,
          permission.priority,
          permission.isActive ? 1 : 0,
        );

        const rolePermStmt = db.prepare(`
          INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)
        `);
        rolePermStmt.run(generateSnowflakeId(), roleId, permId);
      }

      return roleId;
    });

    const roleId = trans();
    const created = await this.getRoleById(roleId);
    if (!created) {
      throw new Error("角色创建失败");
    }
    return created;
  }

  static async getRoleById(id: string): Promise<Role | undefined> {
    const roleStmt = db.prepare(`
      SELECT r.*, u.username as created_by_username 
      FROM roles r 
      LEFT JOIN users u ON r.created_by = u.id 
      WHERE r.id = ?
    `);
    const roleData = roleStmt.get(id) as any;
    if (!roleData) return undefined;

    const permissionsStmt = db.prepare(`
      SELECT pr.* FROM permission_rules pr
      INNER JOIN role_permissions rp ON pr.id = rp.permission_rule_id
      WHERE rp.role_id = ? AND pr.is_active = 1
    `);
    const permissionsData = permissionsStmt.all(id) as any[];

    const permissions: PermissionRule[] = permissionsData.map((perm) => ({
      id: perm.id,
      resourceType: perm.resource_type,
      resourceId: perm.resource_id ?? undefined,
      actions: JSON.parse(perm.actions) as ActionType[],
      conditions: perm.conditions ? JSON.parse(perm.conditions) : undefined,
      priority: perm.priority,
      isActive: Boolean(perm.is_active),
      createdAt: new Date(perm.created_at),
      updatedAt: new Date(perm.updated_at),
    }));

    return {
      id: roleData.id,
      name: roleData.name,
      description: roleData.description,
      permissions,
      createdAt: new Date(roleData.created_at),
      updatedAt: new Date(roleData.updated_at),
      createdBy: roleData.created_by,
    };
  }

  static async getAllRoles(): Promise<Role[]> {
    const rolesStmt = db.prepare("SELECT * FROM roles ORDER BY created_at DESC");
    const rolesData = rolesStmt.all() as any[];

    const roles: Role[] = [];
    for (const roleData of rolesData) {
      const role = await this.getRoleById(roleData.id);
      if (role) roles.push(role);
    }

    return roles;
  }

  static async updateRole(id: string, updates: Partial<RoleInput>): Promise<Role | null> {
    const trans = db.transaction(() => {
      if (updates.name || updates.description) {
        const updateFields: string[] = [];
        const params: unknown[] = [];

        if (updates.name) {
          updateFields.push("name = ?");
          params.push(updates.name);
        }
        if (updates.description) {
          updateFields.push("description = ?");
          params.push(updates.description);
        }

        updateFields.push("updated_at = ?");
        params.push(new Date().toISOString());
        params.push(id);

        const stmt = db.prepare(`UPDATE roles SET ${updateFields.join(", ")} WHERE id = ?`);
        stmt.run(...params);
      }

      if (updates.permissions) {
        const rolePermissionRows = db
          .prepare("SELECT permission_rule_id FROM role_permissions WHERE role_id = ?")
          .all(id) as Array<{ permission_rule_id: string }>;

        const delRolePerms = db.prepare("DELETE FROM role_permissions WHERE role_id = ?");
        delRolePerms.run(id);

        const delPerm = db.prepare("DELETE FROM permission_rules WHERE id = ?");
        for (const row of rolePermissionRows) {
          delPerm.run(row.permission_rule_id);
        }

        for (const permission of updates.permissions as PermissionRuleInput[]) {
          const permId = generateSnowflakeId();
          const permStmt = db.prepare(`
            INSERT INTO permission_rules (id, resource_type, resource_id, actions, conditions, priority, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          permStmt.run(
            permId,
            permission.resourceType,
            permission.resourceId ?? null,
            JSON.stringify(permission.actions),
            permission.conditions ? JSON.stringify(permission.conditions) : null,
            permission.priority,
            permission.isActive ? 1 : 0,
          );

          const rolePermStmt = db.prepare(`
            INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)
          `);
          rolePermStmt.run(generateSnowflakeId(), id, permId);
        }
      }

      return id;
    });

    try {
      trans();
      return (await this.getRoleById(id)) ?? null;
    } catch (error) {
      console.error("更新角色失败:", error);
      return null;
    }
  }

  static async deleteRole(id: string): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM roles WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static async assignRole(userRoleData: Omit<UserRole, "id" | "assignedAt">): Promise<UserRole> {
    const id = generateSnowflakeId();
    const stmt = db.prepare(`
      INSERT INTO user_roles (id, user_id, role_id, project_id, assigned_by, assigned_at, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userRoleData.userId,
      userRoleData.roleId,
      userRoleData.projectId ?? null,
      userRoleData.assignedBy,
      new Date().toISOString(),
      userRoleData.expiresAt?.toISOString() ?? null,
    );

    const created = await this.getUserRoleById(id);
    if (!created) {
      throw new Error("用户角色创建失败");
    }
    return created;
  }

  static async removeUserRole(id: string): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM user_roles WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static async getUserRoleById(id: string): Promise<UserRole | undefined> {
    const stmt = db.prepare(`
      SELECT ur.*, u1.username as assigned_by_username, u2.username as user_username
      FROM user_roles ur
      LEFT JOIN users u1 ON ur.assigned_by = u1.id
      LEFT JOIN users u2 ON ur.user_id = u2.id
      WHERE ur.id = ?
    `);
    const userRole = stmt.get(id) as any;

    if (!userRole) return undefined;

    return {
      id: userRole.id,
      userId: userRole.user_id,
      roleId: userRole.role_id,
      projectId: userRole.project_id ?? undefined,
      assignedBy: userRole.assigned_by,
      assignedAt: new Date(userRole.assigned_at),
      expiresAt: userRole.expires_at ? new Date(userRole.expires_at) : undefined,
    };
  }

  static async getUserRoles(userId: string, projectId?: string): Promise<UserRole[]> {
    let query = `
      SELECT * FROM user_roles 
      WHERE user_id = ? 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `;
    const params = [userId];

    if (projectId !== undefined) {
      query += " AND (project_id = ? OR project_id IS NULL)";
      params.push(projectId);
    } else {
      query += " AND project_id IS NULL";
    }

    query += " ORDER BY assigned_at DESC";

    const stmt = db.prepare(query);
    const userRoles = stmt.all(...params) as any[];

    return userRoles.map((ur) => ({
      id: ur.id,
      userId: ur.user_id,
      roleId: ur.role_id,
      projectId: ur.project_id ?? undefined,
      assignedBy: ur.assigned_by,
      assignedAt: new Date(ur.assigned_at),
      expiresAt: ur.expires_at ? new Date(ur.expires_at) : undefined,
    }));
  }

  static async checkPermission(
    userId: string,
    resourceType: ResourceType,
    action: ActionType,
    resourceId?: string,
    projectId?: string,
  ): Promise<PermissionCheckResult> {
    const userRoles = await this.getUserRoles(userId, projectId);
    const applicableRules: PermissionRule[] = [];

    for (const userRole of userRoles) {
      const role = await this.getRoleById(userRole.roleId);
      if (role) {
        for (const rule of role.permissions) {
          if (rule.resourceType === resourceType && rule.isActive) {
            if (!rule.resourceId || rule.resourceId === "*" || rule.resourceId === resourceId) {
              applicableRules.push(rule);
            }
          }
        }
      }
    }

    applicableRules.sort((a, b) => b.priority - a.priority);

    let allowed = false;
    let reason = "";

    for (const rule of applicableRules) {
      if (rule.actions.includes(action)) {
        if (
          rule.conditions &&
          !this.evaluateConditions(rule.conditions, { userId, resourceType, action, resourceId })
        ) {
          continue;
        }

        allowed = true;
        reason = `权限规则 "${rule.id}" 允许操作`;
        break;
      }
    }

    if (!allowed) {
      reason = "没有找到允许此操作的权限规则";
    }

    return {
      allowed,
      reason,
      applicableRules,
    };
  }

  private static evaluateConditions(conditions: Record<string, any>, context: any): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  static async getUserPermissionsSummary(userId: string): Promise<any> {
    const userRoles = await this.getUserRoles(userId);
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      const role = await this.getRoleById(userRole.roleId);
      if (role) {
        for (const rule of role.permissions) {
          for (const action of rule.actions) {
            permissions.add(`${rule.resourceType}:${action}`);
          }
        }
      }
    }

    return {
      userId,
      roles: userRoles.map((ur) => ur.roleId),
      permissions: Array.from(permissions),
      summary: {
        totalRoles: userRoles.length,
        totalPermissions: permissions.size,
      },
    };
  }

  static async getProjectUserRoles(projectId: string): Promise<UserRole[]> {
    const stmt = db.prepare(`
      SELECT * FROM user_roles 
      WHERE project_id = ? 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY assigned_at DESC
    `);
    const userRoles = stmt.all(projectId) as any[];

    return userRoles.map((ur) => ({
      id: ur.id,
      userId: ur.user_id,
      roleId: ur.role_id,
      projectId: ur.project_id ?? undefined,
      assignedBy: ur.assigned_by,
      assignedAt: new Date(ur.assigned_at),
      expiresAt: ur.expires_at ? new Date(ur.expires_at) : undefined,
    }));
  }
}
