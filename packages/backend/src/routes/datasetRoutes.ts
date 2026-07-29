import { Router, Request, Response } from "express";
import { z } from "zod";
import { queryOne } from "../config/database";
import { authenticateToken } from "../middleware/authMiddleware";
import { UserModel } from "../models/User";
import {
  DatasetEntityModel,
  DatasetFieldModel,
  DatasetFieldSyncError,
  DatasetFieldType,
  DatasetFolderModel,
  DatasetRowModel,
} from "../models/DatasetModel";

const router: Router = Router();

const FieldTypeEnum = z.enum(["text", "number", "datetime"]);

const FieldInputSchema = z.object({
  name: z.string().min(1).max(200),
  field_type: FieldTypeEnum,
  sort_order: z.number().int().optional(),
});

const FieldUpdateInputSchema = FieldInputSchema.extend({
  id: z.string().min(1).optional(),
  client_id: z.string().min(1).max(200).optional(),
});

const IdSchema = z.string().min(1);

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  parent_id: IdSchema.optional().nullable(),
  project_id: IdSchema.optional().nullable(),
  sort_order: z.number().int().optional(),
});

const UpdateFolderSchema = CreateFolderSchema.partial();

const CreateDatasetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  project_id: IdSchema.optional().nullable(),
  folder_id: IdSchema.optional().nullable(),
  form_schema: z.record(z.any()).nullable().optional(),
  fields: z.array(FieldInputSchema).default([]),
});

const UpdateDatasetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  project_id: IdSchema.optional().nullable(),
  folder_id: IdSchema.optional().nullable(),
  form_schema: z.record(z.any()).nullable().optional(),
  fields: z.array(FieldUpdateInputSchema).optional(),
});

const RowValuesSchema = z.object({
  values: z.record(z.union([z.string(), z.number(), z.null()])),
  sort_order: z.number().int().optional(),
});

const RowUpdateSchema = z.object({
  values: z.record(z.union([z.string(), z.number(), z.null()])).optional(),
  sort_order: z.number().int().optional(),
});

const BatchRowValuesSchema = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number(), z.null()]))).min(1).max(1000),
});

function parseOptionalId(q: unknown): string | null | undefined {
  if (q === undefined || q === "") return undefined;
  if (q === "null") return null;
  const value = typeof q === "string" ? q.trim() : "";
  return value || undefined;
}

function parseRequiredId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

async function projectExists(projectId: string): Promise<boolean> { return Boolean(await queryOne("SELECT 1 FROM projects WHERE id = ?", [projectId])); }

async function wouldCreateFolderCycle(folderId: string, newParentId: string): Promise<boolean> { let cur = await DatasetFolderModel.findById(newParentId); while (cur) { if (cur.id === folderId) return true; cur = cur.parent_id ? await DatasetFolderModel.findById(cur.parent_id) : undefined; } return false; }

async function canAccessOwnerResource(req: Request, resourceOwnerId: string): Promise<boolean> {
  const uid = req.userId!;
  if (uid === resourceOwnerId) return true;
  const u = await UserModel.findById(uid);
  return u?.role === "admin";
}

function serializeDataset(dataset: Awaited<ReturnType<typeof DatasetEntityModel.findById>>) {
  if (!dataset) return dataset;
  let form_schema: Record<string, unknown> | null = null;
  try {
    form_schema = dataset.form_schema ? (JSON.parse(dataset.form_schema) as Record<string, unknown>) : null;
  } catch {
    form_schema = null;
  }
  return { ...dataset, form_schema };
}

function normalizeFields(
  fields: z.infer<typeof FieldInputSchema>[],
): { name: string; field_type: DatasetFieldType; sort_order: number }[] {
  return fields.map((f, i) => ({
    name: f.name,
    field_type: f.field_type,
    sort_order: f.sort_order ?? i,
  }));
}

