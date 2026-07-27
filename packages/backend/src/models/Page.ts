import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export type PageType = "visualization" | "form" | "report";
export type PageStatus = "draft" | "published";
export type PageDatasetBindingMode = "create" | "edit" | "detail" | "list";

export interface PageDatasetFieldMapItem {
  formFieldId: string;
  datasetFieldId: string;
}

export interface PageDatasetBinding {
  datasetId: string;
  mode: PageDatasetBindingMode;
  fieldMap: PageDatasetFieldMapItem[];
}

export type PageDatasetBindings = PageDatasetBinding[];

export interface Page {
  id: string;
  folder_id?: string | null;
  name: string;
  type: PageType;
  dsl: string;
  dataset_bindings?: string | null;
  preview_url?: string | null;
  status: PageStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PagePublic {
  id: string;
  folder_id?: string | null;
  name: string;
  type: PageType;
  dsl: Record<string, unknown>;
  dataset_bindings?: PageDatasetBindings | null;
  preview_url?: string | null;
  status: PageStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PAGE_TYPES = ["visualization", "form", "report"] as const;
export const PAGE_STATUSES = ["draft", "published"] as const;
export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  visualization: "可视化",
  form: "表单",
  report: "报表",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseJsonField(raw: string): unknown {
  try {
    return JSON.parse(raw);
  }
  catch {
    return {};
  }
}

function normalizeFieldMapItem(value: unknown): PageDatasetFieldMapItem | null {
  if (!isRecord(value))
    return null;
  const formFieldId = typeof value.formFieldId === "string" ? value.formFieldId.trim() : "";
  const datasetFieldId = typeof value.datasetFieldId === "string" ? value.datasetFieldId.trim() : "";
  if (!formFieldId || !datasetFieldId)
    return null;
  return { formFieldId, datasetFieldId };
}

export function normalizePageDatasetBindings(value: unknown): PageDatasetBindings | null {
  if (value == null)
    return null;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (!isRecord(item))
          return null;
        const datasetId = typeof item.datasetId === "string" ? item.datasetId.trim() : "";
        const mode = item.mode;
        const fieldMapValue = Array.isArray(item.fieldMap) ? item.fieldMap : [];
        if (!datasetId || (mode !== "create" && mode !== "edit" && mode !== "detail" && mode !== "list"))
          return null;
        return {
          datasetId,
          mode,
          fieldMap: fieldMapValue.map(normalizeFieldMapItem).filter((entry): entry is PageDatasetFieldMapItem => Boolean(entry)),
        };
      })
      .filter((item): item is PageDatasetBinding => Boolean(item));
    return items.length > 0 ? items : null;
  }
  if (isRecord(value)) {
    const datasetId = typeof value.datasetId === "string" ? value.datasetId.trim() : "";
    const mode = value.mode;
    const fieldMapValue = Array.isArray(value.fieldMap) ? value.fieldMap : [];
    if (!datasetId || (mode !== "create" && mode !== "edit" && mode !== "detail" && mode !== "list"))
      return null;
    const binding: PageDatasetBinding = {
      datasetId,
      mode,
      fieldMap: fieldMapValue.map(normalizeFieldMapItem).filter((entry): entry is PageDatasetFieldMapItem => Boolean(entry)),
    };
    return [binding];
  }
  return null;
}

