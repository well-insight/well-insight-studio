import { Request, Response, Router } from "express";
import { z } from "zod";
import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

const router: Router = Router();

// 数据模型验证
const PageSchema = z.object({
  name: z.string().min(1).max(100),
  components: z.array(z.any()),
  settings: z.record(z.string(), z.any()).optional(),
});

// 建表（如果不存在）
db.prepare
(`
  CREATE TABLE IF NOT EXISTS lowcode_pages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    components TEXT NOT NULL DEFAULT '[]',
    settings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 获取所有页面
router.get("/pages", (req: Request, res: Response) => {
  try {
    const rows = db.prepare("SELECT * FROM lowcode_pages ORDER BY created_at DESC").all() as any[];
    const pages = rows.map((r) => ({
      ...r,
      components: JSON.parse(r.components || "[]"),
      settings: r.settings ? JSON.parse(r.settings) : undefined,
    }));
    res.json({ success: true, data: pages, total: pages.length, message: "获取页面列表成功" });
  } catch (e) {
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

// 创建新页面
router.post("/pages", (req: Request, res: Response) => {
  try {
    const validatedData = PageSchema.parse(req.body);
    const id = generateSnowflakeId();
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO lowcode_pages (id, name, components, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      validatedData.name,
      JSON.stringify(validatedData.components),
      validatedData.settings ? JSON.stringify(validatedData.settings) : null,
      now,
      now
    );

    const newPage = {
      id,
      ...validatedData,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    res.status(201).json({ success: true, data: newPage, message: "页面创建成功" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ success: false, error: "服务器内部错误" });
    }
  }
});

// 更新页面
router.put("/pages/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = PageSchema.partial().parse(req.body);

    const existing = db.prepare("SELECT * FROM lowcode_pages WHERE id = ?").get(id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: "页面不存在" });
    }

    const now = new Date().toISOString();
    const updatedComponents =
      validatedData.components !== undefined
        ? JSON.stringify(validatedData.components)
        : existing.components;
    const updatedSettings =
      validatedData.settings !== undefined
        ? JSON.stringify(validatedData.settings)
        : existing.settings;
    const updatedName = validatedData.name ?? existing.name;

    db.prepare(
      "UPDATE lowcode_pages SET name = ?, components = ?, settings = ?, updated_at = ? WHERE id = ?"
    ).run(updatedName, updatedComponents, updatedSettings, now, id);

    const updated = db.prepare("SELECT * FROM lowcode_pages WHERE id = ?").get(id) as any;
    const page = {
      ...updated,
      components: JSON.parse(updated.components || "[]"),
      settings: updated.settings ? JSON.parse(updated.settings) : undefined,
    };

    res.json({ success: true, data: page, message: "页面更新成功" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ success: false, error: "服务器内部错误" });
    }
  }
});

// 删除页面
router.delete("/pages/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT id FROM lowcode_pages WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: "页面不存在" });
  }

  db.prepare("DELETE FROM lowcode_pages WHERE id = ?").run(id);
  res.json({ success: true, message: "页面删除成功" });
});

export default router;
