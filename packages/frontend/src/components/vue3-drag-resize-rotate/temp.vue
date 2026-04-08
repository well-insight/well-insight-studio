<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { addEvent, getComputedSize, matchesSelectorToParentElements, removeEvent } from './utils/dom'
import { computeHeight, computeWidth, getAngle, restrictToBounds, rotatedPoint, snapToGrid } from './utils/fns'

// 类型定义
type HandleType = 'tl' | 'tm' | 'tr' | 'mr' | 'br' | 'bm' | 'bl' | 'ml' | 'rot'
type AxisType = 'x' | 'y' | 'both'
type EventType = 'mouse' | 'touch'

interface Point {
  x: number
  y: number
}

interface MouseClickPosition {
  mouseX: number
  mouseY: number
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
  x?: number
  y?: number
  w?: number
  h?: number
}

interface Bounds {
  minLeft: number | null
  maxLeft: number | null
  minRight: number | null
  maxRight: number | null
  minTop: number | null
  maxTop: number | null
  minBottom: number | null
  maxBottom: number | null
}

interface HandleInfo {
  size: number
  offset: number
  switch: boolean
}

// Props 定义
const props = defineProps({
  className: {
    type: String,
    default: 'vdr'
  },
  classNameDraggable: {
    type: String,
    default: 'draggable'
  },
  classNameResizable: {
    type: String,
    default: 'resizable'
  },
  classNameRotatable: {
    type: String,
    default: 'rotatable'
  },
  classNameDragging: {
    type: String,
    default: 'dragging'
  },
  classNameResizing: {
    type: String,
    default: 'resizing'
  },
  classNameRotating: {
    type: String,
    default: 'rotating'
  },
  classNameActive: {
    type: String,
    default: 'active'
  },
  classNameHandle: {
    type: String,
    default: 'handle'
  },
  disableUserSelect: {
    type: Boolean,
    default: true
  },
  enableNativeDrag: {
    type: Boolean,
    default: false
  },
  preventDeactivation: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: true
  },
  resizable: {
    type: Boolean,
    default: true
  },
  rotatable: {
    type: Boolean,
    default: false
  },
  lockAspectRatio: {
    type: Boolean,
    default: false
  },
  outsideAspectRatio: {
    type: [Number, String],
    default: 0
  },
  w: {
    type: [Number, String],
    default: 200,
    validator: (val: number | string) => {
      if (typeof val === 'number') {
        return val > 0
      }
      return val === 'auto'
    }
  },
  h: {
    type: [Number, String],
    default: 200,
    validator: (val: number | string) => {
      if (typeof val === 'number') {
        return val > 0
      }
      return val === 'auto'
    }
  },
  minWidth: {
    type: Number,
    default: 0,
    validator: (val: number) => val >= 0
  },
  minHeight: {
    type: Number,
    default: 0,
    validator: (val: number) => val >= 0
  },
  maxWidth: {
    type: Number,
    default: Infinity,
    validator: (val: number) => val >= 0
  },
  maxHeight: {
    type: Number,
    default: Infinity,
    validator: (val: number) => val >= 0
  },
  x: {
    type: [String, Number],
    default: 0
  },
  y: {
    type: [String, Number],
    default: 0
  },
  z: {
    type: [String, Number],
    default: 'auto',
    validator: (val: string | number) => (typeof val === 'string' ? val === 'auto' : val >= 0)
  },
  r: {
    type: [String, Number],
    default: 0
  },
  handles: {
    type: Array as () => HandleType[],
    default: () => ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml', 'rot'],
    validator: (val: HandleType[]) => {
      const validHandles = new Set<HandleType>(['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml', 'rot'])
      return new Set(val.filter(h => validHandles.has(h))).size === val.length
    }
  },
  dragHandle: {
    type: String,
    default: null
  },
  dragCancel: {
    type: String,
    default: null
  },
  axis: {
    type: String as () => AxisType,
    default: 'both',
    validator: (val: string) => ['x', 'y', 'both'].includes(val)
  },
  grid: {
    type: Array as () => [number, number],
    default: () => [1, 1]
  },
  parent: {
    type: [Boolean, String],
    default: false
  },
  onDragStart: {
    type: Function as () => (e: MouseEvent | TouchEvent) => boolean,
    default: () => () => true
  },
  onDrag: {
    type: Function as () => (left: number, top: number) => boolean,
    default: () => () => true
  },
  onResizeStart: {
    type: Function as () => (handle: HandleType, e: MouseEvent | TouchEvent) => boolean,
    default: () => () => true
  },
  onResize: {
    type: Function as () => (left: number, top: number, width: number, height: number) => boolean,
    default: () => () => true
  },
  onRotateStart: {
    type: Function as () => (e: MouseEvent | TouchEvent) => boolean,
    default: () => () => true
  },
  onRotate: {
    type: Function as () => (rotate: number) => boolean,
    default: () => () => true
  },
  isConflictCheck: {
    type: Boolean,
    default: false
  },
  snap: {
    type: Boolean,
    default: false
  },
  snapBorder: {
    type: Boolean,
    default: false
  },
  snapTolerance: {
    type: Number,
    default: 5,
    validator: (val: number) => typeof val === 'number'
  },
  scaleRatio: {
    type: Number,
    default: 1,
    validator: (val: number) => typeof val === 'number'
  },
  handleInfo: {
    type: Object as () => HandleInfo,
    default: () => ({
      size: 8,
      offset: -4,
      switch: true
    })
  },
  eventScope: {
    type: String,
    default: ''
  }
})

