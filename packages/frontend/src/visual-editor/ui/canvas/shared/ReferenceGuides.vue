<script lang="ts" setup>
import { computed } from 'vue'

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

const props = defineProps({
  containerWidth: { type: Number, default: 0 },
  containerHeight: { type: Number, default: 0 },
  /** Other (non-active) item rects in the same coordinate space */
  otherRects: { type: Array as () => Rect[], default: () => [] },
  /** The item currently being dragged (live visual rect) */
  activeRect: { type: Object as () => Rect | null, default: null },
  /** Show the overlay */
  visible: { type: Boolean, default: true },
  /** Pixel threshold to consider "close" for showing a guide */
  threshold: { type: Number, default: 8 },
})

interface GuideLine { pos: number }
interface DistanceInd {
  orientation: 'h' | 'v' // 'h' means gap measured horizontally (vertical edges), connector is horizontal
  start: number
  end: number
  cross: number // the perpendicular coordinate to place the connector
  value: number
}

const THRESH = computed(() => props.threshold)

const verticalGuideLines = computed<GuideLine[]>(() => {
  if (!props.activeRect) {
    return []
  }
  const set = new Set<number>()
  const { left: al, width: aw } = props.activeRect
  const ar = al + aw
  const acx = al + aw / 2

  // canvas specials
  addClose(set, 0, al, ar, acx)
  addClose(set, props.containerWidth, al, ar, acx)
  addClose(set, props.containerWidth / 2, al, ar, acx)

  // other rects
  for (const r of props.otherRects) {
    const ol = r.left
    const or = r.left + r.width
    const ocx = r.left + r.width / 2
    addClose(set, ol, al, ar, acx)
    addClose(set, or, al, ar, acx)
    addClose(set, ocx, al, ar, acx)
  }

  return Array.from(set).sort((a, b) => a - b).map(pos => ({ pos }))
})

const horizontalGuideLines = computed<GuideLine[]>(() => {
  if (!props.activeRect) {
    return []
  }
  const set = new Set<number>()
  const { top: at, height: ah } = props.activeRect
  const ab = at + ah
  const acy = at + ah / 2

  addClose(set, 0, at, ab, acy)
  addClose(set, props.containerHeight, at, ab, acy)
  addClose(set, props.containerHeight / 2, at, ab, acy)

  for (const r of props.otherRects) {
    const ot = r.top
    const ob = r.top + r.height
    const ocy = r.top + r.height / 2
    addClose(set, ot, at, ab, acy)
    addClose(set, ob, at, ab, acy)
    addClose(set, ocy, at, ab, acy)
  }

  return Array.from(set).sort((a, b) => a - b).map(pos => ({ pos }))
})

function addClose(set: Set<number>, candidate: number, a1: number, a2: number, ac: number) {
  if (Math.abs(candidate - a1) <= THRESH.value) {
    set.add(Math.round(candidate))
  }
  if (Math.abs(candidate - a2) <= THRESH.value) {
    set.add(Math.round(candidate))
  }
  if (Math.abs(candidate - ac) <= THRESH.value) {
    set.add(Math.round(candidate))
  }
}

