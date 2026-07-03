import { db } from "../config/database";
import { generateSnowflakeId } from "../utils/snowflake";

export interface AppPageMenu {
  id: string;
  application_id: string;
  page_id: string;
  parent_id: string | null;
  menu_title: string;
  menu_icon: string | null;
  sort_order: number;
  route_path: string | null;
}

export interface CreateMenuInput {
  application_id: string;
  page_id: string;
  parent_id?: string | null;
  menu_title: string;
  menu_icon?: string | null;
  route_path?: string | null;
}

export interface UpdateMenuInput {
  menu_title?: string;
  menu_icon?: string | null;
  route_path?: string | null;
  parent_id?: string | null;
  sort_order?: number;
}

export interface SortMenuItem {
  id: string;
  parent_id: string | null;
  sort_order: number;
}

function rowToMenu(row: Record<string, unknown>): AppPageMenu {
  return {
    id: row.id as string,
    application_id: row.application_id as string,
    page_id: row.page_id as string,
    parent_id: row.parent_id as string | null,
    menu_title: row.menu_title as string,
    menu_icon: row.menu_icon as string | null,
    sort_order: row.sort_order as number,
    route_path: row.route_path as string | null,
  };
}

export class AppPageMenuModel {
  static findById(id: string): AppPageMenu | undefined {
    const row = db.prepare("SELECT * FROM app_page_menus WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? rowToMenu(row) : undefined;
  }

  /** 获取应用下的所有菜单项（平铺） */
  static listByApp(applicationId: string): AppPageMenu[] {
    const rows = db
      .prepare("SELECT * FROM app_page_menus WHERE application_id = ? ORDER BY sort_order ASC, id ASC")
      .all(applicationId) as Record<string, unknown>[];
    return rows.map(rowToMenu);
  }

  /** 获取应用下的菜单树（含关联页面信息） */
  static getMenuTree(applicationId: string): Array<Record<string, unknown>> {
    const rows = db
      .prepare(
        `SELECT
           m.id, m.application_id, m.page_id, m.parent_id,
           m.menu_title, m.menu_icon, m.sort_order, m.route_path,
           p.id AS page__id, p.name AS page__name, p.type AS page__type, p.status AS page__status
         FROM app_page_menus m
         LEFT JOIN pages p ON p.id = m.page_id
         WHERE m.application_id = ?
         ORDER BY m.sort_order ASC, m.id ASC`
      )
      .all(applicationId) as Record<string, unknown>[];

    const flat = rows.map((r) => ({
      id: r.id,
      menu_title: r.menu_title,
      route_path: r.route_path,
      menu_icon: r.menu_icon,
      sort_order: r.sort_order,
      parent_id: r.parent_id,
      isFolder: r.page_id === null || r.page_id === "",
      page: r.page__id
        ? {
            id: r.page__id,
            name: r.page__name,
            type: r.page__type,
            status: r.page__status,
          }
        : null,
    }));

    return AppPageMenuModel.buildTree(flat, null);
  }

  private static buildTree(
    items: Array<Record<string, unknown>>,
    parentId: string | null,
  ): Array<Record<string, unknown>> {
    return items
      .filter((item) => (item.parent_id ?? null) === parentId)
      .map((item) => ({
        ...item,
        children: AppPageMenuModel.buildTree(items, item.id as string),
      }));
  }

  static create(data: CreateMenuInput): string {
    const id = generateSnowflakeId();
    // 计算 sort_order：取同级最大 + 1
    const maxSort = db
      .prepare(
        `SELECT COALESCE(MAX(sort_order), -1) AS mx FROM app_page_menus
         WHERE application_id = ? AND parent_id IS ?`
      )
      .get(data.application_id, data.parent_id ?? null) as { mx: number };
    const sortOrder = maxSort.mx + 1;

    db.prepare(
      `INSERT INTO app_page_menus (id, application_id, page_id, parent_id, menu_title, menu_icon, sort_order, route_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.application_id,
      data.page_id,
      data.parent_id ?? null,
      data.menu_title,
      data.menu_icon ?? null,
      sortOrder,
      data.route_path ?? null,
    );
    return id;
  }

  static update(id: string, data: UpdateMenuInput): boolean {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.menu_title !== undefined) {
      sets.push("menu_title = ?");
      params.push(data.menu_title);
    }
    if (data.menu_icon !== undefined) {
      sets.push("menu_icon = ?");
      params.push(data.menu_icon);
    }
    if (data.route_path !== undefined) {
      sets.push("route_path = ?");
      params.push(data.route_path);
    }
    if (data.parent_id !== undefined) {
      sets.push("parent_id = ?");
      params.push(data.parent_id);
    }
    if (data.sort_order !== undefined) {
      sets.push("sort_order = ?");
      params.push(data.sort_order);
    }

    if (sets.length === 0) return false;

    params.push(id);
    const result = db
      .prepare(`UPDATE app_page_menus SET ${sets.join(", ")} WHERE id = ?`)
      .run(...params);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    // 将子菜单移到根级
    db.prepare("UPDATE app_page_menus SET parent_id = NULL WHERE parent_id = ?").run(id);
    const result = db.prepare("DELETE FROM app_page_menus WHERE id = ?").run(id);
    return result.changes > 0;
  }

  /** 批量更新排序/层级 */
  static batchSort(applicationId: string, menus: SortMenuItem[]): void {
    const updateStmt = db.prepare(
      "UPDATE app_page_menus SET parent_id = ?, sort_order = ? WHERE id = ? AND application_id = ?"
    );
    const transaction = db.transaction(() => {
      for (const item of menus) {
        updateStmt.run(item.parent_id, item.sort_order, item.id, applicationId);
      }
    });
    transaction();
  }

  /** 删除应用下所有菜单 */
  static deleteByApp(applicationId: string): void {
    db.prepare("DELETE FROM app_page_menus WHERE application_id = ?").run(applicationId);
  }
}