// Emits 定义
const emit = defineEmits([
  'deactivated',
  'activated',
  'update:active',
  'rotating',
  'dragging',
  'resizing',
  'refLineParams',
  'resizestop',
  'dragstop',
  'rotatestop'
])

// 事件映射
const events = {
  mouse: {
    start: 'mousedown',
    move: 'mousemove',
    stop: 'mouseup'
  },
  touch: {
    start: 'touchstart',
    move: 'touchmove',
    stop: 'touchend'
  }
}

// 禁止用户选取样式
const userSelectNone = {
  userSelect: 'none',
  MozUserSelect: 'none',
  WebkitUserSelect: 'none',
  MsUserSelect: 'none'
}

// 用户选中自动样式
const userSelectAuto = {
  userSelect: 'auto',
  MozUserSelect: 'auto',
  WebkitUserSelect: 'auto',
  MsUserSelect: 'auto'
}

// 响应式状态
const state = reactive({
  left: Number(props.x),
  top: Number(props.y),
  right: null as number | null,
  bottom: null as number | null,
  rotate: Number(props.r),
  width: null as number | null,
  height: null as number | null,
  widthTouched: false,
  heightTouched: false,
  aspectFactor: null as number | null,
  parentWidth: null as number | null,
  parentHeight: null as number | null,
  minW: props.minWidth,
  minH: props.minHeight,
  maxW: props.maxWidth,
  maxH: props.maxHeight,
  handle: null as HandleType | null,
  enabled: props.active,
  resizing: false,
  dragging: false,
  rotating: false,
  zIndex: props.z,
  lastCenterX: 0,
  lastCenterY: 0,
  parentX: 0,
  parentY: 0,
  // 临时变量
  elmX: 0,
  elmY: 0,
  elmW: 0,
  elmH: 0,
  fixedXName: '',
  fixedYName: '',
  fixedX: 0,
  fixedY: 0,
  TL: {} as Point,
  TR: {} as Point,
  BL: {} as Point,
  BR: {} as Point,
  lastMouseX: 0,
  lastMouseY: 0,
  mouseClickPosition: {
    mouseX: 0,
    mouseY: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0
  } as MouseClickPosition,
  bounds: {
    minLeft: null,
    maxLeft: null,
    minRight: null,
    maxRight: null,
    minTop: null,
    maxTop: null,
    minBottom: null,
    maxBottom: null
  } as Bounds
})

const {
  left,
  top,
  right,
  bottom,
  rotate,
  width,
  height,
  widthTouched,
  heightTouched,
  aspectFactor,
  parentWidth,
  parentHeight,
  minW,
  minH,
  maxW,
  maxH,
  handle,
  enabled,
  resizing,
  dragging,
  rotating,
  zIndex,
  lastCenterX,
  lastCenterY,
  parentX,
  parentY
} = toRefs(state)

// 当前事件类型（mouse/touch）
let eventsFor = ref<{ start: string; move: string; stop: string }>(events.mouse)

// 计算属性
const handleStyle = computed(() => {
  return (stick: HandleType) => {
    if (!props.handleInfo.switch) {
      return { display: enabled.value ? 'block' : 'none' }
    }
    // 旋转手柄不显示的情况
    if (stick === 'rot' && !props.rotatable) {
      return { display: 'none' }
    }
    // 非旋转手柄且不可调整大小时不显示
    if (stick !== 'rot' && !props.resizable) {
      return { display: 'none' }
    }

    const size = (props.handleInfo.size / props.scaleRatio).toFixed(2)
    const offset = (props.handleInfo.offset / props.scaleRatio).toFixed(2)
    const center = (Number(size) / 2).toFixed(2)

    const styleMap: Record<HandleType, Record<string, string>> = {
      tl: {
        top: `${offset}px`,
        left: `${offset}px`
      },
      tm: {
        top: `${offset}px`,
        left: `calc(50% - ${center}px)`
      },
      tr: {
        top: `${offset}px`,
        right: `${offset}px`
      },
      mr: {
        top: `calc(50% - ${center}px)`,
        right: `${offset}px`
      },
      br: {
        bottom: `${offset}px`,
        right: `${offset}px`
      },
      bm: {
        bottom: `${offset}px`,
        right: `calc(50% - ${center}px)`
      },
      bl: {
        bottom: `${offset}px`,
        left: `${offset}px`
      },
      ml: {
        top: `calc(50% - ${center}px)`,
        left: `${offset}px`
      },
      rot: {
        top: `-${Number(size) * 3}px`,
        left: `50%`
      }
    }

    const stickStyle: Record<string, string> = {
      width: styleMap[stick].width || `${size}px`,
      height: styleMap[stick].height || `${size}px`,
      top: styleMap[stick].top,
      left: styleMap[stick].left,
      right: styleMap[stick].right,
      bottom: styleMap[stick].bottom
    }

    const mapStick2Index: Record<HandleType, number> = {
      tl: 0,
      tm: 1,
      tr: 2,
      mr: 3,
      br: 4,
      bm: 5,
      bl: 6,
      ml: 7,
      rot: 8
    }

    // 控制手柄鼠标样式跟随旋转角度变化
    if (stick !== 'rot') {
      const cursorStyleArray = [
        'nw-resize',
        'n-resize',
        'ne-resize',
        'e-resize',
        'se-resize',
        's-resize',
        'sw-resize',
        'w-resize'
      ]
      const STEP = 45
      const rotateVal = rotate.value + STEP / 2
      const deltaIndex = Math.floor(rotateVal / STEP)
      let index = (mapStick2Index[stick] + deltaIndex) % 8
      stickStyle.cursor = cursorStyleArray[index]
    }

    stickStyle.display = enabled.value ? 'block' : 'none'
    return stickStyle
  }
})

