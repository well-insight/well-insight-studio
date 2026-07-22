import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export interface FormRecord {
  id: string;
  page_id: string;
  values_json: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormRecordPublic {
  id: string;
  page_id: string;
  values: Record<string, unknown>;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function parseRecord(row: Record<string, unknown>): FormRecordPublic {
  let values: Record<string, unknown> = {}
  try {
    values = JSON.parse(String(row.values_json || "{}")) as Record<string, unknown>
  }
  catch {
    values = {}
  }
  return {
    id: String(row.id),
    page_id: String(row.page_id),
    values,
    sort_order: Number(row.sort_order ?? 0),
    created_by: String(row.created_by),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export class FormRecordModel {
  static listByPage(pageId: string, options?: { page?: number; pageSize?: number }): { items: FormRecordPublic[]; total: number } {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const offset = (page - 1) * pageSize
    const total = (db.prepare("SELECT COUNT(1) as c FROM form_records WHERE page_id = ?").get(pageId) as { c: number }).c
    const rows = db
      .prepare(
        `SELECT * FROM form_records WHERE page_id = ? ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(pageId, pageSize, offset) as Record<string, unknown>[]
    return {
      items: rows.map(parseRecord),
      total,
    }
  }

  static create(data: {
    page_id: string
    values: Record<string, unknown>
    created_by: string
    sort_order?: number
  }): FormRecordPublic {
    const id = generateSnowflakeId()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO form_records (id, page_id, values_json, sort_order, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.page_id,
      JSON.stringify(data.values ?? {}),
      data.sort_order ?? 0,
      data.created_by,
      now,
      now,
    )
    const row = db.prepare("SELECT * FROM form_records WHERE id = ?").get(id) as Record<string, unknown>
    return parseRecord(row)
  }

  static findById(id: string, pageId: string): FormRecordPublic | undefined {
    const row = db.prepare("SELECT * FROM form_records WHERE id = ? AND page_id = ?").get(id, pageId) as
      | Record<string, unknown>
      | undefined
    if (!row)
      return undefined
    return parseRecord(row)
  }

  static update(
    id: string,
    pageId: string,
    data: {
      values?: Record<string, unknown>
      sort_order?: number
    },
  ): FormRecordPublic | undefined {
    const existing = db.prepare("SELECT * FROM form_records WHERE id = ? AND page_id = ?").get(id, pageId) as
      | Record<string, unknown>
      | undefined
    if (!existing)
      return undefined
    const now = new Date().toISOString()
    const valuesJson = data.values !== undefined ? JSON.stringify(data.values) : String(existing.values_json)
    const sortOrder = data.sort_order ?? Number(existing.sort_order ?? 0)
    db.prepare("UPDATE form_records SET values_json = ?, sort_order = ?, updated_at = ? WHERE id = ? AND page_id = ?").run(
      valuesJson,
      sortOrder,
      now,
      id,
      pageId,
    )
    const row = db.prepare("SELECT * FROM form_records WHERE id = ? AND page_id = ?").get(id, pageId) as Record<string, unknown>
    return parseRecord(row)
  }

  static delete(id: string, pageId: string): boolean {
    const result = db.prepare("DELETE FROM form_records WHERE id = ? AND page_id = ?").run(id, pageId)
    return result.changes > 0
  }
}
