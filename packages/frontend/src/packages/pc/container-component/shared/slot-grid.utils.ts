/** 与根画布横向网格逻辑一致：每列约 15px 步长（仅用于回退）。 */
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
 * 与 PcWrapper.getGridMetrics / GridLayoutPlus 保持一致的槽内网格度量。
 * - cols 必须是稳定的（来自设计宽度或显式 colNum prop），不能随当前容器像素宽度变化。
 * - 仅使用 containerWidthPx 计算当前的 colWidth，实现“列数固定、宽度变化时左右贴边”。
 * - colWidth = (containerWidth - margin*(cols+1)) / cols
 * - 位置公式：round( totalSpace * col / cols ) + margin*(col+1)
 */
export function getSlotGridMetrics(containerWidthPx: number, cols?: number): SlotGridMetrics {
  const rowHeight = SLOT_ROW_HEIGHT
  const margin: [number, number] = [0, 0]
  const containerWidth = Math.max(1, containerWidthPx || 100)
  // 优先使用调用方提供的稳定列数；否则回退到按宽度动态（旧行为，不推荐）
  let c = cols && cols > 0 ? Math.floor(cols) : 0
  if (!c) {
    c = Math.max(1, Math.floor(containerWidth / SLOT_COL_STEP_PX))
  }
  const totalSpace = containerWidth - margin[0] * (c + 1)
  const colWidth = totalSpace / c
  return { containerWidth, cols: c, colWidth, rowHeight, margin }
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

/**
 * 根据鼠标落点计算插槽内网格坐标。
 * 优先使用显式 targetCols 或元素上的 data-col-num 作为稳定列数。
 * 这样当容器/页面宽度变化时，x/w 相对“列数”是固定的，左右贴边行为与 GridLayoutPlus 一致。
 */
export function calcSlotDropLayout(
  slotEl: HTMLElement,
  clientX: number,
  clientY: number,
  block: { w?: number, h?: number },
  targetCols?: number,
): SlotGridLayout {
  const rect = slotEl.getBoundingClientRect()
  // 尝试从 DOM 属性或参数获取稳定的列数
  const dataColsAttr = Number.parseInt(slotEl.getAttribute('data-col-num') || '0', 10)
  const resolvedCols = targetCols && targetCols > 0 ? targetCols : (dataColsAttr > 0 ? dataColsAttr : undefined)
  const m = getSlotGridMetrics(rect.width, resolvedCols)
  const { w, h } = preserveBlockSizeInSlot(block, m.cols)

  const localX = clientX - rect.left
  const localY = clientY - rect.top

  // 与根画布一致：使用 colWidth 和 Math.round 转网格
  const x = Math.max(0, Math.min(m.cols - w, Math.round(localX / m.colWidth)))
  const y = Math.max(0, Math.round(localY / m.rowHeight))

  return { x, y, w, h }
}
