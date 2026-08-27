import type { Widget } from '@well-insight/shared'
import type { Ref } from 'vue'
import { useWidgetStore } from '../styles/stores/widgetStore'
import { snapToGrid } from './useDrag'

const MIN_WIDTH = 110
const MIN_HEIGHT = 70

interface ResizeState {
  id: string
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  moved: boolean
}

/** 画布组件右下角缩放（8px 网格吸附） */
export function useResize(zoom: Ref<number>) {
  const store = useWidgetStore()
  let resizeState: ResizeState | null = null

  function onMove(e: MouseEvent) {
    if (!resizeState) return
    const dx = (e.clientX - resizeState.startX) / zoom.value
    const dy = (e.clientY - resizeState.startY) / zoom.value
    const width = Math.max(MIN_WIDTH, snapToGrid(resizeState.startWidth + dx))
    const height = Math.max(MIN_HEIGHT, snapToGrid(resizeState.startHeight + dy))
    const w = store.widgets.find(w => w.id === resizeState!.id)
    if (!w) return
    if (width !== w.width || height !== w.height) resizeState.moved = true
    store.setSize(w.id, width, height)
  }

  function onUp() {
    if (resizeState && !resizeState.moved) store.popHistoryIfUnchanged()
    resizeState = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  function startResize(e: MouseEvent, widget: Widget) {
    if (widget.locked || e.button !== 0) return
    store.pushHistory()
    resizeState = {
      id: widget.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.width,
      startHeight: widget.height,
      moved: false,
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    e.preventDefault()
    e.stopPropagation()
  }

  return { startResize }
}