const style = computed(() => {
  return {
    transform: `translate(${left.value}px, ${top.value}px) rotate(${rotate.value}deg)`,
    width: computedWidth.value,
    height: computedHeight.value,
    zIndex: zIndex.value,
    fontSize: `${props.handleInfo.size * 2}px`,
    ...(dragging.value && props.disableUserSelect ? userSelectNone : userSelectAuto)
  }
})

const actualHandles = computed(() => {
  if (!props.resizable && !props.rotatable) return []
  return props.handles
})

const computedWidth = computed(() => {
  if (props.w === 'auto') {
    if (!widthTouched.value) {
      return 'auto'
    }
  }
  return `${width.value}px`
})

const computedHeight = computed(() => {
  if (props.h === 'auto') {
    if (!heightTouched.value) {
      return 'auto'
    }
  }
  return `${height.value}px`
})

// 监听
watch(
  () => props.active,
  val => {
    state.enabled = val
    if (val) {
      updateParentSize()
      emit('activated')
    } else {
      emit('deactivated')
    }
  },
  { immediate: true }
)

watch(
  () => props.x,
  val => {
    if (resizing.value || dragging.value) return
    if (props.parent) {
      state.bounds = calcDragLimits()
    }
    moveHorizontally(Number(val))
  }
)

watch(
  () => props.y,
  val => {
    if (resizing.value || dragging.value) return
    if (props.parent) {
      state.bounds = calcDragLimits()
    }
    moveVertically(Number(val))
  }
)

watch(
  () => props.z,
  val => {
    if (val >= 0 || val === 'auto') {
      state.zIndex = val
    }
  }
)

watch(
  () => props.r,
  val => {
    if (Number(val) >= 0) {
      state.rotate = Number(val) % 360
    }
  }
)

watch(
  () => props.lockAspectRatio,
  val => {
    if (val) {
      if (props.outsideAspectRatio) {
        state.aspectFactor = Number(props.outsideAspectRatio)
      } else {
        state.aspectFactor = width.value! / height.value!
      }
    } else {
      state.aspectFactor = undefined
    }
  },
  { immediate: true }
)

watch(
  () => props.outsideAspectRatio,
  val => {
    if (val) {
      state.aspectFactor = Number(val)
    }
  }
)

watch(
  () => props.minWidth,
  val => {
    if (val > 0 && val <= width.value!) {
      state.minW = val
    }
  }
)

watch(
  () => props.minHeight,
  val => {
    if (val > 0 && val <= height.value!) {
      state.minH = val
    }
  }
)

watch(
  () => props.maxWidth,
  val => {
    state.maxW = val
  }
)

watch(
  () => props.maxHeight,
  val => {
    state.maxH = val
  }
)

watch(
  () => props.w,
  val => {
    if (resizing.value || dragging.value) return
    if (props.parent) {
      state.bounds = calcResizeLimits()
    }
    changeWidth(val === 'auto' ? val : Number(val))
  }
)

watch(
  () => props.h,
  val => {
    if (resizing.value || dragging.value) return
    if (props.parent) {
      state.bounds = calcResizeLimits()
    }
    changeHeight(val === 'auto' ? val : Number(val))
  }
)

// 方法定义
function resetBoundsAndMouseState() {
  state.mouseClickPosition = {
    mouseX: 0,
    mouseY: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0
  }
  state.bounds = {
    minLeft: null,
    maxLeft: null,
    minRight: null,
    maxRight: null,
    minTop: null,
    maxTop: null,
    minBottom: null,
    maxBottom: null
  }
}

function checkParentSize() {
  if (props.parent) {
    const [newParentWidth, newParentHeight] = getParentSize()
    state.right = newParentWidth - width.value! - left.value
    state.bottom = newParentHeight - height.value! - top.value
    state.parentWidth = newParentWidth
    state.parentHeight = newParentHeight
  }
}

