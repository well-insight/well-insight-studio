/** 与根画布横向网格逻辑一致：每列约 15px 步长，按容器实际宽度自适应 */
export const SLOT_COL_STEP_PX = 15
export const SLOT_ROW_HEIGHT = 15

export function calcSlotColNum(containerWidthPx: number) {
  return Math.max(1, Math.floor(containerWidthPx / SLOT_COL_STEP_PX))
}

export interface SlotGridMetrics {
  containerWidth: number
  cols: number
  colWidth: number
  rowHeight: number
  margin: [number, number]
}

/**
 * 与 PcWrapper.getGridMetrics 逻辑完全一致的槽内网格度量计算。
 * 横向网格按照画布容器宽度自适应（cols = floor(width/15)），
 * colWidth = (containerWidth - margin*(cols+1)) / cols
 */
export function getSlotGridMetrics(containerWidthPx: number): SlotGridMetrics {
  const rowHeight = SLOT_ROW_HEIGHT
  const margin: [number, number] = [0, 0]
  const containerWidth = Math.max(1, containerWidthPx || (12 * 15))
  const cols = Math.max(1, Math.floor(containerWidth / SLOT_COL_STEP_PX))
  const totalSpace = containerWidth - margin[0] * (cols + 1)
  const colWidth = totalSpace / cols
  return { containerWidth, cols, colWidth, rowHeight, margin }
}

/** 与根画布 calcGridColLeft 一致 */
export function calcSlotColLeft(col: number, m: SlotGridMetrics) {
  const totalSpace = m.containerWidth - m.margin[0] * (m.cols + 1)
  return Math.round(totalSpace * col / m.cols) + m.margin[0] * (col + 1)
}

/** 与根画布 calcGridRowTop 一致 */
export function calcSlotRowTop(row: number, m: SlotGridMetrics) {
  return Math.round(m.rowHeight * row) + m.margin[1] * (row + 1)
}

export interface SlotGridLayout {
  x: number
  y: number
  w: number
  h: number
}

/** 将组件在主画布上的网格尺寸换算为插槽内尺寸（保持像素大小不变） */
export function preserveBlockSizeInSlot(
  block: { w?: number, h?: number },
  slotColNum: number,
): Pick<SlotGridLayout, 'w' | 'h'> {
  const w = Math.max(1, block.w ?? 4)
  const h = Math.max(1, block.h ?? 2)
  return {
    w: Math.min(slotColNum, w),
    h,
  }
}

/** 根据鼠标落点计算插槽内网格坐标（横向网格逻辑与根画布一致） */
export function calcSlotDropLayout(
  slotEl: HTMLElement,
  clientX: number,
  clientY: number,
  block: { w?: number, h?: number },
): SlotGridLayout {
  const rect = slotEl.getBoundingClientRect()
  const m = getSlotGridMetrics(rect.width)
  const { w, h } = preserveBlockSizeInSlot(block, m.cols)

  const localX = clientX - rect.left
  const localY = clientY - rect.top

  // 与根画布一致：使用 colWidth 和 Math.round 转网格
  const x = Math.max(0, Math.min(m.cols - w, Math.round(localX / m.colWidth)))
  const y = Math.max(0, Math.round(localY / m.rowHeight))

  return { x, y, w, h }
}
