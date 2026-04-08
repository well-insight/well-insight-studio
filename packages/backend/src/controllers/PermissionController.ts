import { Request, Response } from 'express';
import { PermissionDatabase } from '../models/PermissionDatabase';
import { RoleSchema, AssignRoleSchema, CheckPermissionSchema } from '../models/Permission';
import { UserDatabase } from '../models/User';

export class PermissionController {
  // 获取所有角色
  static async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await PermissionDatabase.getAllRoles();
      res.json({
        success: true,
        data: roles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '获取角色列表失败',
        message: error.message
      });
    }
  }

  // 创建角色
  static async createRole(req: Request, res: Response) {
    try {
      const validatedData = RoleSchema.parse(req.body);
      const userId = (req as any).userId;

      // 验证创建者是否存在
      const user = await UserDatabase.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const newRole = await PermissionDatabase.createRole(validatedData, userId);
      
      res.status(201).json({
        success: true,
        data: newRole,
        message: '角色创建成功'
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: '数据验证失败',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: '创建角色失败',
          message: error.message
        });
      }
    }
  }

  // 更新角色
  static async updateRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const roleIdNum = parseInt(roleId);
      if (isNaN(roleIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的角色ID'
        });
      }

      const validatedData = RoleSchema.partial().parse(req.body);

      const updatedRole = await PermissionDatabase.updateRole(roleIdNum, validatedData);
      if (!updatedRole) {
        return res.status(404).json({
          success: false,
          error: '角色不存在'
        });
      }

      res.json({
        success: true,
        data: updatedRole,
        message: '角色更新成功'
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: '数据验证失败',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: '更新角色失败',
          message: error.message
        });
      }
    }
  }

  // 删除角色
  static async deleteRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const roleIdNum = parseInt(roleId);
      if (isNaN(roleIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的角色ID'
        });
      }

      // 检查角色是否存在
      const role = await PermissionDatabase.getRoleById(roleIdNum);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: '角色不存在'
        });
      }

      const deleted = await PermissionDatabase.deleteRole(roleIdNum);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: '角色不存在'
        });
      }

      res.json({
        success: true,
        message: '角色删除成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '删除角色失败',
        message: error.message
      });
    }
  }

  // 分配角色给用户
  static async assignRoleToUser(req: Request, res: Response) {
    try {
      const validatedData = AssignRoleSchema.parse(req.body);
      const assignerId = (req as any).userId;

      // 验证用户和角色是否存在
      const user = await UserDatabase.findById(validatedData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const role = await PermissionDatabase.getRoleById(validatedData.roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: '角色不存在'
        });
      }

      // 检查分配者是否有权限分配角色
      const assignPermission = await PermissionDatabase.checkPermission(
        assignerId,
        'role',
        'assign',
        validatedData.roleId.toString()
      );

      if (!assignPermission.allowed) {
        return res.status(403).json({
          success: false,
          error: '没有权限分配角色'
        });
      }

      const userRole = await PermissionDatabase.assignRole({
        ...validatedData,
        assignedBy: assignerId
      });

      res.status(201).json({
        success: true,
        data: userRole,
        message: '角色分配成功'
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: '数据验证失败',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: '分配角色失败',
          message: error.message
        });
      }
    }
  }

  // 移除用户角色
  static async removeUserRole(req: Request, res: Response) {
    try {
      const { userRoleId } = req.params;
      const userRoleIdNum = parseInt(userRoleId);
      if (isNaN(userRoleIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的用户角色ID'
        });
      }

      const removerId = (req as any).userId;

      // 获取要移除的角色信息
      const userRole = await PermissionDatabase.getUserRoleById(userRoleIdNum);
      if (!userRole) {
        return res.status(404).json({
          success: false,
          error: '用户角色不存在'
        });
      }

      // 检查移除者是否有权限移除角色
      const removePermission = await PermissionDatabase.checkPermission(
        removerId,
        'role',
        'remove',
        userRole.roleId.toString()
      );

      if (!removePermission.allowed) {
        return res.status(403).json({
          success: false,
          error: '没有权限移除角色'
        });
      }

      const removed = await PermissionDatabase.removeUserRole(userRoleIdNum);
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: '用户角色不存在'
        });
      }

      res.json({
        success: true,
        message: '角色移除成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '移除角色失败',
        message: error.message
      });
    }
  }

  // 检查用户权限
  static async checkUserPermission(req: Request, res: Response) {
    try {
      const validatedData = CheckPermissionSchema.parse(req.body);
      const userId = (req as any).userId;

      // 获取项目ID（如果存在）
      let projectId: number | undefined;
      if (req.body.projectId) {
        projectId = parseInt(req.body.projectId);
      }

      const result = await PermissionDatabase.checkPermission(
        userId,
        validatedData.resourceType,
        validatedData.action,
        validatedData.resourceId,
        projectId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: '数据验证失败',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: '权限检查失败',
          message: error.message
        });
      }
    }
  }

  // 获取用户权限摘要
  static async getUserPermissionsSummary(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的用户ID'
        });
      }

      const currentUserId = (req as any).userId;

      // 检查是否有查看他人权限的权限
      if (currentUserId !== userIdNum) {
        const viewPermission = await PermissionDatabase.checkPermission(
          currentUserId,
          'user',
          'view_permissions',
          userId
        );

        if (!viewPermission.allowed) {
          return res.status(403).json({
            success: false,
            error: '没有权限查看他人权限信息'
          });
        }
      }

      const summary = await PermissionDatabase.getUserPermissionsSummary(userIdNum);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '获取权限摘要失败',
        message: error.message
      });
    }
  }

  // 获取用户角色列表
  static async getUserRoles(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的用户ID'
        });
      }

      const currentUserId = (req as any).userId;

      // 检查权限
      if (currentUserId !== userIdNum) {
        const viewPermission = await PermissionDatabase.checkPermission(
          currentUserId,
          'user',
          'view_roles',
          userId
        );

        if (!viewPermission.allowed) {
          return res.status(403).json({
            success: false,
            error: '没有权限查看他人角色信息'
          });
        }
      }

      const userRoles = await PermissionDatabase.getUserRoles(userIdNum);
      
      res.json({
        success: true,
        data: userRoles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '获取用户角色失败',
        message: error.message
      });
    }
  }

  // 获取项目用户角色
  static async getProjectUserRoles(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const projectIdNum = parseInt(projectId);
      if (isNaN(projectIdNum)) {
        return res.status(400).json({
          success: false,
          error: '无效的项目ID'
        });
      }

      const currentUserId = (req as any).userId;

      // 检查是否有查看项目用户角色的权限
      const viewPermission = await PermissionDatabase.checkPermission(
        currentUserId,
        'project',
        'read',
        projectId,
        projectIdNum
      );

      if (!viewPermission.allowed) {
        return res.status(403).json({
          success: false,
          error: '没有权限查看项目用户角色'
        });
      }

      const userRoles = await PermissionDatabase.getProjectUserRoles(projectIdNum);
      
      res.json({
        success: true,
        data: userRoles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '获取项目用户角色失败',
        message: error.message
      });
    }
  }
}