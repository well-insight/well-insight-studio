import type { Widget, WidgetType } from '@well-insight/shared'
import { defineStore } from 'pinia'

const MAX_HISTORY = 50

export const WIDGET_DEFAULTS: Record<WidgetType, { label: string; width: number; height: number }> = {
  kpi: { label: '指标卡', width: 180, height: 110 },
  bar: { label: '柱状图', width: 240, height: 150 },
  line: { label: '折线图', width: 240, height: 150 },
  pie: { label: '饼图', width: 220, height: 160 },
  table: { label: '表格', width: 280, height: 170 },
}

export const COLOR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
]

interface Snapshot {
  widgets: Widget[]
  selectedId: string | null
}

interface WidgetStoreState extends Snapshot {
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  /** 属性面板连续编辑合并：相同 key 且间隔小于阈值时不重复压栈 */
  lastEditKey: string | null
  lastEditTime: number
}

const EDIT_COALESCE_MS = 1000

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const useWidgetStore = defineStore('widget', {
  state: (): WidgetStoreState => ({
    widgets: [],
    selectedId: null,
    undoStack: [],
    redoStack: [],
    lastEditKey: null,
    lastEditTime: 0,
  }),

  getters: {
    selectedWidget(state): Widget | null {
      return state.widgets.find(w => w.id === state.selectedId) ?? null
    },
    canUndo: state => state.undoStack.length > 0,
    canRedo: state => state.redoStack.length > 0,
  },

  actions: {
    /** 在每次变更前调用：压入当前状态快照 */
    pushHistory() {
      this.undoStack.push(clone({ widgets: this.widgets, selectedId: this.selectedId }))
      if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
      this.redoStack = []
    },

    /** 拖拽/缩放未产生位移时回滚上一次快照，避免污染历史栈 */
    popHistoryIfUnchanged() {
      this.undoStack.pop()
    },

    undo() {
      const snap = this.undoStack.pop()
      if (!snap) return
      this.redoStack.push(clone({ widgets: this.widgets, selectedId: this.selectedId }))
      this.widgets = snap.widgets
      this.selectedId = snap.selectedId
    },

    redo() {
      const snap = this.redoStack.pop()
      if (!snap) return
      this.undoStack.push(clone({ widgets: this.widgets, selectedId: this.selectedId }))
      this.widgets = snap.widgets
      this.selectedId = snap.selectedId
    },

    addWidget(type: WidgetType, options: Partial<Widget> = {}): Widget {
      this.pushHistory()
      const defaults = WIDGET_DEFAULTS[type]!
      const baseX = 12 + (this.widgets.length * 20) % 320
      const baseY = 12 + (this.widgets.length * 16) % 220
      const widget: Widget = {
        id: crypto.randomUUID(),
        type,
        title: options.title ?? `${defaults.label} ${this.widgets.length + 1}`,
        dataSource: options.dataSource ?? 'orders',
        x: options.x ?? baseX,
        y: options.y ?? baseY,
        width: options.width ?? defaults.width,
        height: options.height ?? defaults.height,
        color: options.color ?? COLOR_PALETTE[this.widgets.length % COLOR_PALETTE.length]!,
        visible: options.visible ?? true,
        locked: options.locked ?? false,
        config: options.config ?? { fieldOps: {}, visibleFields: [] },
      }
      this.widgets.push(widget)
      this.selectedId = widget.id
      return widget
    },

    removeWidget(id: string) {
      const idx = this.widgets.findIndex(w => w.id === id)
      if (idx === -1) return
      this.pushHistory()
      this.widgets.splice(idx, 1)
      if (this.selectedId === id) this.selectedId = null
    },

    updateWidget(id: string, props: Partial<Widget>, coalesceKey?: string) {
      const w = this.widgets.find(w => w.id === id)
      if (!w) return
      const now = Date.now()
      const coalescable =
        coalesceKey !== undefined &&
        coalesceKey === this.lastEditKey &&
        now - this.lastEditTime < EDIT_COALESCE_MS
      if (!coalescable) this.pushHistory()
      this.lastEditKey = coalesceKey ?? null
      this.lastEditTime = now
      Object.assign(w, props)
    },

    /** 拖拽/缩放过程中的高频更新，不压历史栈（历史在交互开始时已压入） */
    setPosition(id: string, x: number, y: number) {
      const w = this.widgets.find(w => w.id === id)
      if (!w) return
      w.x = x
      w.y = y
    },

    setSize(id: string, width: number, height: number) {
      const w = this.widgets.find(w => w.id === id)
      if (!w) return
      w.width = width
      w.height = height
    },

    selectWidget(id: string | null) {
      this.selectedId = id
    },

    toggleVisibility(id: string) {
      const w = this.widgets.find(w => w.id === id)
      if (!w) return
      this.pushHistory()
      w.visible = !w.visible
    },

    toggleLock(id: string) {
      const w = this.widgets.find(w => w.id === id)
      if (!w) return
      this.pushHistory()
      w.locked = !w.locked
    },

    moveLayer(id: string, direction: 1 | -1) {
      const idx = this.widgets.findIndex(w => w.id === id)
      const newIdx = idx + direction
      if (idx === -1 || newIdx < 0 || newIdx >= this.widgets.length) return
      this.pushHistory()
      const [item] = this.widgets.splice(idx, 1)
      this.widgets.splice(newIdx, 0, item!)
    },

    clear() {
      if (this.widgets.length === 0) return
      this.pushHistory()
      this.widgets = []
      this.selectedId = null
    },
  },
})
