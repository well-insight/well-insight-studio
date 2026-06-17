/** 与主画布 gridColNum 一致：每列约 15px */
export const SLOT_COL_STEP_PX = 15
export const SLOT_ROW_HEIGHT = 15

export function calcSlotColNum(containerWidthPx: number) {
  return Math.max(1, Math.floor(containerWidthPx / SLOT_COL_STEP_PX))
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

/** 根据鼠标落点计算插槽内网格坐标 */
export function calcSlotDropLayout(
  slotEl: HTMLElement,
  clientX: number,
  clientY: number,
  block: { w?: number, h?: number },
): SlotGridLayout {
  const rect = slotEl.getBoundingClientRect()
  const colNum = calcSlotColNum(rect.width)
  const { w, h } = preserveBlockSizeInSlot(block, colNum)

  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const colWidth = rect.width / colNum
  const x = Math.max(0, Math.min(colNum - w, Math.floor(localX / colWidth)))
  const y = Math.max(0, Math.floor(localY / SLOT_ROW_HEIGHT))

  return { x, y, w, h }
}
