import { Request, Response, NextFunction } from 'express';
import { PermissionDatabase } from '../models/PermissionDatabase';
import { ResourceType, ActionType } from '../models/Permission';

// 检查权限的中间件
export const requirePermission = (
  resourceType: ResourceType,
  action: ActionType,
  resourceIdParam?: string, // 如果需要动态获取资源ID，传入参数名
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: '未认证用户',
        });
      }

      // 获取资源ID
      let resourceId: string | undefined;
      if (resourceIdParam) {
        resourceId = req.params[resourceIdParam];
      }

      // 获取项目ID（如果存在）
      let projectId: string | undefined;
      if (req.params.projectId) {
        projectId = req.params.projectId;
      }

      // 检查权限
      const result = await PermissionDatabase.checkPermission(
        userId,
        resourceType,
        action,
        resourceId,
        projectId,
      );

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: '权限不足',
          details: result.reason,
        });
      }

      // 权限检查通过，继续执行
      next();
    } catch (error) {
      console.error('权限检查中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '权限检查过程中发生错误',
      });
    }
  };
};

// 检查特定角色的中间件
export const requireRole = (requiredRoleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: '未认证用户',
        });
      }

      const userRoles = await PermissionDatabase.getUserRoles(userId);
      const roles = await Promise.all(
        userRoles.map((ur) => PermissionDatabase.getRoleById(ur.roleId)),
      );
      const hasRequiredRole = roles.some((role) => role?.name === requiredRoleName);

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          error: `需要 ${requiredRoleName} 角色才能执行此操作`,
        });
      }

      next();
    } catch (error) {
      console.error('角色检查中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '角色检查过程中发生错误',
      });
    }
  };
};

// 项目级别的权限检查
export const requireProjectPermission = (
  action: ActionType,
  projectIdParam: string = 'projectId',
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: '未认证用户',
        });
      }

      const projectId = String(req.params[projectIdParam] ?? '').trim();
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: '无效的项目ID',
        });
      }

      // 检查项目级别的权限
      const result = await PermissionDatabase.checkPermission(
        userId,
        ResourceType.PROJECT,
        action,
        projectId,
        projectId,
      );

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: '项目权限不足',
          details: result.reason,
        });
      }

      next();
    } catch (error) {
      console.error('项目权限检查中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '项目权限检查过程中发生错误',
      });
    }
  };
};
