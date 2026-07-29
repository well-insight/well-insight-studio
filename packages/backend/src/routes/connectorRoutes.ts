import { Request, Response, Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import { authenticateToken } from "../middleware/authMiddleware";
import {
    DatasetEntityModel,
    DatasetFieldModel,
    DatasetRowModel,
} from "../models/DatasetModel";
import { generateSnowflakeId } from "../utils/snowflake";

const router: Router = Router();

// ─── multer：内存存储，最大 20MB ───────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    if (["xlsx", "xls", "csv"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 .xlsx / .xls / .csv 格式"));
    }
  },
});

// ─── 会话临时存储（存原始矩阵）────────────────────────────────────────
interface ParseSession {
  /** 原始行矩阵，每行为 unknown[] */
  rawMatrix: unknown[][];
  colCount: number;
  expiresAt: number;
}

const sessions = new Map<string, ParseSession>();

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) sessions.delete(id);
  }
}, 10 * 60 * 1000).unref();

// ─── POST /parse-file ─────────────────────────────────────────────────
router.post(
  "/parse-file",
  authenticateToken,
  upload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "请上传文件" });
        return;
      }

      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
        raw: false,
        cellDates: false,
      });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        res.status(400).json({ success: false, error: "文件中没有工作表" });
        return;
      }
      const sheet = workbook.Sheets[sheetName];

      // header:1 → 返回原始矩阵（每行为数组），不做表头推断
      const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: null,
        raw: false,
      });

      if (rawMatrix.length === 0) {
        res.status(400).json({ success: false, error: "文件内容为空" });
        return;
      }

      // 列数取所有行中最大长度
      const colCount = rawMatrix.reduce((max, row) => Math.max(max, row.length), 0);

      const sessionId = generateSnowflakeId();
      sessions.set(sessionId, {
        rawMatrix,
        colCount,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          sessionId,
          totalRows: rawMatrix.length,
          // 前 10 行供前端做表头选择 & 预览
          previewMatrix: rawMatrix.slice(0, 10),
          colCount,
        },
        message: "文件解析成功",
      });
    } catch (err) {
      console.error("[CONNECTOR] parse-file error:", err);
      res.status(500).json({ success: false, error: "文件解析失败，请检查格式" });
    }
  },
);

// ─── POST /import ─────────────────────────────────────────────────────
const ImportSchema = z.object({
  sessionId: z.string().min(1),
  /** 0-based，哪一行是表头 */
  headerRowIndex: z.number().int().min(0),
  fields: z
    .array(
      z.object({
        /** 0-based 列索引 */
        colIndex: z.number().int().min(0),
        name: z.string().min(1, "字段名不能为空"),
        type: z.enum(["text", "number", "datetime"]),
        include: z.boolean(),
      }),
    )
    .min(1),
  dataset: z.object({
    name: z.string().min(1).max(100),
    description: z.string().nullable().optional(),
    folder_id: z.string().nullable().optional(),
    project_id: z.string().nullable().optional(),
  }),
});

router.post("/import", authenticateToken, async (req: Request, res: Response) => {
  try {
    const body = ImportSchema.parse(req.body);
    const session = sessions.get(body.sessionId);
    if (!session) {
      res.status(400).json({
        success: false,
        error: "解析会话已过期，请重新上传文件",
      });
      return;
    }

    const includedFields = body.fields.filter((f) => f.include);
    if (includedFields.length === 0) {
      res.status(400).json({ success: false, error: "请至少选择一个字段" });
      return;
    }

    // 数据行 = 全部行，排除表头行
    const dataRows = session.rawMatrix.filter(
      (_, i) => i !== body.headerRowIndex,
    );

    // 创建数据集
    const datasetId = await DatasetEntityModel.create({
      name: body.dataset.name,
      description: body.dataset.description ?? null,
      owner_id: req.userId!,
      folder_id: body.dataset.folder_id ?? null,
      project_id: body.dataset.project_id ?? null,
    });

    // 创建字段
    await DatasetFieldModel.createMany(
      datasetId,
      includedFields.map((f, i) => ({
        name: f.name,
        field_type: f.type,
        sort_order: i,
      })),
    );

    // 获取字段 ID（name → id）
    const createdFields = await DatasetFieldModel.listByDataset(datasetId);
    // colIndex → fieldId
    const colIndexToFieldId = new Map<number, string>();
    includedFields.forEach((f) => {
      const created = createdFields.find((cf) => cf.name === f.name);
      if (created) colIndexToFieldId.set(f.colIndex, created.id);
    });

    // 批量构造行数据
    const rowsToInsert = dataRows.map((row, idx) => {
      const values: Record<string, unknown> = {};
      for (const f of includedFields) {
        const fieldId = colIndexToFieldId.get(f.colIndex);
        if (!fieldId) continue;
        const raw = (row as unknown[])[f.colIndex];
        if (raw === null || raw === undefined || String(raw).trim() === "") {
          values[fieldId] = null;
        } else if (f.type === "number") {
          const n = Number(raw);
          values[fieldId] = isFinite(n) ? n : null;
        } else if (f.type === "datetime") {
          const d = new Date(String(raw));
          values[fieldId] = isNaN(d.getTime()) ? String(raw) : d.toISOString();
        } else {
          values[fieldId] = String(raw);
        }
      }
      return { valuesJson: JSON.stringify(values), sortOrder: idx + 1 };
    });

    await DatasetRowModel.createMany(datasetId, rowsToInsert);

    sessions.delete(body.sessionId);

    res.json({
      success: true,
      data: {
        id: datasetId,
        name: body.dataset.name,
        row_count: dataRows.length,
        field_count: includedFields.length,
      },
      message: `成功导入 ${dataRows.length} 行数据，${includedFields.length} 个字段`,
    });
  } catch (err) {
    console.error("[CONNECTOR] import error:", err);
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "参数验证失败",
        details: err.errors,
      });
      return;
    }
    res.status(500).json({ success: false, error: "导入失败，请稍后重试" });
  }
});

export default router;
