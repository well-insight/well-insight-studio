<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useMouseInElement, useResizeObserver } from '@vueuse/core'
import { vLoading } from 'element-plus'
import { cloneDeep, debounce, throttle } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { GridLayout } from '@/components/grid-layout-plus'
import { useAnimate } from '@/hooks/useAnimate'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { resolveBlockBorderCss } from '@/utils/blockBorder'
import {
  getBlockTitleInlineStyle,
  getBlockTitleText,
  isInnerBlockTitle,
} from '@/visual-editor/core/visual-editor.utils'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { $$dropdown, DropdownOption } from '@/visual-editor/lib/dropdown-service'
import MonacoEditor from '@/visual-editor/ui/shared/monaco-editor/MonacoEditor'
import { getBlockAnimationElement } from '@/visual-editor/visual-editor.utils'
import CompRender from './comp-render'
import SlotItem from './SlotItem.vue'

defineOptions({
  name: 'SimulatorEditor',
})

const props = withDefaults(defineProps<{
  autoFixScale?: boolean
  scale?: number
}>(), {
  autoFixScale: true,
  scale: 1,
})

const emits = defineEmits<{
  changeScale: [value: number]
}>()

const currentScale = ref(props?.scale)

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const { currentPage, setCurrentBlock, currentBlock, updateCurrentBlock, visualLoading, recordHistory } = useVisualData()
const { globalProperties } = useGlobalProperties()

const controlStore = useControlStore()

const { floatingSettingVisible } = storeToRefs(controlStore)

const drag = ref(false)
const selectedBlockIds = ref<string[]>([])

const route = useRoute()

const canvasId = String(route.query?.key) || ''

const componentLoading = ref(false)

const wrapper = ref<HTMLElement>()
const canvasRef = useTemplateRef('canvasRef')
const sketchRuleKey = ref<string>('')

const { isOutside } = useMouseInElement(wrapper)

const lines = reactive({
  h: [],
  v: [],
})

const thick = ref(20)
const lang = ref('zh-CN')
const shadow = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})

const isEnterSpace = ref(false)
function getBlockBorderStyle(item: VisualEditorBlockData): CSSProperties {
  return resolveBlockBorderCss(item, currentPage.value?.config)
}

// 监听键盘按键事件componentData
function keyEvent() {
  document.addEventListener('keydown', (e: any) => {
    if (e && e.code === 'Space' && !isOutside.value) {
      isEnterSpace.value = true
      e.preventDefault() // 阻止默认事件行为
    }
  })
  document.addEventListener('keyup', (e: any) => {
    if (e && e.code === 'Space') {
      isEnterSpace.value = false
      e.preventDefault() // 阻止默认事件行为
    }
  })
}

onMounted(() => {
  currentPage.value?.blocks?.forEach((block) => {
    if (!block.i) {
      block.i = block._vid
    }
  })

  keyEvent()

  nextTick(() => {
    setTimeout(() => {
      initAnimate()
    }, 1000)
  })
})

/**
 * @description 操作当前页面样式表
 */
const editCanvasStyle = computed(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  const normalizedBgColor = bgColor || '#ffffff'
  const normalizedBgImage = bgImage ? `url(${bgImage})` : 'none'
  const normalizedBgRepeat = bgRepeat || 'no-repeat'
  const normalizedBgSize = bgSize || 'cover'
  return {
    width: '100%',
    height: '100%',
    backgroundColor: normalizedBgColor,
    backgroundImage: normalizedBgImage,
    backgroundRepeat: normalizedBgRepeat,
    backgroundSize: normalizedBgSize,
    cursor: isEnterSpace.value ? 'grab' : 'auto',
  } as CSSProperties
})

const gridLayout = ref<InstanceType<typeof GridLayout>>()

/** 基于页面设计宽度计算固定列数，使每列步长接近15px（不随窗口大小变化） */
const gridColNum = computed(() => {
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth / 15))
})

