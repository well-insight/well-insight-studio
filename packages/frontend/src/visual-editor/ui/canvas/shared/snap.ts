export interface SnapTargets {
  xs: number[] // vertical lines (for left/right/centerX)
  ys: number[] // horizontal lines (for top/bottom/centerY)
}

export interface SnapResult {
  /** delta to apply to left */
  dx: number
  /** delta to apply to top */
  dy: number
  /** optionally the snapped right (for resize) */
  snappedRight?: number
  /** optionally the snapped bottom (for resize) */
  snappedBottom?: number
  /** which guides were hit (for optional highlighting) */
  hitX?: number
  hitY?: number
}

export interface SnapOptions {
  threshold?: number
  // if true, we consider snapping the right edge when resizing from left etc. (future)
  // for now we support SE resize + full drag
}

/**
 * Find the closest value in targets to a given value, within threshold.
 */
function closest(targets: number[], value: number, threshold: number): { value: number, delta: number } | null {
  let best: { value: number, delta: number } | null = null
  for (const t of targets) {
    const d = t - value
    if (Math.abs(d) <= threshold) {
      if (!best || Math.abs(d) < Math.abs(best.delta)) {
        best = { value: t, delta: d }
      }
    }
  }
  return best
}

/**
 * Snap a dragging item.
 * Considers the item's left, right, centerX against xs targets.
 * Same for top/bottom/centerY against ys.
 * Returns the deltas to add to current left/top so that the closest edges/centers snap.
 */
export function snapDrag(
  current: { left: number, top: number, width: number, height: number },
  targets: SnapTargets,
  threshold = 8,
): SnapResult {
  const { left, top, width, height } = current
  const right = left + width
  const bottom = top + height
  const cx = left + width / 2
  const cy = top + height / 2

  let dx = 0
  let dy = 0
  let hitX: number | undefined
  let hitY: number | undefined

  // X: prefer snapping the edge/center that has a close target
  const candLeft = closest(targets.xs, left, threshold)
  const candRight = closest(targets.xs, right, threshold)
  const candCx = closest(targets.xs, cx, threshold)

  // pick the one with smallest absolute delta
  const xCands = [candLeft, candRight, candCx].filter(Boolean) as { value: number, delta: number }[]
  if (xCands.length) {
    xCands.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = xCands[0]
    dx = best.delta
    hitX = best.value
    // If we snapped via right or center, adjust dx accordingly for the *left* position
    if (best === candRight) {
      // we want right to become target => newLeft = target - width => delta = (target - right)
      dx = best.value - right
      hitX = best.value
    }
    else if (best === candCx) {
      dx = best.value - cx
    }
    // else left snap, dx already correct
  }

  const candTop = closest(targets.ys, top, threshold)
  const candBottom = closest(targets.ys, bottom, threshold)
  const candCy = closest(targets.ys, cy, threshold)

  const yCands = [candTop, candBottom, candCy].filter(Boolean) as { value: number, delta: number }[]
  if (yCands.length) {
    yCands.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = yCands[0]
    dy = best.delta
    hitY = best.value
    if (best === candBottom) {
      dy = best.value - bottom
    }
    else if (best === candCy) {
      dy = best.value - cy
    }
  }

  return { dx, dy, hitX, hitY }
}

/**
 * Snap during SE resize (bottom-right corner).
 * left/top are fixed. We compute tentative right/bottom and snap them.
 * Returns the snapped right and bottom (if within threshold), else the original tentative.
 */
export function snapResizeSE(
  current: { left: number, top: number, width: number, height: number },
  targets: SnapTargets,
  threshold = 8,
): { width: number, height: number, snappedRight?: number, snappedBottom?: number } {
  const { left, top, width, height } = current
  const tentativeRight = left + width
  const tentativeBottom = top + height

  let snappedRight = tentativeRight
  let snappedBottom = tentativeBottom

  const hitRight = closest(targets.xs, tentativeRight, threshold)
  if (hitRight) {
    snappedRight = hitRight.value
  }

  const hitBottom = closest(targets.ys, tentativeBottom, threshold)
  if (hitBottom) {
    snappedBottom = hitBottom.value
  }

  const newW = Math.max(20, Math.round(snappedRight - left))
  const newH = Math.max(20, Math.round(snappedBottom - top))

  return {
    width: newW,
    height: newH,
    snappedRight: hitRight ? snappedRight : undefined,
    snappedBottom: hitBottom ? snappedBottom : undefined,
  }
}

/**
 * Build snap targets from a list of other rects + container bounds + centers.
 */
export function buildSnapTargets(
  otherRects: Array<{ left: number, top: number, width: number, height: number }>,
  containerWidth: number,
  containerHeight: number,
): SnapTargets {
  const xs = new Set<number>()
  const ys = new Set<number>()

  // canvas
  xs.add(0)
  xs.add(containerWidth)
  xs.add(containerWidth / 2)
  ys.add(0)
  ys.add(containerHeight)
  ys.add(containerHeight / 2)

  for (const r of otherRects) {
    const l = r.left
    const rgt = r.left + r.width
    const cx = r.left + r.width / 2
    const t = r.top
    const b = r.top + r.height
    const cy = r.top + r.height / 2

    xs.add(l)
    xs.add(rgt)
    xs.add(cx)
    ys.add(t)
    ys.add(b)
    ys.add(cy)
  }

  return {
    xs: Array.from(xs).sort((a, b) => a - b),
    ys: Array.from(ys).sort((a, b) => a - b),
  }
}
