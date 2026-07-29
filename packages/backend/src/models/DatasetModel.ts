import { execute, query, queryOne, withTransaction } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";
export type DatasetFieldType = "text" | "number" | "datetime";
export interface DatasetFolder { id: string; parent_id: string | null; project_id: string | null; name: string; description: string | null; owner_id: string; sort_order: number; created_at: string; updated_at: string; }
export type DatasetFolderTreeNode = DatasetFolder & { children: DatasetFolderTreeNode[] };
export interface DatasetField { id: string; dataset_id: string; name: string; field_type: DatasetFieldType; sort_order: number; created_at: string; }
export interface Dataset { id: string; name: string; description: string | null; form_schema: string | null; file_path: string | null; file_size: number | null; owner_id: string; project_id: string | null; folder_id: string | null; created_at: string; updated_at: string; }
export interface DatasetRow { id: string; dataset_id: string; sort_order: number; values_json: string; created_at: string; }
function count(row: { c: number | string } | undefined): number { return Number(row?.c ?? 0); }
export class DatasetFolderModel {
 static async findById(id: string): Promise<DatasetFolder | undefined> { return queryOne<DatasetFolder>("SELECT * FROM dataset_folders WHERE id = ?", [id]); }
 static async listChildren(ownerId: string, opts: { projectId?: string | null; parentId?: string | null }): Promise<DatasetFolder[]> { const conditions = ["owner_id = ?"], params: unknown[] = [ownerId]; if (opts.projectId !== undefined) { if (opts.projectId === null) conditions.push("project_id IS NULL"); else { conditions.push("project_id = ?"); params.push(opts.projectId); } } if (opts.parentId !== undefined) { if (opts.parentId === null) conditions.push("parent_id IS NULL"); else { conditions.push("parent_id = ?"); params.push(opts.parentId); } } return query<DatasetFolder[]>(`SELECT * FROM dataset_folders WHERE ${conditions.join(" AND ")} ORDER BY sort_order ASC, created_at ASC`, params); }
 static async listAllForOwner(ownerId: string, projectId?: string | null): Promise<DatasetFolder[]> { return this.listChildren(ownerId, { projectId }); }
 static buildTree(folders: DatasetFolder[], parentId: string | null): DatasetFolderTreeNode[] { return folders.filter(f => (f.parent_id ?? null) === (parentId ?? null)).map(f => ({ ...f, children: this.buildTree(folders, f.id) })); }
 static async create(data: { parent_id: string | null; project_id: string | null; name: string; description?: string | null; owner_id: string; sort_order?: number; }): Promise<string> { const id = generateSnowflakeId(); await execute("INSERT INTO dataset_folders (id, parent_id, project_id, name, description, owner_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, data.parent_id, data.project_id, data.name, data.description ?? null, data.owner_id, data.sort_order ?? 0]); return id; }
 static async update(id: string, data: Partial<Pick<DatasetFolder, "name" | "description" | "parent_id" | "sort_order" | "project_id">>): Promise<boolean> { const entries = Object.entries(data).filter(([, value]) => value !== undefined); if (!entries.length) return true; const allowed = new Set(["name", "description", "parent_id", "sort_order", "project_id"]); const valid = entries.filter(([key]) => allowed.has(key)); const values = valid.map(([, value]) => value); const sets = valid.map(([key]) => `${key} = ?`).join(", "); return (await execute(`UPDATE dataset_folders SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])).affectedRows > 0; }
 static async delete(id: string): Promise<boolean> { return (await execute("DELETE FROM dataset_folders WHERE id = ?", [id])).affectedRows > 0; }
 static async countChildren(folderId: string): Promise<{ subfolders: number; datasets: number }> { const [subfolders, datasets] = await Promise.all([queryOne<{ c: number | string }>("SELECT COUNT(1) AS c FROM dataset_folders WHERE parent_id = ?", [folderId]), queryOne<{ c: number | string }>("SELECT COUNT(1) AS c FROM datasets WHERE folder_id = ?", [folderId])]); return { subfolders: count(subfolders), datasets: count(datasets) }; }
}
export class DatasetEntityModel {
 static async findById(id: string): Promise<Dataset | undefined> { return queryOne<Dataset>("SELECT * FROM datasets WHERE id = ?", [id]); }
 static async list(ownerId: string, opts: { projectId?: string | null; folderId?: string | null }): Promise<Dataset[]> { const conditions = ["owner_id = ?"], params: unknown[] = [ownerId]; for (const [field, value] of [["project_id", opts.projectId], ["folder_id", opts.folderId]] as const) { if (value !== undefined) { if (value === null) conditions.push(`${field} IS NULL`); else { conditions.push(`${field} = ?`); params.push(value); } } } return query<Dataset[]>(`SELECT * FROM datasets WHERE ${conditions.join(" AND ")} ORDER BY updated_at DESC, created_at DESC`, params); }
 static async create(data: { name: string; description?: string | null; owner_id: string; project_id?: string | null; folder_id?: string | null; form_schema?: string | null; }): Promise<string> { const id = generateSnowflakeId(); await execute("INSERT INTO datasets (id, name, description, form_schema, owner_id, project_id, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, data.name, data.description ?? null, data.form_schema ?? null, data.owner_id, data.project_id ?? null, data.folder_id ?? null]); return id; }
 static async update(id: string, data: Partial<Pick<Dataset, "name" | "description" | "form_schema" | "project_id" | "folder_id">>): Promise<boolean> { const entries = Object.entries(data).filter(([, value]) => value !== undefined); if (!entries.length) return true; const allowed = new Set(["name", "description", "form_schema", "project_id", "folder_id"]), valid = entries.filter(([key]) => allowed.has(key)); return (await execute(`UPDATE datasets SET ${valid.map(([key]) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...valid.map(([, value]) => value), id])).affectedRows > 0; }
 static async delete(id: string): Promise<boolean> { return (await execute("DELETE FROM datasets WHERE id = ?", [id])).affectedRows > 0; }
 static async rowCount(datasetId: string): Promise<number> { return count(await queryOne<{ c: number | string }>("SELECT COUNT(1) AS c FROM dataset_rows WHERE dataset_id = ?", [datasetId])); }
}
export class DatasetFieldSyncError extends Error {}

export class DatasetFieldModel {
 static async listByDataset(datasetId: string): Promise<DatasetField[]> { return query<DatasetField[]>("SELECT * FROM dataset_fields WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC", [datasetId]); }
 static async syncForDataset(
  datasetId: string,
  fields: { id?: string; client_id?: string; name: string; field_type: DatasetFieldType; sort_order: number }[],
 ): Promise<{ fields: DatasetField[]; fieldIdsByClientId: Record<string, string> }> {
  const names = new Set<string>();
  for (const field of fields) {
   if (names.has(field.name)) throw new DatasetFieldSyncError(`字段名称重复: ${field.name}`);
   names.add(field.name);
  }

  return withTransaction(async (connection) => {
   const [currentRows] = await connection.execute("SELECT * FROM dataset_fields WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC", [datasetId]);
   const currentFields = currentRows as DatasetField[];
   const currentIds = new Set(currentFields.map((field) => field.id));
   const suppliedIds = new Set(fields.filter((field) => field.id).map((field) => field.id!));
   if (suppliedIds.size !== fields.filter((field) => field.id).length) {
    throw new DatasetFieldSyncError("字段标识重复");
   }
   for (const fieldId of suppliedIds) {
    if (!currentIds.has(fieldId)) throw new DatasetFieldSyncError("字段标识无效，不能修改或自定义");
   }

   const removedIds = currentFields.filter((field) => !suppliedIds.has(field.id)).map((field) => field.id);
   if (removedIds.length > 0) {
    const [rowCountRows] = await connection.execute("SELECT COUNT(1) AS c FROM dataset_rows WHERE dataset_id = ?", [datasetId]);
    const rowCount = Number((rowCountRows as { c: number | string }[])[0]?.c ?? 0);
    if (rowCount > 0) {
     throw new DatasetFieldSyncError("已有数据行时不能删除字段；可编辑、排序或新增字段");
    }
    await connection.execute(
     `DELETE FROM dataset_fields WHERE dataset_id = ? AND id IN (${removedIds.map(() => "?").join(", ")})`,
     [datasetId, ...removedIds],
    );
   }

   const fieldIdsByClientId: Record<string, string> = {};

   for (const field of fields) {
    if (field.id) {
     await connection.execute(
      "UPDATE dataset_fields SET name = ?, field_type = ?, sort_order = ? WHERE id = ? AND dataset_id = ?",
      [field.name, field.field_type, field.sort_order, field.id, datasetId],
     );
     if (field.client_id) fieldIdsByClientId[field.client_id] = field.id;
    } else {
     const id = generateSnowflakeId();
     await connection.execute(
      "INSERT INTO dataset_fields (id, dataset_id, name, field_type, sort_order) VALUES (?, ?, ?, ?, ?)",
      [id, datasetId, field.name, field.field_type, field.sort_order],
     );
     if (field.client_id) fieldIdsByClientId[field.client_id] = id;
    }
   }

   const [updatedRows] = await connection.execute("SELECT * FROM dataset_fields WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC", [datasetId]);
   return { fields: updatedRows as DatasetField[], fieldIdsByClientId };
  });
 }
 static async createMany(datasetId: string, fields: { name: string; field_type: DatasetFieldType; sort_order: number }[]): Promise<void> { await withTransaction(async connection => { for (const field of fields) await connection.execute("INSERT INTO dataset_fields (id, dataset_id, name, field_type, sort_order) VALUES (?, ?, ?, ?, ?)", [generateSnowflakeId(), datasetId, field.name, field.field_type, field.sort_order]); }); }
}
export class DatasetRowModel {
 static async listPage(datasetId: string, page: number, pageSize: number): Promise<{ rows: DatasetRow[]; total: number }> {
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 200) : 20;
  const offset = (normalizedPage - 1) * normalizedPageSize;
  const [total, rows] = await Promise.all([
   queryOne<{ c: number | string }>("SELECT COUNT(1) AS c FROM dataset_rows WHERE dataset_id = ?", [datasetId]),
   // This MySQL host rejects prepared-statement placeholders in LIMIT/OFFSET. These values are normalized before interpolation.
   query<DatasetRow[]>(`SELECT * FROM dataset_rows WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT ${normalizedPageSize} OFFSET ${offset}`, [datasetId]),
  ]);
  return { rows, total: count(total) };
 }
 static async create(datasetId: string, valuesJson: string, sortOrder?: number): Promise<string> { const order = sortOrder ?? Number((await queryOne<{ n: number | string }>("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM dataset_rows WHERE dataset_id = ?", [datasetId]))?.n ?? 1); const id = generateSnowflakeId(); await execute("INSERT INTO dataset_rows (id, dataset_id, sort_order, values_json) VALUES (?, ?, ?, ?)", [id, datasetId, order, valuesJson]); return id; }
 static async findById(rowId: string, datasetId: string): Promise<DatasetRow | undefined> { return queryOne<DatasetRow>("SELECT * FROM dataset_rows WHERE id = ? AND dataset_id = ?", [rowId, datasetId]); }
 static async update(rowId: string, datasetId: string, valuesJson: string, sortOrder?: number): Promise<boolean> { const result = sortOrder === undefined ? await execute("UPDATE dataset_rows SET values_json = ? WHERE id = ? AND dataset_id = ?", [valuesJson, rowId, datasetId]) : await execute("UPDATE dataset_rows SET values_json = ?, sort_order = ? WHERE id = ? AND dataset_id = ?", [valuesJson, sortOrder, rowId, datasetId]); return result.affectedRows > 0; }
 static async delete(rowId: string, datasetId: string): Promise<boolean> { return (await execute("DELETE FROM dataset_rows WHERE id = ? AND dataset_id = ?", [rowId, datasetId])).affectedRows > 0; }
 static async createMany(datasetId: string, rows: { valuesJson: string; sortOrder: number }[]): Promise<void> { await withTransaction(async connection => { for (const row of rows) await connection.execute("INSERT INTO dataset_rows (id, dataset_id, sort_order, values_json) VALUES (?, ?, ?, ?)", [generateSnowflakeId(), datasetId, row.sortOrder, row.valuesJson]); }); }
}