onMounted(() => {
  document.addEventListener('dragover', syncMousePosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('dragover', syncMousePosition)
})

const mouseAt = { x: -1, y: -1 }

function syncMousePosition(event: MouseEvent) {
  mouseAt.x = event.clientX
  mouseAt.y = event.clientY
}

const dropId = 'drop'
const dragItem = ref(defaultDragItem())

function defaultDragItem() {
  return {
    x: -1,
    y: -1,
    i: '',
    w: 10,
    h: 10,
  }
}

const dragging = throttle(() => {
  const parentRect = wrapper.value?.getBoundingClientRect()

  if (!parentRect || !gridLayout.value)
    return

  const mouseInGrid
    = mouseAt.x > parentRect.left
      && mouseAt.x < parentRect.right
      && mouseAt.y > parentRect.top
      && mouseAt.y < parentRect.bottom

  if (mouseInGrid && !currentPage.value.blocks.some(item => item.i === dropId)) {
    const colNum = gridColNum.value
    const moveData = { ...controlStore.moveVisualData, x: (currentPage.value.blocks.length * 10) % colNum, y: currentPage.value.blocks.length + 5, i: dropId }
    dragItem.value.h = moveData?.h
    dragItem.value.w = moveData?.w
    dragItem.value.i = dropId
    currentPage.value.blocks.push(moveData)
  }

  const index = currentPage.value.blocks.findIndex(item => item.i === dropId)

  if (index !== -1) {
    const item = gridLayout.value.getItem(dropId)

    if (!item)
      return

    try {
      item.wrapper.style.display = 'none'
    }
    catch (error) {
      console.warn(error)
    }

    Object.assign(item.state, {
      top: mouseAt.y - parentRect.top,
      left: mouseAt.x - parentRect.left,
    })
    const newPos = item.calcXY(mouseAt.y - parentRect.top, mouseAt.x - parentRect.left)

    if (mouseInGrid) {
      gridLayout.value.dragEvent('dragstart', dropId, newPos.x, newPos.y, dragItem.value.h, dragItem.value.w)
      dragItem.value.i = String(index)
      dragItem.value.x = currentPage.value.blocks[index].x
      dragItem.value.y = currentPage.value.blocks[index].y
    }
    else {
      gridLayout.value.dragEvent('dragend', dropId, newPos.x, newPos.y, dragItem.value.h, dragItem.value.w)
      currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
    }
  }
})

function dragEnd() {
  const parentRect = wrapper.value?.getBoundingClientRect()

  if (!parentRect || !gridLayout.value)
    return

  const mouseInGrid
    = mouseAt.x > parentRect.left
      && mouseAt.x < parentRect.right
      && mouseAt.y > parentRect.top
      && mouseAt.y < parentRect.bottom

  if (mouseInGrid) {
    // alert(`Dropped element props:\n${JSON.stringify(dragItem, ['x', 'y', 'w', 'h'], 2)}`)
    gridLayout.value.dragEvent('dragend', dropId, dragItem.value.x, dragItem.value.y, dragItem.value.h, dragItem.value.w)

    currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
  }
  else {
    return
  }

  // 获取拖拽传递的数据
  const moveData = {
    ...controlStore.moveVisualData,
    x: dragItem.value.x,
    y: dragItem.value.y,
    w: dragItem.value.w,
    h: dragItem.value.h,
    i: controlStore.moveVisualData?._vid ?? controlStore.moveVisualData?.i,
  }

  currentPage.value.blocks.push(moveData)
  selectComp(moveData)
  controlStore.setMoveVisualData(null)

  gridLayout.value.dragEvent('dragend', dragItem.value.i, dragItem.value.x, dragItem.value.y, dragItem.value.h, dragItem.value.w)

  const item = gridLayout.value.getItem(dropId)

  if (!item)
    return

  try {
    item.wrapper.style.display = ''
  }
  catch (error) {
    console.warn(error)
  }

  dragItem.value = defaultDragItem()

  recordHistory()
}

// 递归实现
// @leafId  为你要查找的id，
// @nodes   为原始Json数据
// @path    供递归使用，不要赋值
function findPathByLeafId(leafId: string, nodes: VisualEditorBlockData[] = [], path: VisualEditorBlockData[] = []): VisualEditorBlockData[] {
  for (let i = 0; i < nodes.length; i++) {
    const tmpPath = path.concat()
    tmpPath.push(nodes[i])
    if (leafId === nodes[i]._vid) {
      return tmpPath
    }
    const slots = nodes[i].props?.slots || {}
    const keys = Object.keys(slots)
    for (let j = 0; j < keys.length; j++) {
      const children = slots[keys[j]]?.children
      if (children) {
        const findResult = findPathByLeafId(leafId, children, tmpPath)
        if (findResult) {
          return findResult
        }
      }
    }
  }
}

// 给当前点击的组件设置聚焦
function handleSlotsFocus(block: VisualEditorBlockData, _vid: string) {
  const slots = block.props?.slots || {}
  if (Object.keys(slots).length > 0) {
    Object.keys(slots).forEach((key) => {
      slots[key]?.children?.forEach((item: VisualEditorBlockData) => {
        item.focusWithChild = false
        item.focus = item._vid === _vid
        if (item.focus) {
          const arr = findPathByLeafId(_vid, currentPage.value.blocks)
          arr.forEach(n => (n.focusWithChild = true))
        }
        if (Object.keys(item.props?.slots || {}).length) {
          handleSlotsFocus(item, _vid)
        }
      })
    })
  }
}

/**
 * 取消选择当前组件
 */
function deSelectComp() {
  floatingSettingVisible.value = false
  selectedBlockIds.value = []
  currentPage.value.blocks.forEach((block) => {
    block.focus = false
    block.focusWithChild = false
  })
  setCurrentBlock(null)
}

/**
 * 选择要操作的组件
 * @param element
 */
function selectComp(element: VisualEditorBlockData, event?: MouseEvent) {
  if (!element?._vid) {
    return
  }

  const multiSelect = Boolean(event?.metaKey || event?.ctrlKey)
  if (multiSelect) {
    selectedBlockIds.value = selectedBlockIds.value.includes(element._vid)
      ? selectedBlockIds.value.filter(id => id !== element._vid)
      : [...selectedBlockIds.value, element._vid]
  }
  else {
    selectedBlockIds.value = [element._vid]
  }

  controlStore.customComponentsVisible = false
  setCurrentBlock(element)

  currentPage.value.blocks.forEach((block) => {
    block.focus = selectedBlockIds.value.includes(block._vid)
    block.focusWithChild = false
    handleSlotsFocus(block, element._vid)
  })

  if (selectedBlockIds.value.length === 1) {
    element.focusWithChild = false
  }
}

function onCanvasMousedown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    target.classList.contains('edit-canvas')
    || target.classList.contains('edit-canvas-inner')
    || target.classList.contains('vgl-layout')
  ) {
    deSelectComp()
  }
}

