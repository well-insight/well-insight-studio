import { Request, Response, Router } from "express";
import { z } from "zod";
import { db } from "../config/database";
import { authenticateToken } from "../middleware/authMiddleware";
import { generateSnowflakeId } from "../utils/snowflake";

const router: Router = Router();

router.use(authenticateToken);

const IdParamSchema = z.string().min(1);

function defaultSchema(clientType: number): Record<string, unknown> {
  const pageSize =
    clientType === 2
      ? { name: "", width: 375, height: 667 }
      : { name: "", width: 1920, height: 1080 };
  return {
    pages: {
      "/": {
        title: "首页",
        path: "/",
        config: {
          bgColor: "",
          bgImage: "",
          keepAlive: false,
          pageSize,
        },
        blocks: [],
      },
    },
    models: [],
    actions: {
      fetch: { name: "接口请求", apis: [] },
      dialog: { name: "对话框", handlers: [] },
    },
  };
}

const CreateApplicationSchema = z.object({
  title: z.string().min(1).max(200),
  client_type: z.number().int().min(1).max(2).optional().default(1),
  status: z.number().int().min(0).max(1).optional().default(1),
  /** 完整低代码 JSON（含 pages / models / actions），不用 z.record 以免嵌套结构校验过严 */
  schema: z.any().optional(),
});

const UpdateApplicationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  client_type: z.number().int().min(1).max(2).optional(),
  status: z.number().int().min(0).max(1).optional(),
  schema: z.any().optional(),
  starred: z.boolean().optional(),
});

function rowToListItem(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    client_type: row.client_type,
    starred: Boolean(row.starred),
    lastUpdated: row.updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseSchemaJson(raw: string, clientType: number): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}") as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && parsed.pages && typeof parsed.pages === "object") {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return defaultSchema(clientType);
}

/** GET /applications?status=all|enable|disable */
router.get("/", (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const statusFilter = typeof req.query.status === "string" ? req.query.status : "all";

    let sql = "SELECT * FROM applications WHERE owner_id = ?";
    const params: unknown[] = [userId];

    if (statusFilter === "enable") {
      sql += " AND status = 1";
    } else if (statusFilter === "disable") {
      sql += " AND status = 0";
    }

    sql += " ORDER BY updated_at DESC";

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    const items = rows.map(rowToListItem);

    res.json({
      success: true,
      data: { items, total: items.length },
      message: "获取应用列表成功",
    });
  } catch (e) {
    console.error("applications list error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }
    const id = parseId.data;
    const userId = req.userId!;

    const row = db.prepare("SELECT * FROM applications WHERE id = ? AND owner_id = ?").get(id, userId) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    const clientType = Number(row.client_type) || 1;
    const schema = parseSchemaJson(String(row.schema_json || "{}"), clientType);

    res.json({
      success: true,
      data: {
        ...rowToListItem(row),
        schema,
      },
      message: "获取应用成功",
    });
  } catch (e) {
    console.error("applications get error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const body = CreateApplicationSchema.parse(req.body);
    const userId = req.userId!;
    const id = generateSnowflakeId();
    const now = new Date().toISOString();
    const clientType = body.client_type;
    const schema = body.schema ?? defaultSchema(clientType);
    const schemaJson = JSON.stringify(schema);

    db.prepare(
      `INSERT INTO applications (id, title, status, client_type, schema_json, starred, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    ).run(id, body.title, body.status, clientType, schemaJson, userId, now, now);

    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>;

    res.status(201).json({
      success: true,
      data: {
        ...rowToListItem(row),
        schema: JSON.parse(String(row.schema_json)),
      },
      message: "创建应用成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("applications create error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }
    const id = parseId.data;
    const userId = req.userId!;

    const body = UpdateApplicationSchema.parse(req.body);

    const existing = db
      .prepare("SELECT * FROM applications WHERE id = ? AND owner_id = ?")
      .get(id, userId) as Record<string, unknown> | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    const now = new Date().toISOString();
    const title = body.title ?? existing.title;
    const status = body.status !== undefined ? body.status : existing.status;
    const clientType = body.client_type !== undefined ? body.client_type : existing.client_type;
    let schemaJson = String(existing.schema_json);

    if (body.schema !== undefined) {
      schemaJson = JSON.stringify(body.schema);
    }

    const starred =
      body.starred !== undefined ? (body.starred ? 1 : 0) : Number(existing.starred ?? 0);

    db.prepare(
      `UPDATE applications SET title = ?, status = ?, client_type = ?, schema_json = ?, starred = ?, updated_at = ? WHERE id = ? AND owner_id = ?`,
    ).run(title, status, clientType, schemaJson, starred, now, id, userId);

    const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>;
    const ct = Number(row.client_type) || 1;

    res.json({
      success: true,
      data: {
        ...rowToListItem(row),
        schema: parseSchemaJson(String(row.schema_json), ct),
      },
      message: "更新应用成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error("applications update error:", error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const parseId = IdParamSchema.safeParse(req.params.id);
    if (!parseId.success) {
      return res.status(400).json({ success: false, error: "无效的应用 ID" });
    }
    const id = parseId.data;
    const userId = req.userId!;

    const result = db.prepare("DELETE FROM applications WHERE id = ? AND owner_id = ?").run(id, userId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "应用不存在" });
    }

    res.json({ success: true, data: null, message: "删除应用成功" });
  } catch (e) {
    console.error("applications delete error:", e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

export default router;
