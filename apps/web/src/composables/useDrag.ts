import type { Widget } from '@well-insight/shared'
import type { Ref } from 'vue'
import { useWidgetStore } from '../styles/stores/widgetStore'

export const GRID_SIZE = 8
export const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

interface DragState {
  id: string
  offsetX: number
  offsetY: number
  moved: boolean
}

/**
 * 画布组件拖拽移动。
 * 坐标系说明：容器有 CSS scale 缩放，getBoundingClientRect 返回缩放后的屏幕坐标，
 * 因此除以 zoom 换算回画布逻辑坐标。
 */
export function useDrag(containerRef: Ref<HTMLElement | null>, zoom: Ref<number>) {
  const store = useWidgetStore()
  let dragState: DragState | null = null

  function onMove(e: MouseEvent) {
    const el = containerRef.value
    if (!dragState || !el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, snapToGrid((e.clientX - rect.left) / zoom.value - dragState.offsetX))
    const y = Math.max(0, snapToGrid((e.clientY - rect.top) / zoom.value - dragState.offsetY))
    const w = store.widgets.find(w => w.id === dragState!.id)
    if (!w || w.locked) return
    if (x !== w.x || y !== w.y) dragState.moved = true
    store.setPosition(w.id, x, y)
  }

  function onUp() {
    if (dragState && !dragState.moved) store.popHistoryIfUnchanged()
    dragState = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  function startDrag(e: MouseEvent, widget: Widget) {
    if (widget.locked || e.button !== 0) return
    const el = containerRef.value
    if (!el) return
    store.pushHistory()
    const rect = el.getBoundingClientRect()
    dragState = {
      id: widget.id,
      offsetX: (e.clientX - rect.left) / zoom.value - widget.x,
      offsetY: (e.clientY - rect.top) / zoom.value - widget.y,
      moved: false,
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    e.preventDefault()
  }

  return { startDrag }
}
