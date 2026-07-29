import { z } from "zod";
import { query } from "../config/database";

export const ResourceType = {
  PROJECT: "project",
  DATASET: "dataset",
  WORKFLOW: "workflow",
  ROLE: "role",
  USER: "user",
} as const;
export const ResourceTypeSchema = z.enum([
  ResourceType.PROJECT,
  ResourceType.DATASET,
  ResourceType.WORKFLOW,
  ResourceType.ROLE,
  ResourceType.USER,
]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const ActionType = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  EXECUTE: "execute",
  IMPORT: "import",
  EXPORT: "export",
  ASSIGN: "assign",
  REMOVE: "remove",
  VIEW_PERMISSIONS: "view_permissions",
  VIEW_ROLES: "view_roles",
} as const;
export const ActionTypeSchema = z.enum([
  ActionType.READ,
  ActionType.WRITE,
  ActionType.DELETE,
  ActionType.EXECUTE,
  ActionType.IMPORT,
  ActionType.EXPORT,
  ActionType.ASSIGN,
  ActionType.REMOVE,
  ActionType.VIEW_PERMISSIONS,
  ActionType.VIEW_ROLES,
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export type RoleType = string;

export interface PermissionRule {
  id: string;
  resourceType: ResourceType;
  resourceId?: string;
  actions: ActionType[];
  conditions?: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  projectId?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  applicableRules: PermissionRule[];
}

const PermissionRuleInputSchema = z.object({
  resourceType: ResourceTypeSchema,
  resourceId: z.string().min(1).optional(),
  actions: z.array(ActionTypeSchema).min(1),
  conditions: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type PermissionRuleInput = z.infer<typeof PermissionRuleInputSchema>;

export const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(PermissionRuleInputSchema).default([]),
});
export type RoleInput = z.infer<typeof RoleSchema>;

export const AssignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  projectId: z.string().min(1).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const CheckPermissionSchema = z.object({
  resourceType: ResourceTypeSchema,
  action: ActionTypeSchema,
  resourceId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

type PermissionRow = {
  resource_type: ResourceType;
  actions: string;
};

export class PermissionModel {
  static async getUserPermissionsForResource(
    userId: string,
    resourceType: ResourceType,
  ): Promise<Array<{ resource_type: ResourceType; actions: ActionType[] }>> {
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
    const rows = await query<PermissionRow[]>(sql, [userId, resourceType]);

    return rows.map((row) => ({
      resource_type: row.resource_type,
      actions: JSON.parse(row.actions) as ActionType[],
    }));
  }

  static async getUserPermissionsForResourceInstance(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<ActionType[]> {
    const allActions = new Set<ActionType>();
    const genericPerms = await this.getUserPermissionsForResource(userId, resourceType);

    for (const perm of genericPerms) {
      perm.actions.forEach((action) => allActions.add(action));
    }

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
    const instanceRows = await query<Array<{ actions: string }>>(sql, [userId, resourceType, resourceId]);

    for (const row of instanceRows) {
      (JSON.parse(row.actions) as ActionType[]).forEach((action) => allActions.add(action));
    }

    return Array.from(allActions);
  }
}