function onDragover(e: DragEvent) {
  e.preventDefault()
}

function onLayoutUpdated() {
  const focused = currentPage.value.blocks.find(item => item._vid === currentBlock.value?._vid)
  if (focused) {
    setCurrentBlock(focused)
  }
  recordHistory()
}

/**
 * 删除组件
 */
function deleteComp(block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  const index = parentBlocks.findIndex(item => item._vid === block._vid)
  if (index !== -1) {
    delete globalProperties.$$refs[parentBlocks[index]._vid]
    const delTarget = parentBlocks.splice(index, 1)[0]
    if (delTarget.focus) {
      setCurrentBlock({} as VisualEditorBlockData)
    }
    recordHistory()
  }
}

function onContextmenuBlock(e: MouseEvent, block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  $$dropdown({
    reference: e,
    content: () => (
      <>
        <DropdownOption
          label="复制节点"
          icon="el-icon-document-copy"
          {...{
            onClick: () => {
              const index = parentBlocks.findIndex(item => item._vid === block._vid)
              if (index !== -1) {
                const setBlockVid = (block: VisualEditorBlockData) => {
                  block._vid = `vid_${generateNanoid()}`
                  block.focus = false
                  const slots = block?.props?.slots || {}
                  const slotKeys = Object.keys(slots)
                  if (slotKeys.length) {
                    slotKeys.forEach((slotKey) => {
                      slots[slotKey]?.children?.forEach((child: VisualEditorBlockData) => setBlockVid(child))
                    })
                  }
                }
                const blockCopy = cloneDeep(parentBlocks[index])
                setBlockVid(blockCopy)
                parentBlocks.splice(index + 1, 0, blockCopy)
              }
            },
          }}
        />
        <DropdownOption
          label="查看节点"
          icon="el-icon-view"
          {...{
            onClick: () =>
              useModal({
                title: '节点信息',
                footer: null,
                props: {
                  width: 600,
                },
                content: () => (
                  <MonacoEditor
                    code={JSON.stringify(block)}
                    layout={{ width: 530, height: 600 }}
                    vid={block._vid}
                  />
                ),
              }),
          }}
        />
        <DropdownOption
          label="删除节点"
          icon="el-icon-delete"
          {...{
            onClick: () => deleteComp(block, parentBlocks),
          }}
        />
      </>
    ),
  })
}

function setScale(v: number) {
  currentScale.value = v
}

function getScale() {
  return currentScale.value
}

function initAnimate() {
  const animations = currentPage.value.blocks.filter(block => block?.animations)?.map(block => ({
    _vid: block._vid,
    animations: block.animations,
  }))

  animations.forEach(({ _vid, animations }) => {
    const anmiationEl = getBlockAnimationElement(_vid)
    useAnimate(anmiationEl, animations)
  })
}

watch(visualLoading, (value, oldValue) => {
  if (!value && oldValue) {
    initAnimate()
  }
})

watch(() => props?.scale, () => {
  currentScale.value = props?.scale || 1
}, { immediate: true })

watch(currentScale, () => {
  emits('changeScale', currentScale.value)
})

defineExpose({
  setScale,
  getScale,
  drag: dragging,
  dragEnd,
})
</script>

