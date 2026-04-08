import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateSnowflakeId } from "../utils/snowflake";

const router: Router = Router();

// 数据模型验证
const PageSchema = z.object({
  name: z.string().min(1).max(100),
  components: z.array(z.any()),
  settings: z.record(z.string(), z.any()).optional(),
});

// 存储模拟数据（实际项目中应使用数据库）
let pages: Array<{
  id: string;
  name: string;
  components: any[];
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}> = [];

// 获取所有页面
router.get("/pages", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: pages,
    total: pages.length,
    message: "获取页面列表成功",
  });
});

// 创建新页面
router.post("/pages", (req: Request, res: Response) => {
  try {
    const validatedData = PageSchema.parse(req.body);

    const newPage = {
      id: generateSnowflakeId(),
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    pages.push(newPage);

    res.status(201).json({
      success: true,
      data: newPage,
      message: "页面创建成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "数据验证失败",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "服务器内部错误",
      });
    }
  }
});

// 更新页面
router.put("/pages/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = PageSchema.partial().parse(req.body);

    const pageIndex = pages.findIndex((page) => page.id === id);
    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "页面不存在",
      });
    }

    pages[pageIndex] = {
      ...pages[pageIndex],
      ...validatedData,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      data: pages[pageIndex],
      message: "页面更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "数据验证失败",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "服务器内部错误",
      });
    }
  }
});

// 删除页面
router.delete("/pages/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = pages.length;
  pages = pages.filter((page) => page.id !== id);

  if (pages.length === initialLength) {
    return res.status(404).json({
      success: false,
      error: "页面不存在",
    });
  }

  res.json({
    success: true,
    message: "页面删除成功",
  });
});

export default router;
