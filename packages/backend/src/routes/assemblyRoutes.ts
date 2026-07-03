import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/database";
import { authenticateToken } from "../middleware/authMiddleware";
import { AppPageMenuModel } from "../models/AppPageMenu";
import { UserModel } from "../models/User";
import { generateSnowflakeId } from "../utils/snowflake";

const router: Router = Router();

router.use(authenticateToken);

const IdParamSchema = z.string().min(1);

const CreateMenuSchema = z.object({
  page_id: z.string().optional().nullable(),
  parent_id: z.string().nullable().optional(),
  menu_title: z.string().min(1).max(200),
  menu_icon: z.string().max(100).optional(),
  route_path: z.string().max(500).optional(),
  permission: z.string().max(100).optional(),
  sort_order: z.number().int().optional(),
});

const UpdateMenuSchema = z.object({
  menu_title: z.string().min(1).max(200).optional(),
  menu_icon: z.string().max(100).nullable().optional(),
  route_path: z.string().max(500).nullable().optional(),
  permission: z.string().max(100).nullable().optional(),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const BatchSortSchema = z.object({
  menus: z.array(
    z.object({
      id: z.string().min(1),
      parent_id: z.string().nullable().optional(),
      sort_order: z.number().int(),
    }),
  ),
});

/**
 * GET /api/v1/applications/:id/menus - 获取应用菜单树
 */
router.get("/:id/menus", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }

    // 验证应用存在
    const app = db.prepare("SELECT id FROM applications WHERE id = ?").get(parseId.data) as
      | Record<string, unknown>
      | undefined;
    if (!app) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    const tree = AppPageMenuModel.getMenuTree(parseId.data);

    res.json({
      success: true,
      data: tree,
      message: "获取菜单树成功",
    });
  } catch (e) {
    console.error("menus get error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * POST /api/v1/applications/:id/menus - 挂载页面到应用菜单
 */
router.post("/:id/menus", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }

    const body = CreateMenuSchema.parse(req.body);
    const appId = parseId.data;

    // 验证应用存在
    const app = db.prepare("SELECT id, title FROM applications WHERE id = ?").get(appId) as
      | Record<string, unknown>
      | undefined;
    if (!app) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    // 验证页面存在（仅在 page_id 不为空时）
    let pageName = body.menu_title;
    if (body.page_id) {
      const page = db.prepare("SELECT id, name FROM pages WHERE id = ?").get(body.page_id) as
        | Record<string, unknown>
        | undefined;
      if (!page) {
        return res.status(404).json({ success: false, error: "页面不存在" });
      }
      pageName = String(page.name);
    }

    // 自动生成 route_path（如果未提供）
    let routePath = body.route_path;
    if (!routePath && body.page_id) {
      const nameSlug = String(body.menu_title)
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");
      routePath = `/${nameSlug}-${String(body.page_id).substring(0, 8)}`;
    }

    const menu = AppPageMenuModel.create({
      application_id: appId,
      page_id: body.page_id || undefined,
      parent_id: body.parent_id,
      menu_title: body.menu_title,
      menu_icon: body.menu_icon,
      route_path: routePath,
      permission: body.permission,
      sort_order: body.sort_order,
    });

    const message = body.page_id
      ? `页面 "${pageName}" 已挂载到应用 "${String(app.title)}"`
      : `目录 "${body.menu_title}" 已添加到应用 "${String(app.title)}"`;

    res.status(201).json({
      success: true,
      data: menu,
      message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("menus create error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * PUT /api/v1/applications/:id/menus/:menuId - 更新菜单项
 */
router.put("/:id/menus/:menuId", (req: Request, res: Response) => {
  try {
    const parseMenuId = IdParamSchema.safeParse(req.params.menuId);
    if (!parseMenuId.success) {
      return res.status(400).json({ success: false, error: "无效的菜单 ID" });
    }

    const body = UpdateMenuSchema.parse(req.body);
    const menu = AppPageMenuModel.update(parseMenuId.data, body);

    if (!menu) {
      return res.status(404).json({ success: false, error: "菜单项不存在" });
    }

    res.json({
      success: true,
      data: menu,
      message: "菜单项更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("menus update error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * DELETE /api/v1/applications/:id/menus/:menuId - 从应用移除菜单项
 */
router.delete("/:id/menus/:menuId", (req: Request, res: Response) => {
  try {
    const parseMenuId = IdParamSchema.safeParse(req.params.menuId);
    if (!parseMenuId.success) {
      return res.status(400).json({ success: false, error: "无效的菜单 ID" });
    }

    const deleted = AppPageMenuModel.delete(parseMenuId.data);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "菜单项不存在" });
    }

    res.json({
      success: true,
      data: null,
      message: "菜单项已移除",
    });
  } catch (e) {
    console.error("menus delete error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * PATCH /api/v1/applications/:id/menus/sort - 批量排序
 */
router.patch("/:id/menus/sort", (req: Request, res: Response) => {
  try {
    const body = BatchSortSchema.parse(req.body);
    AppPageMenuModel.batchUpdateSort(body.menus);

    res.json({
      success: true,
      data: null,
      message: "排序更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("menus sort error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * POST /api/v1/applications/:id/publish - 发布应用
 */
router.post("/:id/publish", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }

    const appId = parseId.data;

    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(appId) as
      | Record<string, unknown>
      | undefined;
    if (!app) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    // 检查是否至少有一个菜单项
    const menuCount = db
      .prepare("SELECT COUNT(*) as count FROM app_page_menus WHERE application_id = ?")
      .get(appId) as { count: number };

    res.json({
      success: true,
      data: {
        published_at: new Date().toISOString(),
        version: "v1.0.0",
        menu_count: menuCount.count,
        preview_url: `/app-preview/${appId}`,
      },
      message: `应用 "${String(app.title)}" 发布成功`,
    });
  } catch (e) {
    console.error("publish error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

export default router;