<template>
  <div :class="$style['edit-control-container']">
    <div ref="wrapper" :class="$style['wrap-container']">
      <div
        ref="canvasRef"
        v-loading="visualLoading"
        class="edit-canvas"
        :style="editCanvasStyle"
        @dragover="onDragover"
        @mousedown="onCanvasMousedown"
      >
        <div class="edit-canvas-inner">
          <GridLayout
            ref="gridLayout"
            v-model:layout="currentPage.blocks"
            class="grid-layout-canvas"
            :col-num="gridColNum"
            :row-height="15"
            :margin="[0, 0]"
            :allow-overlap="true"
            @layout-updated="onLayoutUpdated"
          >
            <template #item="{ item }: { item: VisualEditorBlockData }">
              <div
                :key="item._vid"
                :data-label="item.label"
                class="list-group-item"
                :style="getBlockBorderStyle(item)"
                :class="{
                  'focus': item.focus,
                  'focusWithChild': item.focusWithChild,
                  drag,
                  'has-slot': !!Object.keys(item.props?.slots || {}).length,
                  'has-inner-title': item.showTitle === true && isInnerBlockTitle(item.titleStyle),
                  [`list-group-item-${item._vid}`]: true,
                }"
                @mousedown.stop="selectComp(item, $event)"
                @contextmenu.stop.prevent="onContextmenuBlock($event, item)"
              >
                <div
                  v-if="item.showTitle === true && isInnerBlockTitle(item.titleStyle)"
                  class="block-title-inner"
                  :style="getBlockTitleInlineStyle(item.titleStyle)"
                >
                  {{ getBlockTitleText(item) }}
                </div>
                <div class="list-group-item__body">
                  <span
                    v-if="item.showTitle === true && !isInnerBlockTitle(item.titleStyle)"
                    class="block-title-outer"
                    :class="`block-title-outer--${item.titleStyle?.position || 'outer-left'}`"
                    :style="getBlockTitleInlineStyle(item.titleStyle)"
                  >
                    {{ getBlockTitleText(item) }}
                  </span>
                  <CompRender
                    :element="item"
                    :style="{
                      pointerEvents: Object.keys(item.props?.slots || {}).length ? 'auto' : 'none',
                    }"
                  >
                    <template v-for="(value, slotKey) in item.props?.slots" :key="slotKey" #[slotKey]>
                      <SlotItem
                        v-model:children="value.children"
                        v-model:drag="drag"
                        :slot-key="slotKey"
                        :on-contextmenu-block="onContextmenuBlock"
                        :select-comp="selectComp"
                        :delete-comp="deleteComp"
                      />
                    </template>
                  </CompRender>
                </div>
              </div>
            </template>
          </GridLayout>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.edit-control-container {
  width: 100%;
  height: 100%;
  padding: 16px;

  .wrap-container {
    width: 100%;
    height: 100%;
    box-shadow: 0 8px 10px #00000012;
    background-color: #f5f5f5;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
  }
}
</style>

<style lang="scss" scoped>
@use './func.scss' as *;

.edit-canvas-scroll {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.edit-canvas {
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  border-radius: var(--el-border-radius-base);
  overflow: visible;
}

.edit-canvas-inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
  border-radius: inherit;
}

.grid-layout-canvas {
  width: 100%;
  min-height: 100%;
}

.list-group-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  cursor: pointer;
  // background-color: #fff;
  overflow: hidden;
  outline: none;

  /* 选中/悬停描边置于最上层，避免被内部内容背景遮盖 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-radius: inherit;
    pointer-events: none;
    z-index: 30;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  &:hover:not(.focus)::after {
    border-color: var(--el-color-primary-light-5);
  }

  &.focus::after {
    border-color: var(--el-color-primary);
  }

  &.focusWithChild:not(.focus)::after {
    border: 2px dashed var(--el-color-primary-light-7);
  }

  &.focusWithChild::before {
    display: none;
  }
}

.list-group-item__body {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  overflow: hidden;
}

/* 卡片内顶部标题（参考图：左上、加粗、深色） */
.block-title-inner {
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.4;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

/* 编辑态外侧角标（可选） */
.block-title-outer {
  position: absolute;
  z-index: 5;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.block-title-outer--outer-left {
  top: 0;
  left: -3px;
  transform: translate(-100%, 0);
}

.block-title-outer--outer-right {
  top: 0;
  right: -3px;
  transform: translate(100%, 0);
}

.block-title-outer--outer-top {
  top: 2px;
  left: 0;
  transform: translate(0, -100%);
}

:deep(.vgl-item:has(.list-group-item.focus)) {
  z-index: 12;
}

:deep(.vgl-item) {
  transition: box-shadow 0.15s ease;
}

:deep(.vgl-item--resizing),
:deep(.vgl-item--dragging) {
  z-index: 10;
}
</style>
