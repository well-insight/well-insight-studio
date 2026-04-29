<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

import MarkLine from '@/components/Editor/MarkLine.vue'
import SketchRule from '@/components/Ruler/sketchRuler.vue'
import { VueDragResizeRotate } from '@/components/vue3-drag-resize-rotate'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { $$dropdown, DropdownOption } from '@/visual-editor/lib/dropdown-service'
import MonacoEditor from '@/visual-editor/ui/shared/monaco-editor/MonacoEditor'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useMouseInElement, useResizeObserver } from '@vueuse/core'
import { vLoading } from 'element-plus'
import { cloneDeep, debounce } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AttrSettingsToolbar } from '@/visual-editor/ui/workbench/attr-settings-toolbar'
import CompRender from './comp-render'
import SlotItem from './SlotItem.vue'
import { useAnimate } from '@/hooks/useAnimate'

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

const { currentPage, setCurrentBlock, currentBlock, updateCurrentBlock } = useVisualData()
const { globalProperties } = useGlobalProperties()

const controlStore = useControlStore()

const { editScale, floatingSettingVisible } = storeToRefs(controlStore)

const drag = ref(false)

const route = useRoute()

const canvasId = String(route.query?.key) || ''

const componentLoading = ref(false)

const $wrap = useTemplateRef('$wrap')
const canvasRef = useTemplateRef('canvasRef')
const sketchRuleKey = ref<string>('')

const { isOutside } = useMouseInElement($wrap)

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

function handleLine(e: any) {
  console.log(e)
}

function handleCornerClick(e: any) {
  console.log(e)
}

const hRulerX = ref('0')
const hRulerY = ref('0')
function scrollEdit(e: any) {
  hRulerY.value = `-${e.target.scrollTop}px`
  hRulerX.value = `-${e.target.scrollLeft}px`
}

const startMoveWrap = reactive({
  x: 0,
  y: 0,
})

function wrapMousedown(e: any) {
  if ((e.target && e.target.id === 'content') || isEnterSpace.value) {
    startMoveWrap.x = e.x
    startMoveWrap.y = e.y

    document.onmousemove = (e: any) => {
      if ($wrap.value) {
        $wrap.value.scrollLeft = $wrap.value.scrollLeft - (e.x - startMoveWrap.x)
        $wrap.value.scrollTop = $wrap.value.scrollTop - (e.y - startMoveWrap.y)
        hRulerY.value = `-${$wrap.value.scrollTop}px`
        hRulerX.value = `-${$wrap.value.scrollLeft}px`
        startMoveWrap.x = e.x
        startMoveWrap.y = e.y
      }
    }

    document.onmouseup = () => {
      document.onmousemove = null
      document.onmouseup = null
    }
  }
}

function mouseWheel(e: any) {
  if (isEnterSpace.value) {
    const mouseTo = e && (e.deltaY > 0 || e.deltaX > 0) ? 'down' : 'up'
    if (mouseTo === 'down') {
      currentScale.value = currentScale.value - 0.05
    }
    else {
      currentScale.value = currentScale.value + 5
    }
  }
}

/**
 * 设置wrap显示的位置和大小
 */
function setWrapPositionSize() {
  // 监听wrap的尺寸变化
  useResizeObserver($wrap, debounce(() => {
    if ($wrap.value) {
      const wrapW = $wrap.value?.clientWidth
      const wrapH = $wrap.value?.clientHeight
      const canvasW = canvasRef.value.clientWidth
      const canvasH = canvasRef.value.clientHeight
      if (canvasW > canvasH) {
        currentScale.value = Math.round(((wrapW - 100) / canvasW) * 100) / 100 // 数字取整
      }
      else {
        currentScale.value = Math.round((((wrapH) - 100) / canvasH) * 100) / 100 // 数字取整
      }
      const x = ($wrap.value?.clientWidth - canvasRef.value.clientWidth * currentScale.value) / 2
      const y = ($wrap.value?.clientHeight - canvasRef.value.clientHeight * currentScale.value) / 2
      $wrap.value.scrollTop = 5000 - y
      $wrap.value.scrollLeft = 5000 - x
      hRulerY.value = `-${$wrap.value.scrollTop}px`
      hRulerX.value = `-${$wrap.value.scrollLeft}px`
    }
  }, 50))
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
  setWrapPositionSize()
  keyEvent()

  nextTick(() => {
    setTimeout(() => {
      initAnimate()
    }, 1000)
  })
})

function canvasMousemove() {
  // const { x, y } = useMouseXY();
}

/**
 * @description 操作当前页面样式表
 */
