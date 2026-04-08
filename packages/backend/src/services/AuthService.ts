// src/services/AuthService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel, User } from "../models/User";
import { PermissionModel } from "../models/Permission";

interface LoginResult {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<User, "password_hash">;
}

export class AuthService {
  static async login(account: string, password: string): Promise<LoginResult> {
    const user = await UserModel.findByEmailOrUsername(account.trim());
    if (!user) {
      return { success: false, message: "用户不存在" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, message: "密码错误" };
    }

    if (!user.is_active) {
      return { success: false, message: "账户已被禁用" };
    }

    // 更新最后登录时间
    await UserModel.updateLastLogin(user.id);

    // 生成 JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" },
    );

    const userWithoutPassword = (({ password_hash, ...rest }) => rest)(user as any);

    return {
      success: true,
      message: "登录成功",
      token,
      user: userWithoutPassword,
    };
  }

  static async checkPermission(
    userId: number,
    resourceType: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    let availableActions: string[];
    if (resourceId) {
      availableActions = await PermissionModel.getUserPermissionsForResourceInstance(
        userId,
        resourceType,
        resourceId,
      );
    } else {
      const perms = await PermissionModel.getUserPermissionsForResource(userId, resourceType);
      availableActions = [];
      for (const perm of perms) {
        availableActions.push(...JSON.parse(perm.actions));
      }
    }

    return availableActions.includes(action);
  }
}
