import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export type PageType = "visualization" | "form" | "report";
export type PageStatus = "draft" | "published";

export interface Page {
  id: string;
  name: string;
  type: PageType;
  dsl: string | null;
  dataset_bindings: string | null;
  preview_url: string | null;
  status: PageStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePageInput {
  name: string;
  type: PageType;
  dsl?: Record<string, unknown>;
  dataset_bindings?: Record<string, unknown>;
  created_by: string;
}

export interface UpdatePageInput {
  name?: string;
  dsl?: Record<string, unknown>;
  dataset_bindings?: Record<string, unknown>;
  status?: PageStatus;
}

export interface PageListQuery {
  type?: PageType;
  status?: PageStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

function rowToPage(row: Record<string, unknown>): Page {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as PageType,
    dsl: row.dsl as string | null,
    dataset_bindings: row.dataset_bindings as string | null,
    preview_url: row.preview_url as string | null,
    status: row.status as PageStatus,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export class PageModel {
  static findById(id: string): Page | undefined {
    const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToPage(row) : undefined;
  }

  static list(query: PageListQuery & { created_by?: string }): { items: Page[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.type) {
      conditions.push("type = ?");
      params.push(query.type);
    }
    if (query.status) {
      conditions.push("status = ?");
      params.push(query.status);
    }
    if (query.keyword) {
      conditions.push("name LIKE ?");
      params.push(`%${query.keyword}%`);
    }
    if (query.created_by) {
      conditions.push("created_by = ?");
      params.push(query.created_by);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as cnt FROM pages ${whereClause}`)
      .get(...params) as { cnt: number };
    const total = countRow.cnt;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT * FROM pages ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as Record<string, unknown>[];

    return {
      items: rows.map(rowToPage),
      total,
    };
  }

  static create(data: CreatePageInput): string {
    const id = generateSnowflakeId();
    db.prepare(
      `INSERT INTO pages (id, name, type, dsl, dataset_bindings, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'draft', ?)`
    ).run(
      id,
      data.name,
      data.type,
      data.dsl ? JSON.stringify(data.dsl) : null,
      data.dataset_bindings ? JSON.stringify(data.dataset_bindings) : null,
      data.created_by,
    );
    return id;
  }

  static update(id: string, data: UpdatePageInput): boolean {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      sets.push("name = ?");
      params.push(data.name);
    }
    if (data.dsl !== undefined) {
      sets.push("dsl = ?");
      params.push(JSON.stringify(data.dsl));
    }
    if (data.dataset_bindings !== undefined) {
      sets.push("dataset_bindings = ?");
      params.push(JSON.stringify(data.dataset_bindings));
    }
    if (data.status !== undefined) {
      sets.push("status = ?");
      params.push(data.status);
    }

    if (sets.length === 0) return false;

    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const result = db
      .prepare(`UPDATE pages SET ${sets.join(", ")} WHERE id = ?`)
      .run(...params);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const result = db.prepare("DELETE FROM pages WHERE id = ?").run(id);
    return result.changes > 0;
  }

  static countByType(type?: PageType): number {
    if (type) {
      const row = db.prepare("SELECT COUNT(*) as cnt FROM pages WHERE type = ?").get(type) as { cnt: number };
      return row.cnt;
    }
    const row = db.prepare("SELECT COUNT(*) as cnt FROM pages").get() as { cnt: number };
    return row.cnt;
  }
}