const editCanvasStyle = computed(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  const normalizedBgColor = bgColor || '#ffffff'
  const normalizedBgImage = bgImage ? `url(${bgImage})` : 'none'
  const normalizedBgRepeat = bgRepeat || 'no-repeat'
  const normalizedBgSize = bgSize || 'cover'
  console.log('画布全局样式', bgImage, bgColor, pageSize, bgRepeat, bgSize )
  return {
    width: `${pageSize?.width || 0}px`,
    height: `${pageSize?.height || 0}px`,
    backgroundColor: normalizedBgColor,
    backgroundImage: normalizedBgImage,
    backgroundRepeat: normalizedBgRepeat,
    backgroundSize: normalizedBgSize,
    transform: `scale(${currentScale.value})`,
    cursor: isEnterSpace.value ? 'grab' : 'auto',
  } as CSSProperties
})

function elementDrop(e: DragEvent) {
  e.preventDefault() // 必须！
  // 获取拖拽传递的数据
  const moveData = { ...controlStore.moveVisualData, x: e?.offsetX - Number(controlStore.moveVisualData.width) / 2, y: e?.offsetY - Number(controlStore.moveVisualData.height) / 2 }

  if (moveData) {
    currentPage.value.blocks.push(moveData)

    controlStore.setMoveVisualData(null)
  }
}

function elementDragover(payload: DragEvent) {
  payload.preventDefault()
  payload.dataTransfer.dropEffect = 'move' // 配合 effectAllowed
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
  setCurrentBlock(null)
}

/**
 * 选择要操作的组件
 * @param element
 */
function selectComp(element: VisualEditorBlockData) {
  setTimeout(() => {
    // 选中组件关闭组件选择抽屉
    controlStore.customComponentsVisible = false

    setCurrentBlock(element)
    currentPage.value.blocks.forEach((block) => {
      block.focus = element._vid === block._vid
      block.focusWithChild = false
      handleSlotsFocus(block, element._vid)
      element.focusWithChild = false
    })
  })
}

/**
 * 删除组件
 */
function deleteComp(block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  console.log(block, 'block')
  const index = parentBlocks.findIndex(item => item._vid === block._vid)
  if (index !== -1) {
    delete globalProperties.$$refs[parentBlocks[index]._vid]
    const delTarget = parentBlocks.splice(index, 1)[0]
    if (delTarget.focus) {
      setCurrentBlock({} as VisualEditorBlockData)
    }
  }
}

/**
 * 移动组件
 */
function onDrag(x: number, y: number) {
  updateCurrentBlock({ x, y })
}

function onDragStop(x: number, y: number) {
  updateCurrentBlock({ x, y })
}

