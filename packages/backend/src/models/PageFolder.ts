import { execute, query, queryOne } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";
export interface PageFolder { id: string; parent_id: string | null; name: string; description: string | null; owner_id: string; sort_order: number; created_at: string; updated_at: string; }
export interface PageFolderTreeNode extends PageFolder { children: PageFolderTreeNode[]; }
function parseFolder(row: PageFolder): PageFolder { return { ...row, parent_id: row.parent_id ?? null, description: row.description ?? null, sort_order: Number(row.sort_order) }; }
export class PageFolderModel {
 static async listByOwner(ownerId: string): Promise<PageFolder[]> { return (await query<PageFolder[]>("SELECT * FROM page_folders WHERE owner_id = ? ORDER BY sort_order ASC, created_at ASC", [ownerId])).map(parseFolder); }
 static buildTree(folders: PageFolder[], parentId: string | null): PageFolderTreeNode[] { return folders.filter(f => (f.parent_id ?? null) === (parentId ?? null)).map(f => ({ ...f, children: this.buildTree(folders, f.id) })); }
 static async findById(id: string): Promise<PageFolder | undefined> { const row = await queryOne<PageFolder>("SELECT * FROM page_folders WHERE id = ?", [id]); return row && parseFolder(row); }
 static async create(data: { parent_id?: string | null; name: string; description?: string | null; owner_id: string; sort_order?: number; }): Promise<PageFolder> { const id = generateSnowflakeId(), now = new Date().toISOString(); await execute("INSERT INTO page_folders (id, parent_id, name, description, owner_id, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, data.parent_id ?? null, data.name, data.description ?? null, data.owner_id, data.sort_order ?? 0, now, now]); return (await this.findById(id))!; }
 static async update(id: string, data: Partial<Pick<PageFolder, "parent_id" | "name" | "description" | "sort_order">>): Promise<PageFolder | undefined> { const row = await this.findById(id); if (!row) return undefined; await execute("UPDATE page_folders SET parent_id = ?, name = ?, description = ?, sort_order = ?, updated_at = ? WHERE id = ?", [data.parent_id !== undefined ? data.parent_id : row.parent_id, data.name ?? row.name, data.description !== undefined ? data.description : row.description, data.sort_order ?? row.sort_order, new Date().toISOString(), id]); return this.findById(id); }
 static async delete(id: string): Promise<boolean> { return (await execute("DELETE FROM page_folders WHERE id = ?", [id])).affectedRows > 0; }
}
