import { Request, Response } from "express";
import { z } from "zod";
import { PageModel } from "../models/Page";

const CreatePageSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["visualization", "form", "report"]),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const UpdatePageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["visualization", "form", "report"]).optional(),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const IdParamSchema = z.string().min(1);

const ListQuerySchema = z.object({
  type: z.enum(["visualization", "form", "report"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * POST /api/v1/pages - 创建页面
 */
export async function createPage(req: Request, res: Response): Promise<void> {
  try {
    const body = CreatePageSchema.parse(req.body);
    const page = await PageModel.create({
      name: body.name,
      type: body.type,
      dsl: body.dsl,
      dataset_bindings: body.dataset_bindings,
      preview_url: body.preview_url,
      status: body.status,
      created_by: req.userId!,
    });

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[pageController] createPage error:", error);
    res.status(500).json({ success: false, error: "创建页面失败" });
  }
}

/**
 * GET /api/v1/pages - 获取页面列表
 */
export async function listPages(req: Request, res: Response): Promise<void> {
  try {
    const query = ListQuerySchema.parse(req.query);
    const result = await PageModel.findAll({
      type: query.type,
      status: query.status,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
      created_by: req.userId,
    });

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[pageController] listPages error:", error);
    res.status(500).json({ success: false, error: "获取页面列表失败" });
  }
}

/**
 * GET /api/v1/pages/:id - 获取页面详情
 */
export async function getPage(req: Request, res: Response): Promise<void> {
  try {
    const id = IdParamSchema.parse(req.params.id);
    const page = await PageModel.findById(id);

    if (!page) {
      res.status(404).json({ success: false, error: "页面不存在" });
      return;
    }

    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[pageController] getPage error:", error);
    res.status(500).json({ success: false, error: "获取页面详情失败" });
  }
}

/**
 * PUT /api/v1/pages/:id - 更新页面
 */
export async function updatePage(req: Request, res: Response): Promise<void> {
  try {
    const id = IdParamSchema.parse(req.params.id);
    console.log("[pageController] updatePage id:", id, "body:", JSON.stringify(req.body));
    const body = UpdatePageSchema.parse(req.body);

    const updated = await PageModel.update(id, body);
    if (!updated) {
      res.status(404).json({ success: false, error: "页面不存在" });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[pageController] updatePage error:", error);
    res.status(500).json({ success: false, error: "更新页面失败" });
  }
}

/**
 * DELETE /api/v1/pages/:id - 删除页面
 */
export async function deletePage(req: Request, res: Response): Promise<void> {
  try {
    const id = IdParamSchema.parse(req.params.id);
    const deleted = await PageModel.delete(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: "页面不存在" });
      return;
    }

    res.json({ success: true, message: "页面已删除" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "参数校验失败", details: error.errors });
      return;
    }
    console.error("[pageController] deletePage error:", error);
    res.status(500).json({ success: false, error: "删除页面失败" });
  }
}
