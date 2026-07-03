import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";
import type { PagePublic, PageType } from "./Page";

export interface AppPageMenu {
  id: string;
  application_id: string;
  page_id: string;
  parent_id?: string | null;
  menu_title: string;
  menu_icon?: string | null;
  route_path?: string | null;
  permission?: string | null;
  sort_order: number;
  created_at: string;
}

/** 菜单树节点（含关联的页面信息） */
export interface MenuTreeNode {
  id: string;
  application_id: string;
  page_id?: string | null;
  parent_id?: string | null;
  menu_title: string;
  menu_icon?: string | null;
  route_path?: string | null;
  permission?: string | null;
  sort_order: number;
  isFolder: boolean;
  page?: Pick<PagePublic, "id" | "name" | "type" | "status"> | null;
  children: MenuTreeNode[];
}

export class AppPageMenuModel {
  /** 获取应用的完整菜单树 */
  static getMenuTree(applicationId: string): MenuTreeNode[] {
    const rows = db
      .prepare(
        `SELECT m.*, p.name as page_name, p.type as page_type, p.status as page_status
         FROM app_page_menus m
         LEFT JOIN pages p ON m.page_id = p.id
         WHERE m.application_id = ?
         ORDER BY m.sort_order ASC, m.created_at ASC`,
      )
      .all(applicationId) as Array<Record<string, unknown>>;

    const map = new Map<string, MenuTreeNode>();
    const roots: MenuTreeNode[] = [];

    for (const row of rows) {
      const id = String(row.id);
      const pageId = row.page_id ? String(row.page_id) : null;

      const node: MenuTreeNode = {
        id,
        application_id: String(row.application_id),
        page_id: pageId,
        parent_id: row.parent_id ? String(row.parent_id) : null,
        menu_title: String(row.menu_title),
        menu_icon: row.menu_icon ? String(row.menu_icon) : null,
        route_path: row.route_path ? String(row.route_path) : null,
        permission: row.permission ? String(row.permission) : null,
        sort_order: Number(row.sort_order),
        isFolder: !pageId,
        page: pageId
          ? {
              id: pageId,
              name: String(row.page_name || ""),
              type: (row.page_type || "visualization") as PageType,
              status: (row.page_status || "draft") as "draft" | "published",
            }
          : null,
        children: [],
      };
      map.set(id, node);
    }

    for (const node of map.values()) {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /** 添加菜单项 */
  static create(data: {
    application_id: string;
    page_id?: string | null;
    parent_id?: string | null;
    menu_title: string;
    menu_icon?: string;
    route_path?: string;
    permission?: string;
    sort_order?: number;
  }): AppPageMenu {
    const id = generateSnowflakeId();

    // 如果没有指定 sort_order，取当前应用的最大值 + 1
    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const maxResult = db
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM app_page_menus WHERE application_id = ?",
        )
        .get(data.application_id) as { next: number };
      sortOrder = maxResult.next;
    }

    db.prepare(
      `INSERT INTO app_page_menus (id, application_id, page_id, parent_id, menu_title, menu_icon, route_path, permission, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.application_id,
      data.page_id ?? null,
      data.parent_id ?? null,
      data.menu_title,
      data.menu_icon ?? null,
      data.route_path ?? null,
      data.permission ?? null,
      sortOrder,
      new Date().toISOString(),
    );

    const row = db.prepare("SELECT * FROM app_page_menus WHERE id = ?").get(id) as Record<string, unknown>;
    return rowToMenu(row);
  }

  /** 更新菜单项 */
  static update(
    id: string,
    data: {
      menu_title?: string;
      menu_icon?: string | null;
      route_path?: string | null;
      permission?: string | null;
      parent_id?: string | null;
      sort_order?: number;
    },
  ): AppPageMenu | undefined {
    const existing = db.prepare("SELECT * FROM app_page_menus WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return undefined;

    const menuTitle = data.menu_title ?? String(existing.menu_title);
    const menuIcon = data.menu_icon !== undefined ? data.menu_icon : existing.menu_icon ?? null;
    const routePath =
      data.route_path !== undefined ? data.route_path : existing.route_path ?? null;
    const permission =
      data.permission !== undefined ? data.permission : existing.permission ?? null;
    const parentId = data.parent_id !== undefined ? data.parent_id : existing.parent_id ?? null;
    const sortOrder = data.sort_order !== undefined ? data.sort_order : existing.sort_order;

    db.prepare(
      `UPDATE app_page_menus SET menu_title = ?, menu_icon = ?, route_path = ?, permission = ?, parent_id = ?, sort_order = ? WHERE id = ?`,
    ).run(menuTitle, menuIcon, routePath, permission, parentId, sortOrder, id);

    const row = db.prepare("SELECT * FROM app_page_menus WHERE id = ?").get(id) as Record<string, unknown>;
    return rowToMenu(row);
  }

  /** 批量更新排序（拖拽后） */
  static batchUpdateSort(items: Array<{ id: string; parent_id?: string | null; sort_order: number }>): void {
    const stmt = db.prepare(
      "UPDATE app_page_menus SET parent_id = ?, sort_order = ? WHERE id = ?",
    );

    const trans = db.transaction(() => {
      for (const item of items) {
        stmt.run(item.parent_id ?? null, item.sort_order, item.id);
      }
    });
    trans();
  }

  /** 删除菜单项（及其子项） */
  static delete(id: string): boolean {
    // 先递归删除子项
    const children = db
      .prepare("SELECT id FROM app_page_menus WHERE parent_id = ?")
      .all(id) as Array<{ id: string }>;
    for (const child of children) {
      AppPageMenuModel.delete(child.id);
    }

    const result = db.prepare("DELETE FROM app_page_menus WHERE id = ?").run(id);
    return result.changes > 0;
  }

  /** 检查页面是否已被某个应用挂载 */
  static isPageMounted(pageId: string): boolean {
    const result = db.prepare("SELECT 1 FROM app_page_menus WHERE page_id = ? LIMIT 1").get(pageId);
    return !!result;
  }

  /** 获取某个应用挂载的页面 ID 列表 */
  static getMountedPageIds(applicationId: string): string[] {
    const rows = db
      .prepare("SELECT DISTINCT page_id FROM app_page_menus WHERE application_id = ? AND page_id IS NOT NULL")
      .all(applicationId) as Array<{ page_id: string }>;
    return rows.map((r) => r.page_id);
  }
}

function rowToMenu(row: Record<string, unknown>): AppPageMenu {
  return {
    id: String(row.id),
    application_id: String(row.application_id),
    page_id: String(row.page_id),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    menu_title: String(row.menu_title),
    menu_icon: row.menu_icon ? String(row.menu_icon) : null,
    route_path: row.route_path ? String(row.route_path) : null,
    permission: row.permission ? String(row.permission) : null,
    sort_order: Number(row.sort_order),
    created_at: String(row.created_at),
  };
}

export default AppPageMenuModel;