function updateParentSize() {
  const [parentWidth, parentHeight] = getParentSize()
  state.parentWidth = parentWidth
  state.parentHeight = parentHeight
}

function getParentSize(): [number, number] {
  if (props.parent === true) {
    const el = (document.querySelector(props.eventScope) || state) as HTMLElement
    const parentNode = el.parentNode as HTMLElement
    const style = window.getComputedStyle(parentNode, null)
    const rect = parentNode.getBoundingClientRect()
    state.parentX = rect.x
    state.parentY = rect.y
    return [
      Math.round(Number.parseFloat(style.getPropertyValue('width'), 10)),
      Math.round(Number.parseFloat(style.getPropertyValue('height'), 10))
    ]
  }
  if (typeof props.parent === 'string') {
    const parentNode = document.querySelector(props.parent)
    if (!(parentNode instanceof HTMLElement)) {
      throw new TypeError(`The selector ${props.parent} does not match any element`)
    }
    return [parentNode.offsetWidth, parentNode.offsetHeight]
  }
  return [0, 0]
}

function getEventScopeElement(): HTMLElement {
  if (props.eventScope) {
    const element = document.querySelector(props.eventScope)
    if (element) {
      return element as HTMLElement
    }
  }
  return document.documentElement
}

function elementTouchDown(e: TouchEvent) {
  eventsFor.value = events.touch
  elementDown(e)
}

function elementMouseDown(e: MouseEvent) {
  eventsFor.value = events.mouse
  elementDown(e)
}

function elementDown(e: MouseEvent | TouchEvent) {
  if (e instanceof MouseEvent && e.which !== 1) return

  const target = e.target as HTMLElement
  if ((e.currentTarget as HTMLElement).contains(target)) {
    if (props.onDragStart(e) === false) return

    if (
      (props.dragHandle &&
        !matchesSelectorToParentElements(target, props.dragHandle, e.currentTarget as HTMLElement)) ||
      (props.dragCancel && matchesSelectorToParentElements(target, props.dragCancel, e.currentTarget as HTMLElement))
    ) {
      state.dragging = false
      return
    }

    if (!enabled.value) {
      state.enabled = true
      emit('activated')
      emit('update:active', true)
    }

    if (props.draggable) {
      state.dragging = true
    }

    state.mouseClickPosition.mouseX = e instanceof TouchEvent ? e.touches[0].pageX : e.pageX
    state.mouseClickPosition.mouseY = e instanceof TouchEvent ? e.touches[0].pageY : e.pageY
    state.mouseClickPosition.left = left.value
    state.mouseClickPosition.right = right.value!
    state.mouseClickPosition.top = top.value
    state.mouseClickPosition.bottom = bottom.value!
    state.mouseClickPosition.width = width.value!
    state.mouseClickPosition.height = height.value!

    if (props.parent) {
      state.bounds = calcDragLimits()
    }

    addEvent(document.documentElement, eventsFor.value.move, move)
    addEvent(document.documentElement, eventsFor.value.stop, handleUp)
  }
}

function calcDragLimits(): Bounds {
  checkParentSize()
  if (props.rotatable) {
    return {
      minLeft: -width.value! / 2,
      maxLeft: parentWidth.value! - width.value! / 2,
      minRight: width.value! / 2,
      maxRight: parentWidth.value! + width.value! / 2,
      minTop: -height.value! / 2,
      maxTop: parentHeight.value! - height.value! / 2,
      minBottom: height.value! / 2,
      maxBottom: parentHeight.value! + height.value! / 2
    }
  } else {
    return {
      minLeft: left.value % props.grid[0],
      maxLeft:
        Math.floor((parentWidth.value! - width.value! - left.value) / props.grid[0]) * props.grid[0] + left.value,
      minRight: right.value! % props.grid[0],
      maxRight:
        Math.floor((parentWidth.value! - width.value! - right.value!) / props.grid[0]) * props.grid[0] + right.value!,
      minTop: top.value % props.grid[1],
      maxTop: Math.floor((parentHeight.value! - height.value! - top.value) / props.grid[1]) * props.grid[1] + top.value,
      minBottom: bottom.value! % props.grid[1],
      maxBottom:
        Math.floor((parentHeight.value! - height.value! - bottom.value!) / props.grid[1]) * props.grid[1] +
        bottom.value!
    }
  }
}

function deselect(e: MouseEvent | TouchEvent) {
  const target = e.target as HTMLElement
  const regex = new RegExp(`${props.className}-([trmbl]{2})`, '')
  if (!(e.currentTarget as HTMLElement).contains(target) && !regex.test(target.className)) {
    if (enabled.value && !props.preventDeactivation) {
      state.enabled = false
      emit('deactivated')
      emit('update:active', false)
    }
    removeEvent(document.documentElement, eventsFor.value.move, move)
  }
  resetBoundsAndMouseState()
}

function handleTouchDown(handle: HandleType, e: TouchEvent) {
  eventsFor.value = events.touch
  handleDown(handle, e)
}

