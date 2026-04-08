// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthService } from '../services/AuthService';
import { ActionType, ResourceType } from '../models/Permission';

// 为 Express Request 对象扩展属性
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access Denied: No Token Provided!' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid Token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

/** 需已登录且 users.role 为 admin */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  try {
    const user = await UserModel.findById(req.userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, error: '需要管理员权限' });
      return;
    }
    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    res.status(500).json({ success: false, error: '权限校验失败' });
  }
};

/**
 * 检查权限的中间件工厂
 * @param resourceType - 资源类型，例如 'project'
 * @param action - 动作，例如 'read', 'write'
 * @param resourceIdFromParam - 从哪个 URL 参数获取资源ID，默认为 'id'
 */
export const requirePermission = (
  resourceType: ResourceType,
  action: ActionType,
  resourceIdFromParam: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      // 理论上不会发生，因为 requirePermission 应该在 authenticateToken 之后使用
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceId = req.params[resourceIdFromParam];

    try {
      const hasPermission = await AuthService.checkPermission(
        req.userId,
        resourceType,
        action,
        resourceId
      );

      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient Permissions' });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal Server Error during permission check' });
    }
  };
};