export { getAuthStore, useAuthStore } from './auth'
export { type ControlStoreState, useControlStore } from './controlStore'
export { useThemeStore } from './themeStore'
export { useCanvasThemeStore } from './canvasThemeStore'
/**
 * Pinia 与业务 store 统一入口（应用内优先从此处或各子模块文件导入，避免混用 @/store 旧路径）
 */
export { setupStore, store } from './pinia'
export {
  type AppScreen,
  type ScreenProps,
  type ScreenRouting,
  type SimpleMenuOption,
  useWorkspaceStore,
  useWorkspaceStoreWithout,
  type Workspace,
  type WorkspaceApp,
  type WorkspaceState,
} from './workspaceStore'