function handleDown(handle: HandleType, e: MouseEvent | TouchEvent) {
  if (e instanceof MouseEvent && e.which !== 1) return false
  if (props.onResizeStart(handle, e) === false) return false

  if (e.stopPropagation) e.stopPropagation()

  state.handle = handle
  if (handle === 'rot') {
    state.rotating = true
  } else {
    state.resizing = true
  }

  // 保存矩形信息
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  state.lastCenterX = window.pageXOffset + rect.left + rect.width / 2
  state.lastCenterY = window.pageYOffset + rect.top + rect.height / 2

  const oleft = left.value
  const otop = top.value
  const owidth = width.value!
  const oheight = height.value!
  const centerX = oleft + owidth / 2
  const centerY = otop + oheight / 2
  const rotateVal = rotate.value

  state.TL = rotatedPoint(centerX, centerY, oleft, otop, rotateVal)
  state.TR = rotatedPoint(centerX, centerY, oleft + owidth, otop, rotateVal)
  state.BL = rotatedPoint(centerX, centerY, oleft, otop + oheight, rotateVal)
  state.BR = rotatedPoint(centerX, centerY, oleft + owidth, otop + oheight, rotateVal)

  // 保存鼠标按下时的状态
  state.mouseClickPosition.mouseX = e instanceof TouchEvent ? e.touches[0].pageX : e.pageX
  state.mouseClickPosition.mouseY = e instanceof TouchEvent ? e.touches[0].pageY : e.pageY
  state.mouseClickPosition.left = left.value
  state.mouseClickPosition.right = right.value!
  state.mouseClickPosition.top = top.value
  state.mouseClickPosition.bottom = bottom.value!
  state.mouseClickPosition.width = width.value!
  state.mouseClickPosition.height = height.value!

  state.bounds = calcResizeLimits()

  addEvent(document.documentElement, eventsFor.value.move, move)
  addEvent(document.documentElement, eventsFor.value.stop, handleUp)
}

function calcResizeLimits(): Bounds {
  let minW = minW.value
  let minH = minH.value
  let maxW = maxW.value
  let maxH = maxH.value
  const [gridX, gridY] = props.grid
  const widthVal = width.value!
  const heightVal = height.value!
  const leftVal = left.value
  const topVal = top.value
  const rightVal = right.value!
  const bottomVal = bottom.value!

  maxW = maxW - (maxW % gridX)
  maxH = maxH - (maxH % gridY)

  const limits: Bounds = {
    minLeft: null,
    maxLeft: null,
    minTop: null,
    maxTop: null,
    minRight: null,
    maxRight: null,
    minBottom: null,
    maxBottom: null
  }

  if (props.parent) {
    limits.minLeft = leftVal
    limits.maxLeft = leftVal + Math.floor((widthVal - minW) / gridX)
    limits.minTop = topVal
    limits.maxTop = topVal + Math.floor((heightVal - minH) / gridY)
    limits.minRight = rightVal
    limits.maxRight = rightVal + Math.floor((widthVal - minW) / gridX)
    limits.minBottom = bottomVal
    limits.maxBottom = bottomVal + Math.floor((heightVal - minH) / gridY)

    if (maxW) {
      limits.minLeft = Math.max(limits.minLeft!, parentWidth.value! - rightVal - maxW)
      limits.minRight = Math.max(limits.minRight!, parentWidth.value! - leftVal - maxW)
    }
    if (maxH) {
      limits.minTop = Math.max(limits.minTop!, parentHeight.value! - bottomVal - maxH)
      limits.minBottom = Math.max(limits.minBottom!, parentHeight.value! - topVal - maxH)
    }
  } else {
    limits.minLeft = null
    limits.maxLeft = leftVal + Math.floor(widthVal - minW)
    limits.minTop = null
    limits.maxTop = topVal + Math.floor(heightVal - minH)
    limits.minRight = null
    limits.maxRight = rightVal + Math.floor(widthVal - minW)
    limits.minBottom = null
    limits.maxBottom = bottomVal + Math.floor(heightVal - minH)

    if (maxW) {
      limits.minLeft = -(rightVal + maxW)
      limits.minRight = -(leftVal + maxW)
    }
    if (maxH) {
      limits.minTop = -(bottomVal + maxH)
      limits.minBottom = -(topVal + maxH)
    }
    if (props.lockAspectRatio && maxW && maxH) {
      limits.minLeft = Math.min(limits.minLeft!, -(rightVal + maxW))
      limits.minTop = Math.min(limits.minTop!, -(maxH + bottomVal))
      limits.minRight = Math.min(limits.minRight!, -leftVal - maxW)
      limits.minBottom = Math.min(limits.minBottom!, -topVal - maxH)
    }
  }

  return limits
}

function move(e: MouseEvent | TouchEvent) {
  if (resizing.value) {
    handleResize(e)
  } else if (dragging.value) {
    handleDrag(e)
  } else if (rotating.value) {
    handleRotate(e)
  }
}