function validateRowValues(
  fields: { id: string; field_type: DatasetFieldType }[],
  values: Record<string, string | number | null>,
): string | null {
  const allowed = new Set(fields.map((f) => String(f.id)));
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) return `未知字段 id: ${key}`;
  }
  for (const f of fields) {
    const v = values[String(f.id)];
    if (v === undefined) continue;
    if (v === null) continue;
    if (f.field_type === "text" && typeof v !== "string") return `字段 ${f.id} 须为文本`;
    if (f.field_type === "number" && typeof v !== "number") return `字段 ${f.id} 须为数值`;
    if (f.field_type === "datetime" && typeof v !== "string") return `字段 ${f.id} 须为时间字符串`;
    if (f.field_type === "datetime" && typeof v === "string" && Number.isNaN(Date.parse(v)))
      return `字段 ${f.id} 时间格式无效`;
  }
  return null;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeRowDateTimes(
  fields: { id: string; field_type: DatasetFieldType }[],
  values: Record<string, string | number | null>,
): Record<string, string | number | null> {
  const dateTimeFieldIds = new Set(fields.filter((field) => field.field_type === "datetime").map((field) => field.id));
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key,
    value !== null && typeof value === "string" && dateTimeFieldIds.has(key) ? formatDateTime(value) : value,
  ]));
}

router.use(authenticateToken);

// ---------- 目录（文件夹）----------

