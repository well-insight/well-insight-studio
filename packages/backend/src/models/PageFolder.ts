import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export interface PageFolder {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  owner_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageFolderTreeNode extends PageFolder {
  children: PageFolderTreeNode[];
}

function parseFolder(row: Record<string, unknown>): PageFolder {
  return {
    id: String(row.id),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    owner_id: String(row.owner_id),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class PageFolderModel {
  static listByOwner(ownerId: string): PageFolder[] {
    return db
      .prepare("SELECT * FROM page_folders WHERE owner_id = ? ORDER BY sort_order ASC, created_at ASC")
      .all(ownerId) as PageFolder[];
  }

  static buildTree(folders: PageFolder[], parentId: string | null): PageFolderTreeNode[] {
    return folders
      .filter(folder => (folder.parent_id ?? null) === (parentId ?? null))
      .map(folder => ({
        ...folder,
        children: PageFolderModel.buildTree(folders, folder.id),
      }));
  }

  static findById(id: string): PageFolder | undefined {
    const row = db.prepare("SELECT * FROM page_folders WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row)
      return undefined;
    return parseFolder(row);
  }

  static create(data: {
    parent_id?: string | null;
    name: string;
    description?: string | null;
    owner_id: string;
    sort_order?: number;
  }): PageFolder {
    const id = generateSnowflakeId();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO page_folders (id, parent_id, name, description, owner_id, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.parent_id ?? null,
      data.name,
      data.description ?? null,
      data.owner_id,
      data.sort_order ?? 0,
      now,
      now,
    );
    const row = db.prepare("SELECT * FROM page_folders WHERE id = ?").get(id) as Record<string, unknown>;
    return parseFolder(row);
  }

  static update(
    id: string,
    data: Partial<Pick<PageFolder, "parent_id" | "name" | "description" | "sort_order">>,
  ): PageFolder | undefined {
    const existing = db.prepare("SELECT * FROM page_folders WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing)
      return undefined;
    const now = new Date().toISOString();
    const parentId = data.parent_id !== undefined ? data.parent_id : existing.parent_id ?? null;
    const name = data.name ?? String(existing.name);
    const description = data.description !== undefined ? data.description : existing.description ?? null;
    const sortOrder = data.sort_order ?? Number(existing.sort_order ?? 0);
    db.prepare(
      "UPDATE page_folders SET parent_id = ?, name = ?, description = ?, sort_order = ?, updated_at = ? WHERE id = ?",
    ).run(parentId, name, description, sortOrder, now, id);
    const row = db.prepare("SELECT * FROM page_folders WHERE id = ?").get(id) as Record<string, unknown>;
    return parseFolder(row);
  }

  static delete(id: string): boolean {
    const result = db.prepare("DELETE FROM page_folders WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
