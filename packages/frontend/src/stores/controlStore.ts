import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { defineStore } from 'pinia'

export interface CanvasSelectOptions {
  /** Ctrl/Cmd 多选：切换当前块选中状态 */
  multiSelect?: boolean
}

export type CanvasSelectHandler = (block: VisualEditorBlockData, options?: CanvasSelectOptions) => void
export type CanvasClearSelectionHandler = () => void

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
    canvasClearSelectionHandler: null,
    /** 画布多选 id 列表（由 PcWrapper 同步，供层级树展示） */
    canvasSelectedBlockIds: [] as string[],
  }),
  actions: {
    registerCanvasSelectHandler(handler: CanvasSelectHandler) {
      this.canvasSelectHandler = handler
    },
    unregisterCanvasSelectHandler() {
      this.canvasSelectHandler = null
    },
    registerCanvasClearSelectionHandler(handler: CanvasClearSelectionHandler) {
      this.canvasClearSelectionHandler = handler
    },
    unregisterCanvasClearSelectionHandler() {
      this.canvasClearSelectionHandler = null
    },
    selectCanvasBlock(block: VisualEditorBlockData, options?: CanvasSelectOptions) {
      this.canvasSelectHandler?.(block, options)
    },
    clearCanvasSelection() {
      this.canvasClearSelectionHandler?.()
      this.canvasSelectedBlockIds = []
    },
    setCanvasSelectedBlockIds(ids: string[]) {
      this.canvasSelectedBlockIds = ids
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
  canvasClearSelectionHandler: CanvasClearSelectionHandler | null
  canvasSelectedBlockIds: string[]
}
