import { db } from "../config/database";
import {
  RoleType,
  ResourceType,
  ActionType,
  PermissionRule,
  Role,
  UserRole,
  PermissionCheckResult,
} from "./Permission";

export class PermissionDatabase {
  // 创建角色
  static async createRole(
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt" | "createdBy">,
    createdBy: number,
  ): Promise<Role> {
    const trans = db.transaction(() => {
      // 插入角色
      const roleStmt = db.prepare(`
        INSERT INTO roles (name, description, created_by) VALUES (?, ?, ?)
      `);
      const roleId = roleStmt.run(roleData.name, roleData.description, createdBy)
        .lastInsertRowid as number;

      // 插入权限规则并关联到角色
      for (const permission of roleData.permissions) {
        const permStmt = db.prepare(`
          INSERT INTO permission_rules (resource_type, resource_id, actions, conditions, priority, is_active) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const permId = permStmt.run(
          permission.resourceType,
          permission.resourceId,
          JSON.stringify(permission.actions),
          permission.conditions ? JSON.stringify(permission.conditions) : null,
          permission.priority,
          permission.isActive ? 1 : 0,
        ).lastInsertRowid as number;

        // 关联角色和权限
        const rolePermStmt = db.prepare(`
          INSERT INTO role_permissions (role_id, permission_rule_id) VALUES (?, ?)
        `);
        rolePermStmt.run(roleId, permId);
      }

      return roleId;
    });

    const roleId = trans();
    return this.getRoleById(roleId)!;
  }

  // 获取角色
  static async getRoleById(id: number): Promise<Role | undefined> {
    const roleStmt = db.prepare(`
      SELECT r.*, u.username as created_by_username 
      FROM roles r 
      LEFT JOIN users u ON r.created_by = u.id 
      WHERE r.id = ?
    `);
    const roleData = roleStmt.get(id) as any;

    if (!roleData) return undefined;

    // 获取角色的权限
    const permissionsStmt = db.prepare(`
      SELECT pr.* FROM permission_rules pr
      INNER JOIN role_permissions rp ON pr.id = rp.permission_rule_id
      WHERE rp.role_id = ? AND pr.is_active = 1
    `);
    const permissionsData = permissionsStmt.all(id) as any[];

    const permissions: PermissionRule[] = permissionsData.map((perm) => ({
      id: perm.id,
      resourceType: perm.resource_type,
      resourceId: perm.resource_id || undefined,
      actions: JSON.parse(perm.actions),
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

  // 获取所有角色
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

  // 更新角色
  static async updateRole(id: number, updates: Partial<Role>): Promise<Role | null> {
    const trans = db.transaction(() => {
      // 更新角色基本信息
      if (updates.name || updates.description) {
        const updateFields = [];
        const params = [];

        if (updates.name) {
          updateFields.push("name = ?");
          params.push(updates.name);
        }
        if (updates.description) {
          updateFields.push("description = ?");
          params.push(updates.description);
        }

        updateFields.push("updated_at = ?");
        params.push(new Date());
        params.push(id);

        const stmt = db.prepare(`UPDATE roles SET ${updateFields.join(", ")} WHERE id = ?`);
        stmt.run(...params);
      }

      // 如果有权限更新，替换所有权限
      if (updates.permissions) {
        // 删除旧的权限关联
        const delRolePerms = db.prepare("DELETE FROM role_permissions WHERE role_id = ?");
        delRolePerms.run(id);

        // 删除旧的权限规则
        const delPerms = db.prepare(`
          DELETE FROM permission_rules 
          WHERE id IN (
            SELECT permission_rule_id FROM role_permissions 
            WHERE role_id = ?
          )
        `);
        delPerms.run(id);

        // 插入新的权限规则并关联
        for (const permission of updates.permissions) {
          const permStmt = db.prepare(`
            INSERT INTO permission_rules (resource_type, resource_id, actions, conditions, priority, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const permId = permStmt.run(
            permission.resourceType,
            permission.resourceId,
            JSON.stringify(permission.actions),
            permission.conditions ? JSON.stringify(permission.conditions) : null,
            permission.priority,
            permission.isActive ? 1 : 0,
          ).lastInsertRowid as number;

          const rolePermStmt = db.prepare(`
            INSERT INTO role_permissions (role_id, permission_rule_id) VALUES (?, ?)
          `);
          rolePermStmt.run(id, permId);
        }
      }

      return id;
    });

    try {
      trans();
      return this.getRoleById(id);
    } catch (error) {
      console.error("更新角色失败:", error);
      return null;
    }
  }

  // 删除角色
  static async deleteRole(id: number): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM roles WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 分配角色给用户
  static async assignRole(userRoleData: Omit<UserRole, "id" | "assignedAt">): Promise<UserRole> {
    const stmt = db.prepare(`
      INSERT INTO user_roles (user_id, role_id, project_id, assigned_by, assigned_at, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userRoleData.userId,
      userRoleData.roleId,
      userRoleData.projectId || null,
      userRoleData.assignedBy,
      new Date(),
      userRoleData.expiresAt || null,
    );

    return this.getUserRoleById(result.lastInsertRowid as number)!;
  }

  // 移除用户角色
  static async removeUserRole(id: number): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM user_roles WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 获取用户角色详情
  static async getUserRoleById(id: number): Promise<UserRole | undefined> {
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
      projectId: userRole.project_id || undefined,
      assignedBy: userRole.assigned_by,
      assignedAt: new Date(userRole.assigned_at),
      expiresAt: userRole.expires_at ? new Date(userRole.expires_at) : undefined,
    };
  }

  // 获取用户的所有角色
  static async getUserRoles(userId: number, projectId?: number): Promise<UserRole[]> {
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
      projectId: ur.project_id || undefined,
      assignedBy: ur.assigned_by,
      assignedAt: new Date(ur.assigned_at),
      expiresAt: ur.expires_at ? new Date(ur.expires_at) : undefined,
    }));
  }

  // 检查用户权限
  static async checkPermission(
    userId: number,
    resourceType: ResourceType,
    action: ActionType,
    resourceId?: string,
    projectId?: number,
  ): Promise<PermissionCheckResult> {
    // 获取用户角色
    const userRoles = await this.getUserRoles(userId, projectId);
    const applicableRules: PermissionRule[] = [];

    // 收集所有相关的权限规则
    for (const userRole of userRoles) {
      const role = await this.getRoleById(userRole.roleId);
      if (role) {
        for (const rule of role.permissions) {
          if (rule.resourceType === resourceType && rule.isActive) {
            // 检查资源ID匹配
            if (!rule.resourceId || rule.resourceId === "*" || rule.resourceId === resourceId) {
              applicableRules.push(rule);
            }
          }
        }
      }
    }

    // 按优先级排序
    applicableRules.sort((a, b) => b.priority - a.priority);

    // 检查是否有允许的操作权限
    let allowed = false;
    let reason = "";

    for (const rule of applicableRules) {
      if (rule.actions.includes(action)) {
        // 检查条件（如果有）
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

  // 评估条件表达式
  private static evaluateConditions(conditions: Record<string, any>, context: any): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // 获取用户权限摘要
  static async getUserPermissionsSummary(userId: number): Promise<any> {
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

  // 获取项目的用户角色
  static async getProjectUserRoles(projectId: number): Promise<UserRole[]> {
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
      projectId: ur.project_id,
      assignedBy: ur.assigned_by,
      assignedAt: new Date(ur.assigned_at),
      expiresAt: ur.expires_at ? new Date(ur.expires_at) : undefined,
    }));
  }
}
