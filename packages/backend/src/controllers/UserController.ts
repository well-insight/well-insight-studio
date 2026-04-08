import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";

export class UserController {
  static list(_req: Request, res: Response): void {
    try {
      const users = UserModel.findAll();
      res.json({
        success: true,
        data: users,
        message: "获取用户列表成功",
      });
    } catch (error) {
      console.error("UserController.list error:", error);
      res.status(500).json({
        success: false,
        error: "获取用户列表失败",
      });
    }
  }

  /** 管理员重置指定用户密码 */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        res.status(400).json({ success: false, error: "无效的用户 ID" });
        return;
      }

      const { password } = req.body as { password?: string };
      if (!password || typeof password !== "string") {
        res.status(400).json({ success: false, error: "请在 JSON 中提供字段 password（新密码）" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ success: false, error: "新密码至少 6 位" });
        return;
      }

      const target = UserModel.findByPk(id);
      if (!target) {
        res.status(404).json({ success: false, error: "用户不存在" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const ok = UserModel.updatePasswordHash(id, passwordHash);
      if (!ok) {
        res.status(500).json({ success: false, error: "更新密码失败" });
        return;
      }

      res.json({
        success: true,
        message: "密码已重置",
        data: {
          id: target.id,
          email: target.email,
          username: target.username,
          display_name: target.display_name ?? null,
        },
      });
    } catch (error) {
      console.error("UserController.resetPassword error:", error);
      res.status(500).json({
        success: false,
        error: "重置密码失败",
      });
    }
  }
}
