import { execute, query, queryOne } from '../config/database';
import { generateSnowflakeId } from '../utils/snowflake';
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
function parseRecord(row: FormRecord): FormRecordPublic {
  let values: Record<string, unknown> = {};
  try {
    values = JSON.parse(row.values_json || '{}') as Record<string, unknown>;
  } catch {}
  return { ...row, sort_order: Number(row.sort_order), values };
}
export class FormRecordModel {
  static async listByPage(
    pageId: string,
    options?: { page?: number; pageSize?: number },
  ): Promise<{ items: FormRecordPublic[]; total: number }> {
    const page = options?.page ?? 1,
      pageSize = options?.pageSize ?? 20;
    const count = await queryOne<{ c: number | string }>(
      'SELECT COUNT(1) AS c FROM form_records WHERE page_id = ?',
      [pageId],
    );
    const rows = await query<FormRecord[]>(
      'SELECT * FROM form_records WHERE page_id = ? ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
      [pageId, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(parseRecord), total: Number(count?.c ?? 0) };
  }
  static async create(data: {
    page_id: string;
    values: Record<string, unknown>;
    created_by: string;
    sort_order?: number;
  }): Promise<FormRecordPublic> {
    const id = generateSnowflakeId();
    await execute(
      'INSERT INTO form_records (id, page_id, values_json, sort_order, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [id, data.page_id, JSON.stringify(data.values ?? {}), data.sort_order ?? 0, data.created_by],
    );
    return (await this.findById(id, data.page_id))!;
  }
  static async findById(id: string, pageId: string): Promise<FormRecordPublic | undefined> {
    const row = await queryOne<FormRecord>(
      'SELECT * FROM form_records WHERE id = ? AND page_id = ?',
      [id, pageId],
    );
    return row && parseRecord(row);
  }
  static async update(
    id: string,
    pageId: string,
    data: { values?: Record<string, unknown>; sort_order?: number },
  ): Promise<FormRecordPublic | undefined> {
    const row = await this.findById(id, pageId);
    if (!row) return undefined;
    await execute(
      'UPDATE form_records SET values_json = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND page_id = ?',
      [
        data.values !== undefined ? JSON.stringify(data.values) : JSON.stringify(row.values),
        data.sort_order ?? row.sort_order,
        id,
        pageId,
      ],
    );
    return this.findById(id, pageId);
  }
  static async delete(id: string, pageId: string): Promise<boolean> {
    return (
      (await execute('DELETE FROM form_records WHERE id = ? AND page_id = ?', [id, pageId]))
        .affectedRows > 0
    );
  }
}