function getMouseCoordinate(e: MouseEvent | TouchEvent): Point {
  if ((e as TouchEvent).type.includes('touch')) {
    const touch = (e as TouchEvent).changedTouches[0]
    return {
      x: touch.clientX,
      y: touch.clientY
    }
  } else {
    const mouseEvent = e as MouseEvent
    return {
      x: mouseEvent.pageX || mouseEvent.clientX + document.documentElement.scrollLeft,
      y: mouseEvent.pageY || mouseEvent.clientY + document.documentElement.scrollTop
    }
  }
}

function handleRotate(e: MouseEvent | TouchEvent) {
  const { x: mouseX, y: mouseY } = getMouseCoordinate(e)
  const x = mouseX - lastCenterX.value
  const y = mouseY - lastCenterY.value
  state.rotate = (getAngle(x, y) + 90) % 360
  emit('rotating', rotate.value)
}

async function handleDrag(e: MouseEvent | TouchEvent) {
  const axis = props.axis
  const grid = props.grid
  const bounds = state.bounds
  const mouseClickPosition = state.mouseClickPosition

  const tmpDeltaX =
    axis && axis !== 'y'
      ? mouseClickPosition.mouseX - (e instanceof TouchEvent ? e.touches[0].pageX : (e as MouseEvent).pageX)
      : 0
  const tmpDeltaY =
    axis && axis !== 'x'
      ? mouseClickPosition.mouseY - (e instanceof TouchEvent ? e.touches[0].pageY : (e as MouseEvent).pageY)
      : 0

  const [deltaX, deltaY] = snapToGrid(grid, tmpDeltaX, tmpDeltaY, props.scaleRatio)
  const leftVal = restrictToBounds(mouseClickPosition.left - deltaX, bounds.minLeft, bounds.maxLeft)
  const topVal = restrictToBounds(mouseClickPosition.top - deltaY, bounds.minTop, bounds.maxTop)

  if (props.onDrag(leftVal, topVal) === false) return

  const rightVal = restrictToBounds(mouseClickPosition.right + deltaX, bounds.minRight, bounds.maxRight)
  const bottomVal = restrictToBounds(mouseClickPosition.bottom + deltaY, bounds.minBottom, bounds.maxBottom)

  state.left = leftVal
  state.top = topVal
  state.right = rightVal
  state.bottom = bottomVal

  await snapCheck()
  emit('dragging', left.value, top.value)
}

function moveHorizontally(val: number) {
  const [deltaX] = snapToGrid(props.grid, val, top.value, props.scaleRatio)
  const leftVal = restrictToBounds(deltaX, state.bounds.minLeft, state.bounds.maxLeft)
  state.left = leftVal
  state.right = parentWidth.value! - width.value! - leftVal
}

function moveVertically(val: number) {
  const [, deltaY] = snapToGrid(props.grid, left.value, val, props.scaleRatio)
  const topVal = restrictToBounds(deltaY, state.bounds.minTop, state.bounds.maxTop)
  state.top = topVal
  state.bottom = parentHeight.value! - height.value! - topVal
}

