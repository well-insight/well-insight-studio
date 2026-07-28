import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export type DatasetFieldType = "text" | "number" | "datetime";

export interface DatasetFolder {
  id: string;
  parent_id: string | null;
  project_id: string | null;
  name: string;
  description: string | null;
  owner_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type DatasetFolderTreeNode = DatasetFolder & { children: DatasetFolderTreeNode[] };

export interface DatasetField {
  id: string;
  dataset_id: string;
  name: string;
  field_type: DatasetFieldType;
  sort_order: number;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  form_schema: string | null;
  file_path: string | null;
  file_size: number | null;
  owner_id: string;
  project_id: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatasetRow {
  id: string;
  dataset_id: string;
  sort_order: number;
  values_json: string;
  created_at: string;
}

export class DatasetFolderModel {
  static findById(id: string): DatasetFolder | undefined {
    return db.prepare("SELECT * FROM dataset_folders WHERE id = ?").get(id) as DatasetFolder | undefined;
  }

  /** 列出当前用户在某父级下的子文件夹（parentId 省略表示不限；null 表示根） */
  static listChildren(
    ownerId: string,
    opts: { projectId?: string | null; parentId?: string | null },
  ): DatasetFolder[] {
    const conditions: string[] = ["owner_id = ?"];
    const params: unknown[] = [ownerId];
    if (opts.projectId !== undefined) {
      if (opts.projectId === null) {
        conditions.push("project_id IS NULL");
      } else {
        conditions.push("project_id = ?");
        params.push(opts.projectId);
      }
    }
    if (opts.parentId === undefined) {
      // no parent filter
    } else if (opts.parentId === null) {
      conditions.push("parent_id IS NULL");
    } else {
      conditions.push("parent_id = ?");
      params.push(opts.parentId);
    }
    const sql = `SELECT * FROM dataset_folders WHERE ${conditions.join(" AND ")} ORDER BY sort_order ASC, created_at ASC`;
    return db.prepare(sql).all(...params) as DatasetFolder[];
  }

  static listAllForOwner(ownerId: string, projectId?: string | null): DatasetFolder[] {
    const conditions = ["owner_id = ?"];
    const params: unknown[] = [ownerId];
    if (projectId !== undefined) {
      if (projectId === null) {
        conditions.push("project_id IS NULL");
      } else {
        conditions.push("project_id = ?");
        params.push(projectId);
      }
    }
    return db
      .prepare(
        `SELECT * FROM dataset_folders WHERE ${conditions.join(" AND ")} ORDER BY sort_order ASC, created_at ASC`,
      )
      .all(...params) as DatasetFolder[];
  }

  static buildTree(folders: DatasetFolder[], parentId: string | null): DatasetFolderTreeNode[] {
    return folders
      .filter((f) => (f.parent_id ?? null) === (parentId ?? null))
      .map((f) => ({
        ...f,
        children: DatasetFolderModel.buildTree(folders, f.id),
      }));
  }

  static create(data: {
    parent_id: string | null;
    project_id: string | null;
    name: string;
    description?: string | null;
    owner_id: string;
    sort_order?: number;
  }): string {
    const id = generateSnowflakeId();
    db
      .prepare(
        `INSERT INTO dataset_folders (id, parent_id, project_id, name, description, owner_id, sort_order)
         VALUES (@id, @parent_id, @project_id, @name, @description, @owner_id, @sort_order)`,
      )
      .run({
        id,
        parent_id: data.parent_id,
        project_id: data.project_id,
        name: data.name,
        description: data.description ?? null,
        owner_id: data.owner_id,
        sort_order: data.sort_order ?? 0,
      });
    return id;
  }

