/**
 * Pinia 与业务 store 统一入口（应用内优先从此处或各子模块文件导入，避免混用 @/store 旧路径）
 */
export { store, setupStore } from "./pinia";
export { useAuthStore, getAuthStore } from "./auth";
export { useControlStore, type ControlStoreState } from "./controlStore";
export {
  useWorkspaceStore,
  useWorkspaceStoreWithout,
  type Workspace,
  type WorkspaceApp,
  type AppScreen,
  type ScreenProps,
  type ScreenRouting,
  type SimpleMenuOption,
  type WorkspaceState,
} from "./workspaceStore";
