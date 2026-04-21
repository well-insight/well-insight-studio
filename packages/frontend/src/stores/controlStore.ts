import type { VisualEditorBlockData } from "@/visual-editor/visual-editor.utils";
import { defineStore } from "pinia";

/**
 * 临时变量存储
 */
export const useControlStore = defineStore("useControlStore", {
  state: (): ControlStoreState => ({
    /**
     * 是否显示组件拖拽框
     */
    customComponentsVisible: false,
    moveVisualData: null,
    editScale: 1,
    layoutCollapse: false,
    settingCollapse: true,
    asideCollapse: true,
    floatingSettingVisible: false,
  }),
  actions: {
    setMoveVisualData(v: VisualEditorBlockData | null) {
      this.moveVisualData = v || null;
    },
  },
});

export interface ControlStoreState {
  customComponentsVisible: boolean;
  moveVisualData: VisualEditorBlockData | null;
  editScale?: number;
  layoutCollapse: boolean;
  settingCollapse: boolean;
  asideCollapse: boolean;
  floatingSettingVisible: boolean;
}
