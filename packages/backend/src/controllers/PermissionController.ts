import { Request, Response } from "express";
import { PermissionDatabase } from "../models/PermissionDatabase";
import { RoleSchema, AssignRoleSchema, CheckPermissionSchema } from "../models/Permission";
import { UserDatabase } from "../models/User";

function readRequiredId(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";
  return id || null;
}

export class PermissionController {
  static async getAllRoles(_req: Request, res: Response) {
    try {
      const roles = await PermissionDatabase.getAllRoles();
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "获取角色列表失败", message: error.message });
    }
  }

  static async createRole(req: Request, res: Response) {
    try {
      const validatedData = RoleSchema.parse(req.body);
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      const user = await UserDatabase.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "用户不存在" });
      }

      const newRole = await PermissionDatabase.createRole(validatedData, userId);
      res.status(201).json({ success: true, data: newRole, message: "角色创建成功" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "创建角色失败", message: error.message });
      }
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const roleId = readRequiredId(req.params.roleId);
      if (!roleId) {
        return res.status(400).json({ success: false, error: "无效的角色ID" });
      }

      const validatedData = RoleSchema.partial().parse(req.body);
      const updatedRole = await PermissionDatabase.updateRole(roleId, validatedData);
      if (!updatedRole) {
        return res.status(404).json({ success: false, error: "角色不存在" });
      }

      res.json({ success: true, data: updatedRole, message: "角色更新成功" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "更新角色失败", message: error.message });
      }
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const roleId = readRequiredId(req.params.roleId);
      if (!roleId) {
        return res.status(400).json({ success: false, error: "无效的角色ID" });
      }

      const role = await PermissionDatabase.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({ success: false, error: "角色不存在" });
      }

      const deleted = await PermissionDatabase.deleteRole(roleId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "角色不存在" });
      }

      res.json({ success: true, message: "角色删除成功" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "删除角色失败", message: error.message });
    }
  }

  static async assignRoleToUser(req: Request, res: Response) {
    try {
      const validatedData = AssignRoleSchema.parse(req.body);
      const assignerId = req.userId;
      if (!assignerId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      const user = await UserDatabase.findById(validatedData.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "用户不存在" });
      }

      const role = await PermissionDatabase.getRoleById(validatedData.roleId);
      if (!role) {
        return res.status(404).json({ success: false, error: "角色不存在" });
      }

      const assignPermission = await PermissionDatabase.checkPermission(
        assignerId,
        "role",
        "assign",
        validatedData.roleId,
      );

      if (!assignPermission.allowed) {
        return res.status(403).json({ success: false, error: "没有权限分配角色" });
      }

      const userRole = await PermissionDatabase.assignRole({
        ...validatedData,
        assignedBy: assignerId,
      });

      res.status(201).json({ success: true, data: userRole, message: "角色分配成功" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "分配角色失败", message: error.message });
      }
    }
  }

  static async removeUserRole(req: Request, res: Response) {
    try {
      const userRoleId = readRequiredId(req.params.userRoleId);
      if (!userRoleId) {
        return res.status(400).json({ success: false, error: "无效的用户角色ID" });
      }

      const removerId = req.userId;
      if (!removerId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      const userRole = await PermissionDatabase.getUserRoleById(userRoleId);
      if (!userRole) {
        return res.status(404).json({ success: false, error: "用户角色不存在" });
      }

      const removePermission = await PermissionDatabase.checkPermission(
        removerId,
        "role",
        "remove",
        userRole.roleId,
      );

      if (!removePermission.allowed) {
        return res.status(403).json({ success: false, error: "没有权限移除角色" });
      }

      const removed = await PermissionDatabase.removeUserRole(userRoleId);
      if (!removed) {
        return res.status(404).json({ success: false, error: "用户角色不存在" });
      }

      res.json({ success: true, message: "角色移除成功" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "移除角色失败", message: error.message });
    }
  }

  static async checkUserPermission(req: Request, res: Response) {
    try {
      const validatedData = CheckPermissionSchema.parse(req.body);
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      const result = await PermissionDatabase.checkPermission(
        userId,
        validatedData.resourceType,
        validatedData.action,
        validatedData.resourceId,
        validatedData.projectId,
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "权限检查失败", message: error.message });
      }
    }
  }

  static async getUserPermissionsSummary(req: Request, res: Response) {
    try {
      const userId = readRequiredId(req.params.userId);
      if (!userId) {
        return res.status(400).json({ success: false, error: "无效的用户ID" });
      }

      const currentUserId = req.userId;
      if (!currentUserId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      if (currentUserId !== userId) {
        const viewPermission = await PermissionDatabase.checkPermission(
          currentUserId,
          "user",
          "view_permissions",
          userId,
        );

        if (!viewPermission.allowed) {
          return res.status(403).json({ success: false, error: "没有权限查看他人权限信息" });
        }
      }

      const summary = await PermissionDatabase.getUserPermissionsSummary(userId);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "获取权限摘要失败", message: error.message });
    }
  }

  static async getUserRoles(req: Request, res: Response) {
    try {
      const userId = readRequiredId(req.params.userId);
      if (!userId) {
        return res.status(400).json({ success: false, error: "无效的用户ID" });
      }

      const currentUserId = req.userId;
      if (!currentUserId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      if (currentUserId !== userId) {
        const viewPermission = await PermissionDatabase.checkPermission(
          currentUserId,
          "user",
          "view_roles",
          userId,
        );

        if (!viewPermission.allowed) {
          return res.status(403).json({ success: false, error: "没有权限查看他人角色信息" });
        }
      }

      const userRoles = await PermissionDatabase.getUserRoles(userId);
      res.json({ success: true, data: userRoles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "获取用户角色失败", message: error.message });
    }
  }

  static async getProjectUserRoles(req: Request, res: Response) {
    try {
      const projectId = readRequiredId(req.params.projectId);
      if (!projectId) {
        return res.status(400).json({ success: false, error: "无效的项目ID" });
      }

      const currentUserId = req.userId;
      if (!currentUserId) {
        return res.status(401).json({ success: false, error: "未认证用户" });
      }

      const viewPermission = await PermissionDatabase.checkPermission(
        currentUserId,
        "project",
        "read",
        projectId,
        projectId,
      );

      if (!viewPermission.allowed) {
        return res.status(403).json({ success: false, error: "没有权限查看项目用户角色" });
      }

      const userRoles = await PermissionDatabase.getProjectUserRoles(projectId);
      res.json({ success: true, data: userRoles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "获取项目用户角色失败", message: error.message });
    }
  }
}