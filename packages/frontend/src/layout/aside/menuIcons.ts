/**
 * 侧栏 / 顶栏菜单图标。
 * - svg：走 SvgIcon（如 workbench）
 * - ep：Element Plus 矢量组件（避免部分 sprite 图标发糊）
 */
import type { Component } from 'vue'
import {
  Connection,
  DataAnalysis,
  DataBoard,
  Grid,
  Monitor,
  PieChart,
} from '@element-plus/icons-vue'

export type MenuIconRef =
  | { kind: 'svg', name: string }
  | { kind: 'ep', component: Component }

/** key 与 workspaceStore.menuList.meta.icon 对齐 */
const MENU_ICON_MAP: Record<string, MenuIconRef> = {
  workbench: { kind: 'svg', name: 'workbench' },
  dashboard: { kind: 'svg', name: 'workbench' },
  chart: { kind: 'ep', component: Monitor },
  dataset: { kind: 'ep', component: DataAnalysis },
  'component-chart': { kind: 'ep', component: PieChart },
  'component-base': { kind: 'ep', component: Grid },
  api: { kind: 'ep', component: Connection },
}

export function resolveMenuIcon(name?: string | null): MenuIconRef {
  if (name && MENU_ICON_MAP[name])
    return MENU_ICON_MAP[name]
  return { kind: 'ep', component: DataBoard }
}

export function isSvgMenuIcon(icon: MenuIconRef): icon is Extract<MenuIconRef, { kind: 'svg' }> {
  return icon.kind === 'svg'
}