router.get("/folders/tree", async (req: Request, res: Response) => {
  try {
    const projectId = parseOptionalId(req.query.projectId);
    const list = await DatasetFolderModel.listAllForOwner(req.userId!, projectId);
    const tree = DatasetFolderModel.buildTree(list, null);
    res.json({ success: true, data: tree, message: "目录树" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.get("/folders", async (req: Request, res: Response) => {
  try {
    const projectId = parseOptionalId(req.query.projectId);
    const listAll = req.query.all === "1" || req.query.all === "true";
    if (listAll) {
      const rows = await DatasetFolderModel.listAllForOwner(req.userId!, projectId);
      return res.json({ success: true, data: rows, total: rows.length, message: "目录扁平列表" });
    }
    const parentRaw = req.query.parentId;
    let parentId: string | null;
    if (parentRaw === undefined || parentRaw === "" || parentRaw === "null") {
      parentId = null;
    } else {
      const parsed = parseRequiredId(parentRaw);
      if (!parsed) return res.status(400).json({ success: false, error: "parentId 无效" });
      parentId = parsed;
    }
    const rows = await DatasetFolderModel.listChildren(req.userId!, { projectId, parentId });
    res.json({ success: true, data: rows, total: rows.length, message: "子目录列表" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.get("/folders/:folderId", async (req: Request, res: Response) => {
  try {
    const folderId = parseRequiredId(req.params.folderId);
    if (!folderId) return res.status(400).json({ success: false, error: "无效 ID" });
    const row = await DatasetFolderModel.findById(folderId);
    if (!row || !(await canAccessOwnerResource(req, row.owner_id))) {
      return res.status(404).json({ success: false, error: "目录不存在" });
    }
    const counts = await DatasetFolderModel.countChildren(folderId);
    res.json({
      success: true,
      data: { ...row, child_folder_count: counts.subfolders, dataset_count: counts.datasets },
      message: "目录详情",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.post("/folders", async (req: Request, res: Response) => {
  try {
    const body = CreateFolderSchema.parse(req.body);
    if (body.project_id != null && !(await projectExists(body.project_id))) {
      return res.status(400).json({ success: false, error: "项目不存在" });
    }
    let parent_id: string | null = body.parent_id ?? null;
    if (parent_id != null) {
      const p = await DatasetFolderModel.findById(parent_id);
      if (!p || !(await canAccessOwnerResource(req, p.owner_id))) {
        return res.status(400).json({ success: false, error: "父目录不存在或无权限" });
      }
      if (p.owner_id !== req.userId) {
        const u = await UserModel.findById(req.userId!);
        if (u?.role !== "admin") return res.status(403).json({ success: false, error: "无权在该目录下创建" });
      }
      const projParent = p.project_id ?? null;
      const projBody = body.project_id ?? null;
      if (projParent !== projBody) {
        return res.status(400).json({ success: false, error: "project_id 须与父目录一致" });
      }
    }
    const id = await DatasetFolderModel.create({
      parent_id,
      project_id: body.project_id ?? null,
      name: body.name,
      description: body.description,
      owner_id: req.userId!,
      sort_order: body.sort_order,
    });
    const created = await DatasetFolderModel.findById(id)!;
    res.status(201).json({ success: true, data: created, message: "目录已创建" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.put("/folders/:folderId", async (req: Request, res: Response) => {
  try {
    const folderId = parseRequiredId(req.params.folderId);
    if (!folderId) return res.status(400).json({ success: false, error: "无效 ID" });
    const row = await DatasetFolderModel.findById(folderId);
    if (!row || !(await canAccessOwnerResource(req, row.owner_id))) {
      return res.status(404).json({ success: false, error: "目录不存在" });
    }
    const body = UpdateFolderSchema.parse(req.body);
    if (body.project_id !== undefined && body.project_id != null && !(await projectExists(body.project_id))) {
      return res.status(400).json({ success: false, error: "项目不存在" });
    }
    if (body.parent_id !== undefined && body.parent_id !== null) {
      if (body.parent_id === folderId) {
        return res.status(400).json({ success: false, error: "不能将自身设为父目录" });
      }
      const p = await DatasetFolderModel.findById(body.parent_id);
      if (!p || !(await canAccessOwnerResource(req, p.owner_id))) {
        return res.status(400).json({ success: false, error: "父目录不存在或无权限" });
      }
      if (await wouldCreateFolderCycle(folderId, body.parent_id)) {
        return res.status(400).json({ success: false, error: "不能形成循环目录" });
      }
    }
    const nextProjectId = body.project_id !== undefined ? body.project_id : row.project_id;
    if (body.parent_id !== undefined && body.parent_id !== null) {
      const p = await DatasetFolderModel.findById(body.parent_id);
      if (p && (p.project_id ?? null) !== (nextProjectId ?? null)) {
        return res.status(400).json({ success: false, error: "父目录 project_id 不一致" });
      }
    }
    await DatasetFolderModel.update(folderId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.sort_order !== undefined ? { sort_order: body.sort_order } : {}),
      ...(body.project_id !== undefined ? { project_id: body.project_id } : {}),
      ...(body.parent_id !== undefined ? { parent_id: body.parent_id } : {}),
    });
    res.json({ success: true, data: await DatasetFolderModel.findById(folderId), message: "目录已更新" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.delete("/folders/:folderId", async (req: Request, res: Response) => {
  try {
    const folderId = parseRequiredId(req.params.folderId);
    if (!folderId) return res.status(400).json({ success: false, error: "无效 ID" });
    const row = await DatasetFolderModel.findById(folderId);
    if (!row || !(await canAccessOwnerResource(req, row.owner_id))) {
      return res.status(404).json({ success: false, error: "目录不存在" });
    }
    const counts = await DatasetFolderModel.countChildren(folderId);
    if (counts.subfolders > 0 || counts.datasets > 0) {
      return res.status(409).json({
        success: false,
        error: "目录非空，请先删除子目录或移走数据集",
        data: counts,
      });
    }
    await DatasetFolderModel.delete(folderId);
    res.json({ success: true, message: "目录已删除" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

// ---------- 数据集列表与创建（须在 /:datasetId/rows 之前，避免把 "rows" 当成 id）----------

router.get("/", async (req: Request, res: Response) => {
  try {
    const projectId = parseOptionalId(req.query.projectId);
    const folderRaw = req.query.folderId;
    const folderId =
      folderRaw === undefined || folderRaw === ""
        ? undefined
        : folderRaw === "null"
          ? null
          : parseRequiredId(folderRaw);
    if (folderId === null && folderRaw !== "null") {
      return res.status(400).json({ success: false, error: "folderId 无效" });
    }
    const rows = await DatasetEntityModel.list(req.userId!, { projectId, folderId });
    const enriched = await Promise.all(rows.map(async (d) => {
      const fields = await DatasetFieldModel.listByDataset(d.id);
      return {
        ...serializeDataset(d),
        field_count: fields.length,
        row_count: await DatasetEntityModel.rowCount(d.id),
        fields,
      };
    }));
    res.json({ success: true, data: enriched, total: enriched.length, message: "数据集列表" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = CreateDatasetSchema.parse(req.body);
    if (body.project_id != null && !(await projectExists(body.project_id))) {
      return res.status(400).json({ success: false, error: "项目不存在" });
    }
    if (body.folder_id != null) {
      const f = await DatasetFolderModel.findById(body.folder_id);
      if (!f || !(await canAccessOwnerResource(req, f.owner_id))) {
        return res.status(400).json({ success: false, error: "目录不存在或无权限" });
      }
      if ((f.project_id ?? null) !== (body.project_id ?? null)) {
        return res.status(400).json({ success: false, error: "folder_id 与 project_id 不一致" });
      }
    }
    const id = await DatasetEntityModel.create({
      name: body.name,
      description: body.description,
      owner_id: req.userId!,
      project_id: body.project_id,
      folder_id: body.folder_id,
      form_schema: body.form_schema ? JSON.stringify(body.form_schema) : null,
    });
    const normalized = normalizeFields(body.fields);
    if (normalized.length > 0) {
      await DatasetFieldModel.createMany(id, normalized);
    }
    const ds = await DatasetEntityModel.findById(id)!;
    const fields = await DatasetFieldModel.listByDataset(id);
    res.status(201).json({
      success: true,
      data: { ...serializeDataset(ds), fields, row_count: 0 },
      message: "数据集已创建",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

// ---------- 数据集行 ----------

router.get("/:datasetId/rows", async (req: Request, res: Response) => {
  try {
    const datasetId = parseRequiredId(req.params.datasetId);
    if (!datasetId) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(datasetId);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 20));
    const { rows, total } = await DatasetRowModel.listPage(datasetId, page, pageSize);
    const parsed = rows.map((r) => ({
      id: r.id,
      dataset_id: r.dataset_id,
      sort_order: r.sort_order,
      values: JSON.parse(r.values_json || "{}") as Record<string, unknown>,
      created_at: r.created_at,
    }));
    res.json({
      success: true,
      data: parsed,
      total,
      page,
      pageSize,
      message: "数据行列表",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.post("/:datasetId/rows/batch", async (req: Request, res: Response) => {
  try {
    const datasetId = parseRequiredId(req.params.datasetId);
    if (!datasetId) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(datasetId);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const body = BatchRowValuesSchema.parse(req.body);
    const fields = await DatasetFieldModel.listByDataset(datasetId);
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "请先为数据集定义字段" });
    }
    for (let index = 0; index < body.rows.length; index++) {
      const err = validateRowValues(fields, body.rows[index]);
      if (err) return res.status(400).json({ success: false, error: `第 ${index + 1} 行：${err}` });
    }
    const currentCount = await DatasetEntityModel.rowCount(datasetId);
    await DatasetRowModel.createMany(
      datasetId,
      body.rows.map((values, index) => ({
        valuesJson: JSON.stringify(normalizeRowDateTimes(fields, values)),
        sortOrder: currentCount + index + 1,
      })),
    );
    res.status(201).json({ success: true, data: { count: body.rows.length }, message: "数据已导入" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.post("/:datasetId/rows", async (req: Request, res: Response) => {
  try {
    const datasetId = parseRequiredId(req.params.datasetId);
    if (!datasetId) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(datasetId);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const body = RowValuesSchema.parse(req.body);
    const fields = await DatasetFieldModel.listByDataset(datasetId);
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "请先为数据集定义字段" });
    }
    const err = validateRowValues(fields, body.values);
    if (err) return res.status(400).json({ success: false, error: err });
    const id = await DatasetRowModel.create(datasetId, JSON.stringify(normalizeRowDateTimes(fields, body.values)), body.sort_order);
    const row = (await queryOne("SELECT * FROM dataset_rows WHERE id = ?", [id])) as {
      id: string;
      dataset_id: string;
      sort_order: number;
      values_json: string;
      created_at: string;
    };
    res.status(201).json({
      success: true,
      data: {
        ...row,
        values: JSON.parse(row.values_json || "{}"),
      },
      message: "行已添加",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.put("/:datasetId/rows/:rowId", async (req: Request, res: Response) => {
  try {
    const datasetId = parseRequiredId(req.params.datasetId);
    const rowId = parseRequiredId(req.params.rowId);
    if (!datasetId || !rowId) {
      return res.status(400).json({ success: false, error: "无效 ID" });
    }
    const ds = await DatasetEntityModel.findById(datasetId);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const body = RowUpdateSchema.parse(req.body);
    const existing = await DatasetRowModel.findById(rowId, datasetId);
    if (!existing) return res.status(404).json({ success: false, error: "行不存在" });
    const fields = await DatasetFieldModel.listByDataset(datasetId);
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "请先为数据集定义字段" });
    }
    const prevParsed = JSON.parse(existing.values_json || "{}") as Record<string, unknown>;
    const mergedRaw = { ...prevParsed, ...(body.values ?? {}) };
    const merged: Record<string, string | number | null> = {};
    for (const f of fields) {
      const k = String(f.id);
      if (Object.prototype.hasOwnProperty.call(mergedRaw, k)) {
        merged[k] = mergedRaw[k] as string | number | null;
      }
    }
    const err = validateRowValues(fields, merged);
    if (err) return res.status(400).json({ success: false, error: err });
    const ok = await DatasetRowModel.update(rowId, datasetId, JSON.stringify(normalizeRowDateTimes(fields, merged)), body.sort_order);
    if (!ok) return res.status(404).json({ success: false, error: "行不存在" });
    const row = (await queryOne("SELECT * FROM dataset_rows WHERE id = ?", [rowId])) as {
      id: string;
      dataset_id: string;
      sort_order: number;
      values_json: string;
      created_at: string;
    };
    res.json({
      success: true,
      data: {
        ...row,
        values: JSON.parse(row.values_json || "{}"),
      },
      message: "行已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.delete("/:datasetId/rows/:rowId", async (req: Request, res: Response) => {
  try {
    const datasetId = parseRequiredId(req.params.datasetId);
    const rowId = parseRequiredId(req.params.rowId);
    if (!datasetId || !rowId) {
      return res.status(400).json({ success: false, error: "无效 ID" });
    }
    const ds = await DatasetEntityModel.findById(datasetId);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const ok = await DatasetRowModel.delete(rowId, datasetId);
    if (!ok) return res.status(404).json({ success: false, error: "行不存在" });
    res.json({ success: true, message: "行已删除" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseRequiredId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(id);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const fields = await DatasetFieldModel.listByDataset(id);
    const row_count = await DatasetEntityModel.rowCount(id);
    res.json({
      success: true,
      data: { ...serializeDataset(ds), fields, row_count },
      message: "数据集详情",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseRequiredId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(id);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    const body = UpdateDatasetSchema.parse(req.body);
    if (body.project_id !== undefined && body.project_id != null && !(await projectExists(body.project_id))) {
      return res.status(400).json({ success: false, error: "项目不存在" });
    }
    const nextProjectId = body.project_id !== undefined ? body.project_id : ds.project_id;
    if (body.folder_id !== undefined && body.folder_id !== null) {
      const f = await DatasetFolderModel.findById(body.folder_id);
      if (!f || !(await canAccessOwnerResource(req, f.owner_id))) {
        return res.status(400).json({ success: false, error: "目录不存在或无权限" });
      }
      if ((f.project_id ?? null) !== (nextProjectId ?? null)) {
        return res.status(400).json({ success: false, error: "folder_id 与 project_id 不一致" });
      }
    }
    let formSchema = body.form_schema;
    if (body.fields !== undefined) {
      const synced = await DatasetFieldModel.syncForDataset(
        id,
        body.fields.map((field, index) => ({
          ...field,
          sort_order: field.sort_order ?? index,
        })),
      );
      if (formSchema && Array.isArray(formSchema.fields)) {
        formSchema = {
          ...formSchema,
          fields: formSchema.fields.map((field: Record<string, unknown>) => {
            const clientId = typeof field._vid === "string" ? field._vid : undefined;
            return {
              ...field,
              ...(clientId && synced.fieldIdsByClientId[clientId]
                ? { field: synced.fieldIdsByClientId[clientId] }
                : {}),
            };
          }),
        };
      }
    }
    await DatasetEntityModel.update(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.project_id !== undefined ? { project_id: body.project_id } : {}),
      ...(body.folder_id !== undefined ? { folder_id: body.folder_id } : {}),
      ...(formSchema !== undefined ? { form_schema: formSchema ? JSON.stringify(formSchema) : null } : {}),
    });
    const updated = await DatasetEntityModel.findById(id)!;
    const fields = await DatasetFieldModel.listByDataset(id);
    const row_count = await DatasetEntityModel.rowCount(id);
    res.json({
      success: true,
      data: { ...serializeDataset(updated), fields, row_count },
      message: "数据集已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "数据验证失败", details: error.errors });
    }
    if (error instanceof DatasetFieldSyncError) {
      return res.status(409).json({ success: false, error: error.message });
    }
    console.error(error);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseRequiredId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "无效 ID" });
    const ds = await DatasetEntityModel.findById(id);
    if (!ds || !(await canAccessOwnerResource(req, ds.owner_id))) {
      return res.status(404).json({ success: false, error: "数据集不存在" });
    }
    await DatasetEntityModel.delete(id);
    res.json({ success: true, message: "数据集已删除" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "服务器内部错误" });
  }
});

export default router;