function handleResize(e: MouseEvent | TouchEvent) {
  const handle = state.handle!
  const scaleRatio = props.scaleRatio
  const { TL, TR, BL, BR } = state
  let { x: mouseX, y: mouseY } = getMouseCoordinate(e)

  if (!props.rotatable && props.parent) {
    mouseX = restrictToBounds(mouseX, parentX.value, parentX.value + parentWidth.value! * scaleRatio)
    mouseY = restrictToBounds(mouseY, parentY.value, parentY.value + parentHeight.value! * scaleRatio)
  }

  let deltaX = mouseX - state.mouseClickPosition.mouseX
  let deltaY = mouseY - state.mouseClickPosition.mouseY

  deltaX = deltaX / scaleRatio
  deltaY = deltaY / scaleRatio

  let diffX: number, diffY: number, scale: number, scaleB: number, scaleC: number
  let newX: number, newY: number, newW: number, newH: number
  let Fixed = {} as Point
  let BX = {} as Point
  let CX = {} as Point
  let Va = {} as Point
  let Vb = {} as Point
  let Vc = {} as Point
  let Vw = {} as Point
  let Vh = {} as Point

  if (handle.includes('m')) {
    switch (handle) {
      case 'tm':
        diffX = deltaX + (TL.x + TR.x) / 2
        diffY = deltaY + (TL.y + TR.y) / 2
        Fixed = BL
        BX = TL
        CX = BR
        Va = { x: diffX - Fixed.x, y: diffY - Fixed.y }
        Vb = { x: BX.x - Fixed.x, y: BX.y - Fixed.y }
        scale = (Va.x * Vb.x + Va.y * Vb.y) / (Vb.x ** 2 + Vb.y ** 2)
        Vw = { x: CX.x - Fixed.x, y: CX.y - Fixed.y }
        Vh = { x: Vb.x * scale, y: Vb.y * scale }
        break
      case 'bm':
        diffX = deltaX + (BL.x + BR.x) / 2
        diffY = deltaY + (BL.y + BR.y) / 2
        Fixed = TL
        BX = BL
        CX = TR
        Va = { x: diffX - Fixed.x, y: diffY - Fixed.y }
        Vb = { x: BX.x - Fixed.x, y: BX.y - Fixed.y }
        scale = (Va.x * Vb.x + Va.y * Vb.y) / (Vb.x ** 2 + Vb.y ** 2)
        Vw = { x: CX.x - Fixed.x, y: CX.y - Fixed.y }
        Vh = { x: Vb.x * scale, y: Vb.y * scale }
        break
      case 'ml':
        diffX = deltaX + (TL.x + BL.x) / 2
        diffY = deltaY + (TL.y + BL.y) / 2
        Fixed = BR
        BX = BL
        CX = TR
        Va = { x: diffX - Fixed.x, y: diffY - Fixed.y }
        Vb = { x: BX.x - Fixed.x, y: BX.y - Fixed.y }
        scale = (Va.x * Vb.x + Va.y * Vb.y) / (Vb.x ** 2 + Vb.y ** 2)
        Vh = { x: CX.x - Fixed.x, y: CX.y - Fixed.y }
        Vw = { x: Vb.x * scale, y: Vb.y * scale }
        break
      case 'mr':
        diffX = deltaX + (TR.x + TR.x) / 2
        diffY = deltaY + (TR.y + TR.y) / 2
        Fixed = BL
        BX = BR
        CX = TL
        Va = { x: diffX - Fixed.x, y: diffY - Fixed.y }
        Vb = { x: BX.x - Fixed.x, y: BX.y - Fixed.y }
        scale = (Va.x * Vb.x + Va.y * Vb.y) / (Vb.x ** 2 + Vb.y ** 2)
        Vh = { x: CX.x - Fixed.x, y: CX.y - Fixed.y }
        Vw = { x: Vb.x * scale, y: Vb.y * scale }
        break
      default:
        break
    }
    newX = Fixed.x + (Vw.x + Vh.x) / 2
    newY = Fixed.y + (Vw.y + Vh.y) / 2
    newW = Math.sqrt(Vw.x ** 2 + Vw.y ** 2)
    newH = Math.sqrt(Vh.x ** 2 + Vh.y ** 2)
  } else {
    switch (handle) {
      case 'tl':
        diffX = deltaX + TL.x
        diffY = deltaY + TL.y
        Fixed = BR
        BX = BL
        CX = TR
        break
      case 'tr':
        diffX = deltaX + TR.x
        diffY = deltaY + TR.y
        Fixed = BL
        BX = BR
        CX = TL
        break
      case 'bl':
        diffX = deltaX + BL.x
        diffY = deltaY + BL.y
        Fixed = TR
        BX = TL
        CX = BR
        break
      case 'br':
        diffX = deltaX + BR.x
        diffY = deltaY + BR.y
        Fixed = TL
        BX = TR
        CX = BL
        break
      default:
        break
    }

    Va = { x: diffX - Fixed.x, y: diffY - Fixed.y }
    Vb = { x: BX.x - Fixed.x, y: BX.y - Fixed.y }
    Vc = { x: CX.x - Fixed.x, y: CX.y - Fixed.y }
    scaleB = (Va.x * Vb.x + Va.y * Vb.y) / (Vb.x ** 2 + Vb.y ** 2)
    scaleC = (Va.x * Vc.x + Va.y * Vc.y) / (Vc.x ** 2 + Vc.y ** 2)
    Vw = { x: Vb.x * scaleB, y: Vb.y * scaleB }
    Vh = { x: Vc.x * scaleC, y: Vc.y * scaleC }

    newX = Fixed.x + (Vw.x + Vh.x) / 2
    newY = Fixed.y + (Vw.y + Vh.y) / 2
    newW = Math.sqrt(Vw.x ** 2 + Vw.y ** 2)
    newH = Math.sqrt(Vh.x ** 2 + Vh.y ** 2)
  }

  state.left = newX - newW / 2
  state.top = newY - newH / 2

  newW = restrictToBounds(newW, minW.value || 0, maxW.value)
  newH = restrictToBounds(newH, minH.value || 0, maxH.value)

  if (props.parent) {
    newW = restrictToBounds(newW, 0, parentWidth.value!)
    newH = restrictToBounds(newH, 0, parentHeight.value!)
  }

  if (props.lockAspectRatio) {
    if (newW / newH > aspectFactor.value!) {
      newW = newH * aspectFactor.value!
    } else {
      newH = newW / aspectFactor.value!
    }
  }

  state.width = newW
  state.height = newH

  emit('resizing', left.value, top.value, width.value, height.value)
}

function changeWidth(val: number | 'auto') {
  if (val === 'auto') return
  const [newWidth] = snapToGrid(props.grid, val, 0, props.scaleRatio)
  const rightVal = parentWidth.value! - newWidth - left.value
  let bottomVal = bottom.value!

  if (props.lockAspectRatio) {
    bottomVal = bottom.value! - (right.value! - rightVal) / aspectFactor.value!
  }

  const widthVal = computeWidth(parentWidth.value!, left.value, rightVal)
  const heightVal = computeHeight(parentHeight.value!, top.value, bottomVal)

  state.right = rightVal
  state.bottom = bottomVal
  state.width = widthVal
  state.height = heightVal
}

