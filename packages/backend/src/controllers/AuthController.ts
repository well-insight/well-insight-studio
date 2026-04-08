// src/controllers/AuthController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AuthService } from "../services/AuthService";
import { UserModel, User } from "../models/User";

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as { account?: string; email?: string; password?: string };
      const password = body.password;
      const account = (typeof body.account === "string" ? body.account : body.email ?? "").trim();

      if (!account || !password) {
        res.status(400).json({ error: "账号（邮箱或用户名）和密码不能为空" });
        return;
      }

      const result = await AuthService.login(account, password);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "内部服务器错误" });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        email?: string;
        username?: string;
        password?: string;
        display_name?: string;
      };
      const { email, username, password } = body;

      if (!email || !username || !password) {
        res.status(400).json({ error: "邮箱、用户名和密码不能为空" });
        return;
      }

      const displayRaw = typeof body.display_name === "string" ? body.display_name.trim() : "";
      const display_name = displayRaw || String(username).trim();

      // 检查用户是否已存在
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "该邮箱已被注册" });
        return;
      }

      // 密码加密
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 创建用户 (默认角色为 'user')
      const userId = await UserModel.create({
        email,
        username,
        display_name,
        password_hash: hashedPassword,
        role: "user",
        is_active: true,
      });

      const newUser = await UserModel.findById(userId);
      if (!newUser) {
        res.status(500).json({ error: "用户创建失败" });
        return;
      }

      // 登录新用户并返回token
      const loginResult = await AuthService.login(email, password);
      if (loginResult.success) {
        res.status(201).json(loginResult);
      } else {
        res.status(500).json({ error: "注册后自动登录失败" });
      }
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "内部服务器错误" });
    }
  }
}