function onResize(x: number, y: number, width: number, height: number) {
  updateCurrentBlock({ x, y, width, height })
//
}
function onResizeStop(x: number, y: number, width: number, height: number) {
  updateCurrentBlock({ x, y, width, height })
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

const vLine = ref([])
const hLine = ref([])

function getRefLineParams(params: { vLine: any[], hLine: any[] }) {
  vLine.value = params.vLine
  hLine.value = params.hLine
}

function initAnimate() {
  const animations = currentPage.value.blocks.filter(block => block?.animations)?.map(block => ({
    _vid: block._vid,
    animations: block.animations,
  }))
  debugger

  animations.forEach(({ _vid, animations }) => {
    const anmiationEl = document.querySelector(`.list-group-item-${_vid}`)?.firstChild?.firstChild as HTMLElement
    debugger
    useAnimate(anmiationEl, animations)
  })

}

watch(() => props?.scale, () => {
  currentScale.value = props?.scale || 1
}, { immediate: true })

watch(currentScale, () => {
  emits('changeScale', currentScale.value)
})

defineExpose({
  setScale,
  getScale,
  setWrapPositionSize,
})
</script>

<template>
  <div class="edit-control-container">
    <div class="wrap-container">
      <div
        id="wrap"
        ref="$wrap"
        @scroll.prevent="scrollEdit"
        @mousedown.prevent="wrapMousedown"
        @mousewheel="mouseWheel"
      >
        <div id="content">
          <div
            ref="canvasRef"
            v-loading="componentLoading"
            class="edit-canvas"
            :style="editCanvasStyle"
            @drop="elementDrop"
            @mousemove="canvasMousemove"
            @dragover="elementDragover"
          >
            <template v-for="outElement in currentPage.blocks" :key="outElement._vid">
              <VueDragResizeRotate
                :scale-ratio="scale"
                :x="outElement?.x"
                :y="outElement?.y"
                :w="outElement?.width"
                :h="outElement?.height"
                event-scope="#wrap"
                :snap="true"
                :parent="false"
                :snap-border="true"
                :snap-tolerance="20"
                show-toolbar
                class-name="drag-resize-rotate-normal"
                @ref-line-params="getRefLineParams"
                @activated="selectComp(outElement)"
                @deactivated="deSelectComp()"
                @dragging="onDrag"
                @dragstop="onDragStop"
                @resizing="onResize"
                @resizestop="onResizeStop"
              >
                <template #default="{ enabled }">
                  <div
                    :data-label="outElement.label"
                    :class="{
                      focus: outElement.focus && enabled,
                      focusWithChild: outElement.focusWithChild && enabled,
                      drag,
                      ['has-slot']: !!Object.keys(outElement.props.slots || {}).length,
                      ['list-group-item']: true,
                      [`list-group-item-${outElement._vid}`]: true,
                    }"
                    @contextmenu.stop.prevent="onContextmenuBlock($event, outElement)"
                  >
                    <CompRender
                      :key="outElement._vid"
                      :element="outElement"
                      :style="{
                        pointerEvents: Object.keys(outElement.props?.slots || {}).length
                          ? 'auto'
                          : 'none',
                      }"
                    >
                      <template
                        v-for="(value, slotKey) in outElement.props?.slots"
                        :key="slotKey"
                        #[slotKey]
                      >
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
                </template>

                <template #toolbar>
                  <AttrSettingsToolbar></AttrSettingsToolbar>
                </template>
              </VueDragResizeRotate>
            </template>

            <MarkLine :horizontal-line="hLine" :vertical-line="vLine" />
          </div>
        </div>
      </div>
    </div>
    <SketchRule
      :key="sketchRuleKey"
      class="ruler-container"
      :lang="lang"
      :thick="thick"
      :scale="scale"
      :width="10000"
      :height="10000"
      :start-x="-5000 / scale"
      :start-y="-5000 / scale"
      :shadow="shadow"
      :hor-line-arr="lines.h"
      :ver-line-arr="lines.v"
      :corner-active="true"
      @handle-line="handleLine"
      @on-corner-click="handleCornerClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.edit-control-container {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(#fafafc 14px, transparent 0),
    linear-gradient(90deg, transparent 14px, #373739 0);
  background-color: #fff;
  background-size:
    15px 15px,
    15px 15px;
  position: relative;
  overflow: hidden;

  .wrap-container {
    width: 100%;
    height: 100%;
    position: absolute;
    overflow: hidden;

    #wrap {
      position: absolute;
      width: 100%;
      height: calc(100% - 0px);
      user-select: none;
      padding-bottom: 0;
      top: 0;
      overflow: auto;
      /* Firefox */
      /* scrollbar-width: none; */

      /* IE/Edge 旧版 */
      /* -ms-overflow-style: none; */

      &::-webkit-scrollbar {
        display: none;
        /* height: 200px; */
      }

      // &:hover {
      //     overflow: auto;
      // }

      #content {
        width: 10000px;
        height: 10000px;
        position: absolute;
        top: 0;
        left: 0;

        .edit-canvas {
          // height: v-bind('pageConfig.height')px;
          // width: v-bind('pageConfig.width')px;
          position: absolute;
          // background-color: v-bind('pageConfig.backgroundColor');
          top: 50%;
          left: 50%;
          box-shadow: 0 8px 10px #00000012;
          background-color: var(--el-bg-color);
          border-radius: var(--el-border-radius-base);
          -webkit-transform-origin: 0 0;
          transform-origin: 0 0;
          overflow: hidden;
        }
      }
    }

    .edit-bottom-menu {
      width: 100%;
      height: 40px;
      background-color: #f6f8f9;
      z-index: 100;
      position: absolute;
      bottom: 0;
      display: flex;
      align-items: center;
      padding: 10px;

      .el-slider {
        width: 300px;
        float: right;
        margin-left: auto;
      }

      .key-down-show {
        font-weight: bold;
      }
    }
  }
}
</style>

<style lang="scss">
.demos-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 192px;
  height: 108px;
}

.ruler-container {
  .h-container {
    position: absolute;
    width: 10000px !important;
    top: 0;
    left: v-bind(hRulerX) !important;
    transform-origin: center;
  }

  .v-container {
    position: absolute;
    height: 10000px !important;
    left: 0;
    top: v-bind(hRulerY) !important;
    transform-origin: center;
  }
}
</style>

<style lang="scss" module>
.drag-resize {
  transform: translate3d(0, 0, 0);
  will-change: transform;
  /* 替代border: 1px solid #ccc */
  box-shadow: inset 0 0 0 1px #ccc;
  /* 开启硬件加速，减少亚像素模糊 */
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 禁用亚像素抗锯齿（针对像素级渲染） */
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  /* SVG组件必备 */
}
</style>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>

<style lang="scss" scoped>
@use "./func.scss" as *;

.drag-resize-rotate-normal {
  border: none;
}

.list-group-item {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  // padding: 3px;
  // border: 2px solid var(--el-bg-color);
  cursor: move;

  > div {
    position: relative;
  }

  &.focus {
    @include showComponentBorder;
  }

  &.drag::after {
    display: none;
  }

  &:not(.has-slot) {
    content: "";
  }

  &.focusWithChild {
    @include showContainerBorder;
  }

  i {
    cursor: pointer;
  }

  &:hover {
    // 边框
    @include showComponentBorder;

    &::after {
      // 标签
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(left);
    }
  }
}
</style>