function changeHeight(val: number | 'auto') {
  if (val === 'auto') return
  const [, newHeight] = snapToGrid(props.grid, 0, val, props.scaleRatio)
  const bottomVal = parentHeight.value! - newHeight - top.value
  let rightVal = right.value!

  if (props.lockAspectRatio) {
    rightVal = right.value! - (bottom.value! - bottomVal) * aspectFactor.value!
  }

  const widthVal = computeWidth(parentWidth.value!, left.value, rightVal)
  const heightVal = computeHeight(parentHeight.value!, top.value, bottomVal)

  state.right = rightVal
  state.bottom = bottomVal
  state.width = widthVal
  state.height = heightVal
}

async function handleUp(e: MouseEvent | TouchEvent) {
  state.handle = null

  const temArr = Array.from({ length: 3 }).fill({
    display: false,
    position: '',
    origin: '',
    lineLength: ''
  })
  const refLine = { vLine: [], hLine: [] }
  for (const i in refLine) {
    refLine[i as 'vLine' | 'hLine'] = JSON.parse(JSON.stringify(temArr))
  }

  const { x: mouseX, y: mouseY } = getMouseCoordinate(e)
  state.lastMouseX = mouseX
  state.lastMouseY = mouseY

  if (resizing.value) {
    state.resizing = false
    await conflictCheck()
    emit('refLineParams', refLine)
    emit('resizestop', left.value, top.value, width.value, height.value)
  }

  if (dragging.value) {
    state.dragging = false
    await conflictCheck()
    emit('refLineParams', refLine)
    emit('dragstop', left.value, top.value)
  }

  if (rotating.value) {
    state.rotating = false
    emit('rotatestop', rotate.value)
  }

  resetBoundsAndMouseState()
  removeEvent(document.documentElement, eventsFor.value.move, move)
}

function settingAttribute() {
  const el = (document.querySelector(props.eventScope) || state) as HTMLElement
  el.setAttribute('data-is-check', `${props.isConflictCheck}`)
  el.setAttribute('data-is-snap', `${props.snap}`)
}

// 占位方法（原有代码中未实现）
async function snapCheck() {
  // 原有逻辑保持不变
}

async function conflictCheck() {
  // 原有逻辑保持不变
}

// 生命周期
onMounted(() => {
  if (props.maxWidth && props.minWidth > props.maxWidth) {
    console.warn('[Vdr warn]: Invalid prop: minWidth cannot be greater than maxWidth')
  }
  if (props.maxWidth && props.minHeight > props.maxHeight) {
    console.warn('[Vdr warn]: Invalid prop: minHeight cannot be greater than maxHeight')
  }

  const el = (document.querySelector(props.eventScope) || state) as HTMLElement
  if (!props.enableNativeDrag) {
    el.ondragstart = () => false
  }

  const [parentWidth, parentHeight] = getParentSize()
  state.parentWidth = parentWidth
  state.parentHeight = parentHeight

  const [width, height] = getComputedSize(el)
  state.aspectFactor = (props.w !== 'auto' ? Number(props.w) : width) / (props.h !== 'auto' ? Number(props.h) : height)

  if (props.outsideAspectRatio) {
    state.aspectFactor = Number(props.outsideAspectRatio)
  }

  state.width = props.w !== 'auto' ? Number(props.w) : width
  state.height = props.h !== 'auto' ? Number(props.h) : height
  state.right = parentWidth - state.width - Number(props.x)
  state.bottom = parentHeight - state.height - Number(props.y)

  settingAttribute()

  addEvent(getEventScopeElement(), 'mousedown', deselect)
  addEvent(getEventScopeElement(), 'touchend touchcancel', deselect)
  addEvent(window, 'resize', checkParentSize)
})

onBeforeUnmount(() => {
  removeEvent(getEventScopeElement(), 'mousedown', deselect)
  removeEvent(getEventScopeElement(), 'touchstart', handleUp)
  removeEvent(getEventScopeElement(), 'mousemove', move)
  removeEvent(getEventScopeElement(), 'touchmove', move)
  removeEvent(getEventScopeElement(), 'mouseup', handleUp)
  removeEvent(getEventScopeElement(), 'touchend touchcancel', deselect)
  removeEvent(window, 'resize', checkParentSize)
})
</script>

<template>
  <div
    :class="[
      className,
      {
        [classNameDraggable]: draggable,
        [classNameResizable]: resizable,
        [classNameRotatable]: rotatable,
        [classNameDragging]: dragging,
        [classNameResizing]: resizing,
        [classNameRotating]: rotating,
        [classNameActive]: enabled
      }
    ]"
    :style="style"
    @mousedown="elementMouseDown"
    @touchstart="elementTouchDown"
  >
    <!-- 控制手柄 -->
    <template v-for="handle in actualHandles" :key="handle">
      <div
        :class="[classNameHandle, `${className}-${handle}`]"
        :style="handleStyle(handle)"
        @mousedown.stop="handleDown(handle, $event)"
        @touchstart.stop="handleTouchDown(handle, $event)"
      />
    </template>
    <slot />
  </div>
</template>
