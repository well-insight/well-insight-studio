import { Request, Response } from "express";
import { z } from "zod";
import { AppPageMenuModel } from "../models/AppPageMenu";
import { db } from "../config/database";

const IdParamSchema = z.string().min(1);

const CreateMenuSchema = z.object({
  page_id: z.string().min(1),
  parent_id: z.string().nullable().optional(),
  menu_title: z.string().min(1).max(200),
  menu_icon: z.string().max(100).nullable().optional(),
  route_path: z.string().max(500).nullable().optional(),
});

const UpdateMenuSchema = z.object({
  menu_title: z.string().min(1).max(200).optional(),
  menu_icon: z.string().max(100).nullable().optional(),
  route_path: z.string().max(500).nullable().optional(),
  parent_id: z.string().nullable().optional(),
});

const SortMenusSchema = z.object({
  menus: z.array(
    z.object({
      id: z.string().min(1),
      parent_id: z.string().nullable(),
      sort_order: z.number().int().min(0),
    })
  ),
});

/**
 * GET /api/v1/applications/:id/menus - 获取应用菜单树
 */
export async function getAppMenus(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);
    const tree = AppPageMenuModel.getMenuTree(appId);
    res.json({ success: true, data: tree });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] getAppMenus error:", error);
    res.status(500).json({ success: false, error: "获取菜单失败" });
  }
}

/**
 * POST /api/v1/applications/:id/menus - 挂载页面到应用
 */
export async function addMenu(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);
    const body = CreateMenuSchema.parse(req.body);

    const id = AppPageMenuModel.create({
      application_id: appId,
      page_id: body.page_id,
      parent_id: body.parent_id ?? null,
      menu_title: body.menu_title,
      menu_icon: body.menu_icon ?? null,
      route_path: body.route_path ?? null,
    });

    const menu = AppPageMenuModel.findById(id);
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] addMenu error:", error);
    res.status(500).json({ success: false, error: "添加菜单项失败" });
  }
}

/**
 * PUT /api/v1/applications/:id/menus/:menuId - 更新菜单项
 */
export async function updateMenu(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);
    const menuId = IdParamSchema.parse(req.params.menuId);
    const body = UpdateMenuSchema.parse(req.body);

    const menu = AppPageMenuModel.findById(menuId);
    if (!menu || menu.application_id !== appId) {
      res.status(404).json({ success: false, error: "菜单项不存在" });
      return;
    }

    AppPageMenuModel.update(menuId, body);
    const updated = AppPageMenuModel.findById(menuId);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] updateMenu error:", error);
    res.status(500).json({ success: false, error: "更新菜单失败" });
  }
}

/**
 * PATCH /api/v1/applications/:id/menus/sort - 调整菜单排序/层级
 */
export async function sortMenus(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);
    const body = SortMenusSchema.parse(req.body);

    AppPageMenuModel.batchSort(appId, body.menus);

    const tree = AppPageMenuModel.getMenuTree(appId);
    res.json({ success: true, data: tree });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] sortMenus error:", error);
    res.status(500).json({ success: false, error: "排序失败" });
  }
}

/**
 * DELETE /api/v1/applications/:id/menus/:menuId - 从应用中移除页面
 */
export async function removeMenu(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);
    const menuId = IdParamSchema.parse(req.params.menuId);

    const menu = AppPageMenuModel.findById(menuId);
    if (!menu || menu.application_id !== appId) {
      res.status(404).json({ success: false, error: "菜单项不存在" });
      return;
    }

    AppPageMenuModel.delete(menuId);
    res.json({ success: true, message: "菜单项已移除" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] removeMenu error:", error);
    res.status(500).json({ success: false, error: "移除菜单失败" });
  }
}

/**
 * POST /api/v1/applications/:id/publish - 发布应用
 */
export async function publishApp(req: Request, res: Response): Promise<void> {
  try {
    const appId = IdParamSchema.parse(req.params.id);

    // 更新应用的 updated_at 时间戳作为发布标记
    const result = db
      .prepare("UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(appId);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: "应用不存在" });
      return;
    }

    const tree = AppPageMenuModel.getMenuTree(appId);
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(appId) as Record<string, unknown>;

    res.json({
      success: true,
      data: {
        id: appId,
        title: app?.title,
        published_at: new Date().toISOString(),
        menus: tree,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[assemblyController] publishApp error:", error);
    res.status(500).json({ success: false, error: "发布失败" });
  }
}
