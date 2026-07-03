import { Router, Request, Response } from "express";
import { z } from "zod";
import { PageModel, PAGE_TYPES, PAGE_STATUSES } from "../models/Page";
import { authenticateToken } from "../middleware/authMiddleware";

const router: Router = Router();

router.use(authenticateToken);

const IdParamSchema = z.string().min(1);

const CreatePageSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(PAGE_TYPES),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().max(500).optional(),
  status: z.enum(PAGE_STATUSES).optional().default("draft"),
});

const UpdatePageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(PAGE_TYPES).optional(),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().max(500).nullable().optional(),
  status: z.enum(PAGE_STATUSES).optional(),
});

const ListQuerySchema = z.object({
  type: z.enum(PAGE_TYPES).optional(),
  status: z.enum(PAGE_STATUSES).optional(),
  keyword: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * POST /api/v1/pages - 创建独立页面
 */
router.post("/", (req: Request, res: Response) => {
  try {
    const body = CreatePageSchema.parse(req.body);
    const userId = req.userId!;

    const page = PageModel.create({
      name: body.name,
      type: body.type,
      dsl: body.dsl,
      dataset_bindings: body.dataset_bindings,
      preview_url: body.preview_url,
      status: body.status,
      created_by: userId,
    });

    res.status(201).json({
      success: true,
      data: page,
      message: "页面创建成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("pages create error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * GET /api/v1/pages - 获取页面列表
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const userId = req.userId!;

    const result = PageModel.findAll({
      ...query,
      created_by: userId,
    });

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
      },
      message: "获取页面列表成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "参数验证失败", details: error.errors });
    }
    console.error("pages list error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * GET /api/v1/pages/:id - 获取页面详情
 */
router.get("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的页面 ID" });
    }

    const page = PageModel.findById(parseId.data);
    if (!page) {
      return res.status(404).json({ success: false, error: "页面不存在" });
    }

    res.json({
      success: true,
      data: page,
      message: "获取页面成功",
    });
  } catch (e) {
    console.error("pages get error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * PUT /api/v1/pages/:id - 更新页面
 */
router.put("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的页面 ID" });
    }

    console.log("[PUT /pages/:id] id:", parseId.data, "body:", JSON.stringify(req.body));
    const body = UpdatePageSchema.parse(req.body);
    const page = PageModel.update(parseId.data, body);

    if (!page) {
      return res.status(404).json({ success: false, error: "页面不存在" });
    }

    res.json({
      success: true,
      data: page,
      message: "页面更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[PUT /pages/:id] 验证失败:", JSON.stringify(error.errors));
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("pages update error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

/**
 * DELETE /api/v1/pages/:id - 删除页面
 */
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的页面 ID" });
    }

    const deleted = PageModel.delete(parseId.data);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "页面不存在" });
    }

    res.json({
      success: true,
      data: null,
      message: "页面删除成功",
    });
  } catch (e) {
    console.error("pages delete error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

export default router;