  static update(
    id: string,
    data: Partial<Pick<DatasetFolder, "name" | "description" | "parent_id" | "sort_order" | "project_id">>,
  ): boolean {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return true;
    const sets = entries.map(([k]) => `${k} = @${k}`).join(", ");
    const row = Object.fromEntries(entries) as Record<string, unknown>;
    const r = db
      .prepare(`UPDATE dataset_folders SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
      .run({ ...row, id });
    return r.changes > 0;
  }

  static delete(id: string): boolean {
    const r = db.prepare("DELETE FROM dataset_folders WHERE id = ?").run(id);
    return r.changes > 0;
  }

  static countChildren(folderId: string): { subfolders: number; datasets: number } {
    const sub = db.prepare("SELECT COUNT(1) as c FROM dataset_folders WHERE parent_id = ?").get(folderId) as {
      c: number;
    };
    const ds = db.prepare("SELECT COUNT(1) as c FROM datasets WHERE folder_id = ?").get(folderId) as { c: number };
    return { subfolders: sub.c, datasets: ds.c };
  }
}

export class DatasetEntityModel {
  static findById(id: string): Dataset | undefined {
    return db.prepare("SELECT * FROM datasets WHERE id = ?").get(id) as Dataset | undefined;
  }

  static list(
    ownerId: string,
    opts: { projectId?: string | null; folderId?: string | null },
  ): Dataset[] {
    const conditions: string[] = ["owner_id = ?"];
    const params: unknown[] = [ownerId];
    if (opts.projectId !== undefined) {
      if (opts.projectId === null) {
        conditions.push("project_id IS NULL");
      } else {
        conditions.push("project_id = ?");
        params.push(opts.projectId);
      }
    }
    if (opts.folderId !== undefined) {
      if (opts.folderId === null) {
        conditions.push("folder_id IS NULL");
      } else {
        conditions.push("folder_id = ?");
        params.push(opts.folderId);
      }
    }
    const sql = `SELECT * FROM datasets WHERE ${conditions.join(" AND ")} ORDER BY updated_at DESC, created_at DESC`;
    return db.prepare(sql).all(...params) as Dataset[];
  }

  static create(data: {
    name: string;
    description?: string | null;
    owner_id: string;
    project_id?: string | null;
    folder_id?: string | null;
    form_schema?: string | null;
  }): string {
    const id = generateSnowflakeId();
    db
      .prepare(
        `INSERT INTO datasets (id, name, description, form_schema, owner_id, project_id, folder_id)
         VALUES (@id, @name, @description, @form_schema, @owner_id, @project_id, @folder_id)`,
      )
      .run({
        id,
        name: data.name,
        description: data.description ?? null,
        form_schema: data.form_schema ?? null,
        owner_id: data.owner_id,
        project_id: data.project_id ?? null,
        folder_id: data.folder_id ?? null,
      });
    return id;
  }

  static update(
    id: string,
    data: Partial<Pick<Dataset, "name" | "description" | "form_schema" | "project_id" | "folder_id">>,
  ): boolean {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return true;
    const sets = entries.map(([k]) => `${k} = @${k}`).join(", ");
    const row = Object.fromEntries(entries) as Record<string, unknown>;
    const r = db
      .prepare(`UPDATE datasets SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
      .run({ ...row, id });
    return r.changes > 0;
  }

  static delete(id: string): boolean {
    const r = db.prepare("DELETE FROM datasets WHERE id = ?").run(id);
    return r.changes > 0;
  }

  static rowCount(datasetId: string): number {
    const row = db.prepare("SELECT COUNT(1) as c FROM dataset_rows WHERE dataset_id = ?").get(datasetId) as {
      c: number;
    };
    return row.c;
  }
}

export class DatasetFieldModel {
  static listByDataset(datasetId: string): DatasetField[] {
    return db
      .prepare(
        "SELECT * FROM dataset_fields WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC",
      )
      .all(datasetId) as DatasetField[];
  }

  static replaceForDataset(datasetId: string, fields: { name: string; field_type: DatasetFieldType; sort_order: number }[]) {
    const del = db.prepare("DELETE FROM dataset_fields WHERE dataset_id = ?");
    const ins = db.prepare(
      `INSERT INTO dataset_fields (id, dataset_id, name, field_type, sort_order) VALUES (?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      del.run(datasetId);
      for (const f of fields) {
        ins.run(generateSnowflakeId(), datasetId, f.name, f.field_type, f.sort_order);
      }
    });
    tx();
  }

  static createMany(
    datasetId: string,
    fields: { name: string; field_type: DatasetFieldType; sort_order: number }[],
  ) {
    const ins = db.prepare(
      `INSERT INTO dataset_fields (id, dataset_id, name, field_type, sort_order) VALUES (?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      for (const f of fields) {
        ins.run(generateSnowflakeId(), datasetId, f.name, f.field_type, f.sort_order);
      }
    });
    tx();
  }
}

export class DatasetRowModel {
  static listPage(
    datasetId: string,
    page: number,
    pageSize: number,
  ): { rows: DatasetRow[]; total: number } {
    const total = db.prepare("SELECT COUNT(1) as c FROM dataset_rows WHERE dataset_id = ?").get(datasetId) as {
      c: number;
    };
    const offset = (page - 1) * pageSize;
    const rows = db
      .prepare(
        `SELECT * FROM dataset_rows WHERE dataset_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT ? OFFSET ?`,
      )
      .all(datasetId, pageSize, offset) as DatasetRow[];
    return { rows, total: total.c };
  }

  static create(datasetId: string, valuesJson: string, sortOrder?: number): string {
    let order = sortOrder;
    if (order === undefined) {
      const row = db
        .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM dataset_rows WHERE dataset_id = ?")
        .get(datasetId) as { n: number };
      order = row.n;
    }
    const id = generateSnowflakeId();
    db.prepare(`INSERT INTO dataset_rows (id, dataset_id, sort_order, values_json) VALUES (?, ?, ?, ?)`).run(
      id,
      datasetId,
      order,
      valuesJson,
    );
    return id;
  }

  static findById(rowId: string, datasetId: string): DatasetRow | undefined {
    return db
      .prepare("SELECT * FROM dataset_rows WHERE id = ? AND dataset_id = ?")
      .get(rowId, datasetId) as DatasetRow | undefined;
  }

  static update(rowId: string, datasetId: string, valuesJson: string, sortOrder?: number): boolean {
    if (sortOrder !== undefined) {
      const r = db
        .prepare(
          "UPDATE dataset_rows SET values_json = ?, sort_order = ? WHERE id = ? AND dataset_id = ?",
        )
        .run(valuesJson, sortOrder, rowId, datasetId);
      return r.changes > 0;
    }
    const r = db
      .prepare("UPDATE dataset_rows SET values_json = ? WHERE id = ? AND dataset_id = ?")
      .run(valuesJson, rowId, datasetId);
    return r.changes > 0;
  }

  static delete(rowId: string, datasetId: string): boolean {
    const r = db.prepare("DELETE FROM dataset_rows WHERE id = ? AND dataset_id = ?").run(rowId, datasetId);
    return r.changes > 0;
  }

  static createMany(
    datasetId: string,
    rows: { valuesJson: string; sortOrder: number }[],
  ): void {
    const ins = db.prepare(
      `INSERT INTO dataset_rows (id, dataset_id, sort_order, values_json) VALUES (?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        ins.run(generateSnowflakeId(), datasetId, r.sortOrder, r.valuesJson);
      }
    });
    tx();
  }
}
