import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { defineStore } from 'pinia'

export type CanvasSelectHandler = (block: VisualEditorBlockData) => void

/**
 * 临时变量存储
 */
export const useControlStore = defineStore('useControlStore', {
  state: (): ControlStoreState => ({
    /**
     * 是否显示组件拖拽框
     */
    customComponentsVisible: false,
    moveVisualData: null,
    isDragging: false,
    draggingVisualKey: '',
    editScale: 1,
    layoutCollapse: true,
    settingCollapse: true,
    asideCollapse: false,
    floatingSettingVisible: false,
    floatingSettingActiveTab: 'attr',
    /** 画布选中回调（由 PcWrapper 注册，供层级树等调用） */
    canvasSelectHandler: null,
  }),
  actions: {
    registerCanvasSelectHandler(handler: CanvasSelectHandler) {
      this.canvasSelectHandler = handler
    },
    unregisterCanvasSelectHandler() {
      this.canvasSelectHandler = null
    },
    selectCanvasBlock(block: VisualEditorBlockData) {
      this.canvasSelectHandler?.(block)
    },
    setMoveVisualData(v: VisualEditorBlockData | null) {
      this.moveVisualData = v || null
    },
    setIsDragging(v: boolean) {
      this.isDragging = v
    },
    setDraggingVisualKey(k: string) {
      this.draggingVisualKey = k
    },
  },
})

export interface ControlStoreState {
  customComponentsVisible: boolean
  moveVisualData: VisualEditorBlockData | null
  isDragging: boolean
  editScale?: number
  layoutCollapse: boolean
  settingCollapse: boolean
  asideCollapse: boolean
  floatingSettingVisible: boolean
  floatingSettingActiveTab: string
  draggingVisualKey?: string
  canvasSelectHandler: CanvasSelectHandler | null
}