const distanceIndicators = computed<DistanceInd[]>(() => {
  const res: DistanceInd[] = []
  if (!props.activeRect) {
    return res
  }
  const a = props.activeRect
  const al = a.left
  const ar = a.left + a.width
  const at = a.top
  const ab = a.top + a.height
  const acx = al + a.width / 2
  const acy = at + a.height / 2

  const pushH = (start: number, end: number, cross: number, val: number) => {
    if (val <= 0) {
      return
    }
    res.push({ orientation: 'h', start: Math.round(start), end: Math.round(end), cross: Math.round(cross), value: Math.round(val) })
  }
  const pushV = (start: number, end: number, cross: number, val: number) => {
    if (val <= 0) {
      return
    }
    res.push({ orientation: 'v', start: Math.round(start), end: Math.round(end), cross: Math.round(cross), value: Math.round(val) })
  }

  // Canvas bounds distances (horizontal gaps)
  pushH(0, al, acy, al - 0)
  pushH(ar, props.containerWidth, acy, props.containerWidth - ar)
  // vertical gaps to top/bottom
  pushV(0, at, acx, at - 0)
  pushV(ab, props.containerHeight, acx, props.containerHeight - ab)

  // canvas centers (distance indicators)
  const vmid = props.containerWidth / 2
  const hmid = props.containerHeight / 2
  if (Math.abs(acx - vmid) <= THRESH.value * 2) {
    const s = Math.min(acx, vmid)
    const e = Math.max(acx, vmid)
    pushH(s, e, acy, Math.abs(acx - vmid))
  }
  if (Math.abs(acy - hmid) <= THRESH.value * 2) {
    const s = Math.min(acy, hmid)
    const e = Math.max(acy, hmid)
    pushV(s, e, acx, Math.abs(acy - hmid))
  }

  // Other components
  for (const o of props.otherRects) {
    const ol = o.left
    const or = o.left + o.width
    const ot = o.top
    const ob = o.top + o.height

    // active left vs other right
    const d1 = al - or
    if (Math.abs(d1) <= THRESH.value) {
      const overlapTop = Math.max(at, ot)
      const overlapBot = Math.min(ab, ob)
      const cross = (overlapTop + overlapBot) / 2
      if (overlapBot > overlapTop) {
        pushH(or, al, cross, Math.abs(d1))
      }
    }
    // active right vs other left
    const d2 = ol - ar
    if (Math.abs(d2) <= THRESH.value) {
      const overlapTop = Math.max(at, ot)
      const overlapBot = Math.min(ab, ob)
      const cross = (overlapTop + overlapBot) / 2
      if (overlapBot > overlapTop) {
        pushH(ar, ol, cross, Math.abs(d2))
      }
    }

    // vertical gaps
    const d3 = at - ob
    if (Math.abs(d3) <= THRESH.value) {
      const overlapLeft = Math.max(al, ol)
      const overlapRight = Math.min(ar, or)
      const cross = (overlapLeft + overlapRight) / 2
      if (overlapRight > overlapLeft) {
        pushV(ob, at, cross, Math.abs(d3))
      }
    }
    const d4 = ot - ab
    if (Math.abs(d4) <= THRESH.value) {
      const overlapLeft = Math.max(al, ol)
      const overlapRight = Math.min(ar, or)
      const cross = (overlapLeft + overlapRight) / 2
      if (overlapRight > overlapLeft) {
        pushV(ab, ot, cross, Math.abs(d4))
      }
    }

    // same-side alignments within threshold
    if (Math.abs(al - ol) <= THRESH.value) {
      const cross = (Math.max(at, ot) + Math.min(ab, ob)) / 2
      pushH(Math.min(al, ol), Math.max(al, ol), cross, Math.abs(al - ol))
    }
    if (Math.abs(ar - or) <= THRESH.value) {
      const cross = (Math.max(at, ot) + Math.min(ab, ob)) / 2
      pushH(Math.min(ar, or), Math.max(ar, or), cross, Math.abs(ar - or))
    }
    if (Math.abs(at - ot) <= THRESH.value) {
      const cross = (Math.max(al, ol) + Math.min(ar, or)) / 2
      pushV(Math.min(at, ot), Math.max(at, ot), cross, Math.abs(at - ot))
    }
    if (Math.abs(ab - ob) <= THRESH.value) {
      const cross = (Math.max(al, ol) + Math.min(ar, or)) / 2
      pushV(Math.min(ab, ob), Math.max(ab, ob), cross, Math.abs(ab - ob))
    }
  }

  // Dedup
  const seen = new Set<string>()
  return res.filter((d) => {
    const key = `${d.orientation}:${Math.round(d.start)}:${Math.round(d.end)}:${Math.round(d.cross)}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
})

function isCenterLine(pos: number, dir: 'v' | 'h') {
  if (dir === 'v') {
    return Math.abs(pos - props.containerWidth / 2) < 1
  }
  return Math.abs(pos - props.containerHeight / 2) < 1
}
</script>

<template>
  <div
    v-if="visible && containerWidth > 0 && containerHeight > 0"
    class="reference-guides"
    :style="{
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      pointerEvents: 'none',
      zIndex: 50,
      overflow: 'visible',
    }"
  >
    <!-- Full-span alignment guide lines (vertical) -->
    <div
      v-for="(line, idx) in verticalGuideLines"
      :key="`v${idx}`"
      class="guide-line guide-v"
      :class="{ 'is-center': isCenterLine(line.pos, 'v') }"
      :style="{ left: `${line.pos}px` }"
    />

    <!-- Full-span alignment guide lines (horizontal) -->
    <div
      v-for="(line, idx) in horizontalGuideLines"
      :key="`h${idx}`"
      class="guide-line guide-h"
      :class="{ 'is-center': isCenterLine(line.pos, 'h') }"
      :style="{ top: `${line.pos}px` }"
    />

    <!-- Distance indicators -->
    <template v-for="(d, idx) in distanceIndicators" :key="`d${idx}`">
      <!-- Connector line for the gap -->
      <div
        class="dist-connector"
        :class="d.orientation === 'h' ? 'dist-h' : 'dist-v'"
        :style="d.orientation === 'h'
          ? { left: `${Math.min(d.start, d.end)}px`, top: `${d.cross}px`, width: `${Math.abs(d.end - d.start)}px` }
          : { top: `${Math.min(d.start, d.end)}px`, left: `${d.cross}px`, height: `${Math.abs(d.end - d.start)}px` }"
      />
      <!-- Label pill -->
      <div
        class="dist-label"
        :style="d.orientation === 'h'
          ? { left: `${(d.start + d.end) / 2}px`, top: `${d.cross}px`, transform: 'translate(-50%, -50%)' }
          : { top: `${(d.start + d.end) / 2}px`, left: `${d.cross}px`, transform: 'translate(-50%, -50%)' }"
      >
        {{ d.value }}px
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.reference-guides {
  /* container for all visual guides */
}

.guide-line {
  position: absolute;
  background: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25);
  pointer-events: none;
  z-index: 5;
}

.guide-v {
  top: 0;
  bottom: 0;
  width: 1px;
}

.guide-h {
  left: 0;
  right: 0;
  height: 1px;
}

.guide-line.is-center {
  background: #67c23a;
  box-shadow: 0 0 0 1px rgba(103, 194, 58, 0.25);
}

.dist-connector {
  position: absolute;
  pointer-events: none;
  z-index: 6;
}

.dist-h {
  height: 1px;
  background: repeating-linear-gradient(90deg, #409eff, #409eff 3px, transparent 3px, transparent 6px);
}

.dist-v {
  width: 1px;
  background: repeating-linear-gradient(180deg, #409eff, #409eff 3px, transparent 3px, transparent 6px);
}

.dist-label {
  position: absolute;
  pointer-events: none;
  z-index: 7;
  background: #409eff;
  color: #fff;
  font-size: 10px;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
}
</style>
