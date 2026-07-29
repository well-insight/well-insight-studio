import { execute, query, queryOne } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";
export type PageType = "visualization" | "form" | "report";
export type PageStatus = "draft" | "published";
export interface Page { id: string; folder_id?: string | null; name: string; type: PageType; dsl: string; dataset_bindings?: string | null; preview_url?: string | null; status: PageStatus; created_by: string; created_at: string; updated_at: string; }
export interface PagePublic { id: string; folder_id?: string | null; name: string; type: PageType; dsl: Record<string, unknown>; dataset_bindings?: Record<string, unknown> | null; preview_url?: string | null; status: PageStatus; created_by: string; created_at: string; updated_at: string; }
export const PAGE_TYPES = ["visualization", "form", "report"] as const;
export const PAGE_STATUSES = ["draft", "published"] as const;
export const PAGE_TYPE_LABELS: Record<PageType, string> = { visualization: "可视化", form: "表单", report: "报表" };
function json(raw: string): Record<string, unknown> { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; } }
function parseRow(row: Page): PagePublic { return { ...row, folder_id: row.folder_id ?? null, dsl: json(row.dsl || "{}"), dataset_bindings: row.dataset_bindings ? json(row.dataset_bindings) : null, preview_url: row.preview_url ?? null }; }
export class PageModel {
  static async create(data: { folder_id?: string | null; name: string; type: PageType; dsl?: Record<string, unknown>; dataset_bindings?: Record<string, unknown>; preview_url?: string; status?: PageStatus; created_by: string; }): Promise<PagePublic> {
    const id = generateSnowflakeId();
    await execute(
      "INSERT INTO pages (id, folder_id, name, type, dsl, dataset_bindings, preview_url, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [id, data.folder_id ?? null, data.name, data.type, JSON.stringify(data.dsl ?? {}), data.dataset_bindings ? JSON.stringify(data.dataset_bindings) : null, data.preview_url ?? null, data.status ?? "draft", data.created_by],
    );
    return parseRow((await queryOne<Page>("SELECT * FROM pages WHERE id = ?", [id]))!);
  }
  static async findById(id: string): Promise<PagePublic | undefined> { const row = await queryOne<Page>("SELECT * FROM pages WHERE id = ?", [id]); return row && parseRow(row); }
  static async findAll(options?: { type?: PageType; status?: PageStatus; keyword?: string; created_by?: string; folder_id?: string | null; page?: number; pageSize?: number; }): Promise<{ items: PagePublic[]; total: number }> {
    const conditions: string[] = [], params: unknown[] = [];
    if (options?.type) { conditions.push("type = ?"); params.push(options.type); } if (options?.status) { conditions.push("status = ?"); params.push(options.status); } if (options?.keyword) { conditions.push("name LIKE ?"); params.push(`%${options.keyword}%`); } if (options?.created_by) { conditions.push("created_by = ?"); params.push(options.created_by); }
    if (options?.folder_id !== undefined) { if (options.folder_id === null) conditions.push("folder_id IS NULL"); else { conditions.push("folder_id = ?"); params.push(options.folder_id); } }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const requestedPage = Number(options?.page ?? 1);
    const requestedPageSize = Number(options?.pageSize ?? 20);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0 ? Math.min(requestedPageSize, 100) : 20;
    const offset = (page - 1) * pageSize;
    const count = await queryOne<{ count: number | string }>(`SELECT COUNT(*) AS count FROM pages ${where}`, params);
    // The shared MySQL host rejects bound LIMIT/OFFSET parameters. These values are normalized above before interpolation.
    const rows = await query<Page[]>(`SELECT * FROM pages ${where} ORDER BY updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`, params);
    return { items: rows.map(parseRow), total: Number(count?.count ?? 0) };
  }
  static async update(id: string, data: { name?: string; type?: PageType; folder_id?: string | null; dsl?: Record<string, unknown>; dataset_bindings?: Record<string, unknown>; preview_url?: string | null; status?: PageStatus; }): Promise<PagePublic | undefined> {
    const existing = await queryOne<Page>("SELECT * FROM pages WHERE id = ?", [id]); if (!existing) return undefined;
    await execute(
      "UPDATE pages SET folder_id = ?, name = ?, type = ?, dsl = ?, dataset_bindings = ?, preview_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [data.folder_id !== undefined ? data.folder_id : existing.folder_id ?? null, data.name ?? existing.name, data.type ?? existing.type, data.dsl !== undefined ? JSON.stringify(data.dsl) : existing.dsl, data.dataset_bindings !== undefined ? JSON.stringify(data.dataset_bindings) : existing.dataset_bindings ?? null, data.preview_url !== undefined ? data.preview_url : existing.preview_url ?? null, data.status ?? existing.status, id],
    );
    return parseRow((await queryOne<Page>("SELECT * FROM pages WHERE id = ?", [id]))!);
  }
  static async delete(id: string): Promise<boolean> { return (await execute("DELETE FROM pages WHERE id = ?", [id])).affectedRows > 0; }
}
export default PageModel;
