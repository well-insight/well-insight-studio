<script lang="tsx" setup>
import type { CSSProperties, StyleValue } from 'vue'

import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useMouseInElement, useResizeObserver } from '@vueuse/core'
import { cloneDeep, debounce } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import MarkLine from '@/components/Editor/MarkLine.vue'
import SketchRule from '@/components/Ruler/sketchRuler.vue'
import { VueDragResizeRotate } from '@/components/vue3-drag-resize-rotate'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import MonacoEditor from '@/visual-editor/components/common/monaco-editor/MonacoEditor'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/utils'
import { $$dropdown, DropdownOption } from '@/visual-editor/utils/dropdown-service'
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

const { currentPage, setCurrentBlock } = useVisualData()

const { globalProperties } = useGlobalProperties()

const controlStore = useControlStore()

const { editScale } = storeToRefs(controlStore)

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
})

function canvasMousemove() {
  // const { x, y } = useMouseXY();
  // console.log(x, y)
}

/**
 * @description 操作当前页面样式表
 */
const editCanvasStyle = computed(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  return {
    width: `100%`,
    height: `${pageSize?.height || 0}px`,
    backgroundColor: `${bgColor}`,
    backgroundImage: `url(${bgImage})`,
    backgroundRepeat: `${bgRepeat}`,
    backgroundSize: `${bgSize}`,
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
  <div :class="$style.preview">
    <el-scrollbar class="w-full h-full">
      <div ref="canvasRef" v-loading="componentLoading" :class="$style.canvas" :style="editCanvasStyle">
        <VueDragResizeRotate
          v-for="outElement in currentPage.blocks"
          :key="outElement._vid"
          :scale-ratio="scale"
          :active="false"
          :draggable="false"
          :resizable="false"
          :x="outElement?.x"
          :y="outElement?.y"
          :w="outElement?.width"
          :h="outElement?.height"
          event-scope="#wrap"
          class-name="drag-resize-rotate-normal"
        >
          <template #default="{ enabled }">
            <div
              class="list-group-item"
              :data-label="outElement.label"
              :class="{
                focus: outElement.focus && enabled,
                focusWithChild: outElement.focusWithChild && enabled,
                drag,
                ['has-slot']: !!Object.keys(outElement.props.slots || {}).length
              }"
            >
              <CompRender :key="outElement._vid" :element="outElement">
                <template v-for="(value, slotKey) in outElement.props?.slots" :key="slotKey" #[slotKey]>
                  <SlotItem
                    v-model:children="value.children"
                    v-model:drag="drag"
                    :slot-key="slotKey"
                    :select-comp="selectComp"
                  />
                </template>
              </CompRender>
            </div>
          </template>
        </VueDragResizeRotate>
      </div>
    </el-scrollbar>
  </div>
</template>

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

.preview {
  width: 100%;
  height: 100%;

  .canvas {
    position: relative;
  }
}

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
}
</style>