function parseRow(row: Record<string, unknown>): PagePublic {
  const datasetBindings = normalizePageDatasetBindings(
    row.dataset_bindings ? parseJsonField(String(row.dataset_bindings)) : null,
  );
  return {
    id: String(row.id),
    folder_id: row.folder_id ? String(row.folder_id) : null,
    name: String(row.name),
    type: row.type as PageType,
    dsl: isRecord(parseJsonField(String(row.dsl || "{}"))) ? parseJsonField(String(row.dsl || "{}")) : {},
    dataset_bindings: datasetBindings,
    preview_url: row.preview_url ? String(row.preview_url) : null,
    status: row.status as PageStatus,
    created_by: String(row.created_by),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class PageModel {
  /** 创建页面 */
  static create(data: {
    folder_id?: string | null;
    name: string;
    type: PageType;
    dsl?: Record<string, unknown>;
    dataset_bindings?: PageDatasetBindings | Record<string, unknown> | null;
    preview_url?: string;
    status?: PageStatus;
    created_by: string;
  }): PagePublic {
    const id = generateSnowflakeId();
    const now = new Date().toISOString();
    const datasetBindings = normalizePageDatasetBindings(data.dataset_bindings);

    db.prepare(
      `INSERT INTO pages (id, folder_id, name, type, dsl, dataset_bindings, preview_url, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.folder_id ?? null,
      data.name,
      data.type,
      JSON.stringify(data.dsl ?? {}),
      datasetBindings !== null ? JSON.stringify(datasetBindings) : null,
      data.preview_url ?? null,
      data.status ?? "draft",
      data.created_by,
      now,
      now,
    );

    const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown>;
    return parseRow(row);
  }

  /** 按 ID 查询 */
  static findById(id: string): PagePublic | undefined {
    const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return undefined;
    return parseRow(row);
  }

  /** 查询页面列表 */
  static findAll(options?: {
    type?: PageType;
    status?: PageStatus;
    keyword?: string;
    created_by?: string;
    folder_id?: string | null;
    page?: number;
    pageSize?: number;
  }): { items: PagePublic[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.type) {
      conditions.push("type = ?");
      params.push(options.type);
    }
    if (options?.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options?.keyword) {
      conditions.push("name LIKE ?");
      params.push(`%${options.keyword}%`);
    }
    if (options?.created_by) {
      conditions.push("created_by = ?");
      params.push(options.created_by);
    }
    if (options?.folder_id !== undefined) {
      if (options.folder_id === null) {
        conditions.push("folder_id IS NULL");
      }
      else {
        conditions.push("folder_id = ?");
        params.push(options.folder_id);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const total = (
      db.prepare(`SELECT COUNT(*) as count FROM pages ${where}`).get(...params) as { count: number }
    ).count;

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(`SELECT * FROM pages ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as Record<string, unknown>[];

    return {
      items: rows.map(parseRow),
      total,
    };
  }

  /** 更新页面 */
  static update(
    id: string,
    data: {
      name?: string;
      type?: PageType;
      folder_id?: string | null;
      dsl?: Record<string, unknown>;
      dataset_bindings?: PageDatasetBindings | Record<string, unknown> | null;
      preview_url?: string | null;
      status?: PageStatus;
    },
  ): PagePublic | undefined {
    const existing = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const name = data.name ?? String(existing.name);
    const folderId = data.folder_id !== undefined ? data.folder_id : existing.folder_id ?? null;
    const type = data.type ?? (existing.type as PageType);
    const dsl = data.dsl !== undefined ? JSON.stringify(data.dsl) : String(existing.dsl);
    const datasetBindings =
      data.dataset_bindings !== undefined
        ? normalizePageDatasetBindings(data.dataset_bindings)
        : existing.dataset_bindings
          ? normalizePageDatasetBindings(parseJsonField(String(existing.dataset_bindings)))
          : null;
    const previewUrl =
      data.preview_url !== undefined ? data.preview_url : existing.preview_url ?? null;
    const status = data.status ?? (existing.status as PageStatus);

    db.prepare(
      `UPDATE pages SET folder_id = ?, name = ?, type = ?, dsl = ?, dataset_bindings = ?, preview_url = ?, status = ?, updated_at = ? WHERE id = ?`,
    ).run(folderId, name, type, dsl, datasetBindings !== null ? JSON.stringify(datasetBindings) : null, previewUrl, status, now, id);

    const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown>;
    return parseRow(row);
  }

  /** 删除页面 */
  static delete(id: string): boolean {
    const result = db.prepare("DELETE FROM pages WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

export default PageModel;
