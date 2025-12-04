<script lang="ts" setup>
import type { CSSProperties } from 'vue'

import { useResizeObserver } from '@vueuse/core'
import { cloneDeep, debounce } from 'lodash-es'
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getDesignContentById, setImg } from '@/api'
import MarkLine from '@/components/Editor/MarkLine.vue'
import SketchRule from '@/components/Ruler/sketchRuler.vue'
import { DraggableContainer, VueDraggableResizable } from '@/components/vue3-draggable-resizable'
import { useHtml2canvas } from '@/hooks/useDom2image'
import { useDesignStore } from '@/stores/design'

import { uuid } from '@/utils'

const deisgnStore = useDesignStore()
const route = useRoute()

const canvasId = String(route.query?.key) || ''

const componentLoading = ref(false)

const $wrap = ref<any>()
const $sketchRule = ref<any>()
const canvasRef = ref<any>()
const sketchRuleKey = ref<string>('')
const domeStr = ref<string>('')
const pageRef = ref()

const shapeRef = useTemplateRef('shapeRef')

// 缩放可视区
const sliderConfig = reactive<any>({
  scaleValue: 60,
  inputScale: (scale: number) => {
    sliderConfig.scaleValue = scale
    sketchRuleKey.value = (new Date()).toString()
  },
  formatSliderTip: (value: any) => {
    return `${value}%`
  },
})
const scaleValueReal = computed(() => {
  return sliderConfig.scaleValue / 100
})

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
      $wrap.value.scrollLeft = $wrap.value.scrollLeft - (e.x - startMoveWrap.x)
      $wrap.value.scrollTop = $wrap.value.scrollTop - (e.y - startMoveWrap.y)
      hRulerY.value = `-${$wrap.value.scrollTop}px`
      hRulerX.value = `-${$wrap.value.scrollLeft}px`
      startMoveWrap.x = e.x
      startMoveWrap.y = e.y
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
      sliderConfig.scaleValue = sliderConfig.scaleValue - 5
    }
    else {
      sliderConfig.scaleValue = sliderConfig.scaleValue + 5
    }
  }
}

/**
 * 设置wrap显示的位置和大小
 */
function setWrapPositionSize() {
  // 监听wrap的尺寸变化
  useResizeObserver($wrap, debounce(() => {
    const wrapW = $wrap.value.clientWidth
    const wrapH = $wrap.value.clientHeight
    const canvasW = canvasRef.value.clientWidth
    const canvasH = canvasRef.value.clientHeight
    if (canvasW > canvasH) {
      sliderConfig.scaleValue = ~~(((wrapW - 200) / canvasW) * 100) // 数字取整
    }
    else {
      sliderConfig.scaleValue = ~~(((wrapH - 200) / canvasH) * 100) // 数字取整
    }
    const scale = sliderConfig.scaleValue / 100
    const x = ($wrap.value.clientWidth - canvasRef.value.clientWidth * scale) / 2
    const y = ($wrap.value.clientHeight - canvasRef.value.clientHeight * scale) / 2
    $wrap.value.scrollTop = 5000 - y
    $wrap.value.scrollLeft = 5000 - x
    hRulerY.value = `-${$wrap.value.scrollTop}px`
    hRulerX.value = `-${$wrap.value.scrollLeft}px`
  }, 50))
}

defineExpose({
  setWrapPositionSize,
})

// 监听键盘按键事件componentData
function keyEvent() {
  document.addEventListener('keydown', (e: any) => {
    if (e && e.code === 'Space') {
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
  // keyEvent()
})

// 自定义组件
const componentData = computed(() => {
  const data = deisgnStore.$state.componentsInCanvas
  return data.map((e) => {
    const width = Number.parseInt(e.style?.width || 0)
    const height = Number.parseInt(e.style?.height || 0)
    return {
      ...e,
      initH: height,
      initW: width,
      x: Number.parseInt(e.style?.left || 0),
      y: Number.parseInt(e.style?.top || 0),
    }
  })
})

function dragEnd({ x, y }: { x: number, y: number }) {
  console.log(x, y, shapeRef.value)
}

function resizeEnd() {

}

function activated(index: number) {
  console.log('activated', deisgnStore.curComponentIndex)
  deisgnStore.setCurComponentIndex(index)
}

function deactivated(index: number) {
  console.log('deactivated', deisgnStore.curComponentIndex)
  if (deisgnStore.curComponentIndex === index) {
    deisgnStore.setCurComponentIndex(-1)
  }
}

// 拖拽组件到当前画布
function handleDrop(e: any) {
  e.preventDefault()
  e.stopPropagation()
  const component = cloneDeep(JSON.parse(e.dataTransfer.getData('component')) || {})
  const x = e.offsetX
  const y = e.offsetY
  const width = Number.parseInt(component.style?.width || 0)
  const height = Number.parseInt(component.style?.height || 0)
  component.style.top = `${y - height / 2}px`
  component.style.left = `${x - width / 2}px`
  component.style.zIndex = componentData.value.length + 1 // 组件的定位层级
  component.id = uuid() // 生成uuid
  component.ifLock = false // 是否锁定
  component.ifShow = true // 是否显示
  component.label = `${component.label}-${componentData.value.length + 1}`
  deisgnStore.addComponentsInCanvas(component)
}
function handleDragOver(e: any) {
  e.preventDefault()
}

watch(() => sliderConfig.scaleValue, (n) => {
  sliderConfig.scaleValue = n < 10 ? 10 : n
  deisgnStore.$patch({
    canvasScale: scaleValueReal.value,
  })
})

function canvasMousemove() {
  // const { x, y } = useMouseXY();
  // console.log(x, y)
}

// page 配置变动
const pageConfig = computed(() => {
  const pageConfig = deisgnStore.pageConfig
  return {
    ...pageConfig,
    width: `${pageConfig.width}px`,
    height: `${pageConfig.height}px`,
    backgroundColor: pageConfig.backgroundColor,
    backgroundImage: `url(${pageConfig.backgroundImage})`,
    backgroundAttachment: pageConfig.backgroundAttachment || 'fixed',
  } as CSSProperties
})

// 不适用深层监听 性能消耗
const editConfigContent = computed(() => deisgnStore.editConfigContent)

// 数据变动更新
async function setComponentsUpdate() {
  console.log('配置更新')

  const res = await useHtml2canvas(canvasRef.value as HTMLElement, {})
  const content = JSON.stringify(editConfigContent.value)
  await deisgnStore.updateDesignById(canvasId, content)
  await setImg(canvasId, res)
}

async function getComponents() {
  componentLoading.value = true

  const res = await getDesignContentById(canvasId)
  if (res) {
    componentLoading.value = false
    const { pageConfig = {}, componentsInCanvas = [] } = res
    deisgnStore.setComponentsInCanvas(componentsInCanvas)
    deisgnStore.setPageConfig(pageConfig)
  }
  componentLoading.value = false
}

getComponents()

// watch([componentData, () => deisgnStore.$state.pageConfig], debounce(async () => {
//   await setComponentsUpdate()
// }, 1000, false), { deep: true })
</script>

<template>
  <div class="edit-control-container">
    <div class="wrap-container">
      <div
        id="wrap" ref="$wrap" @scroll.prevent="scrollEdit" @mousedown.prevent="wrapMousedown"
        @mousewheel="mouseWheel"
      >
        <div id="content">
          <div
            ref="canvasRef" v-loading="componentLoading" class="edit-canvas"
            :style="{ transform: `scale(${scaleValueReal})`, cursor: isEnterSpace ? 'pointer' : 'auto', ...pageConfig }"
            @mousemove="canvasMousemove" @drop="handleDrop" @dragover="handleDragOver"
          >
            <div class="components-show-content">
              <DraggableContainer>
                <!-- 页面组件列表展示 -->
                <template v-for="(item, index) in componentData" :key="item.id + item.id">
                  <VueDraggableResizable
                    ref="shapeRef"
                    :class-name="$style['drag-resize']" :init-h="item.initH" :init-w="item.initW"
                    :x="item.x" :y="item.y"
                    :scale="scaleValueReal"
                    @drag-end="dragEnd"
                    @resize-end="resizeEnd"
                    @activated="activated(index)"
                    @deactivated="deactivated(index)"
                  >
                    <component :is="item.component" class="custom-component-class" :chart-option="item.chartOption" />
                  </VueDraggableResizable>
                </template>

                <!-- <Shape
                :default-style="item.style"
                :style="item.style"
                :element="item"
                :z-index="index"
                :index="index"
              /> -->
                <!-- <MarkLine /> -->
              </DraggableContainer>
            </div>
          </div>
        </div>
      </div>
      <div class="edit-bottom-menu">
        <span class="key-down-show">按下 [ {{}} ] 键</span>
        <el-slider
          v-model="sliderConfig.scaleValue" :format-tooltip="sliderConfig.formatSliderTip" show-input
          size="small" @input="sliderConfig.inputScale"
        />
      </div>
    </div>
    <SketchRule
      :key="sketchRuleKey" ref="$sketchRule" class="ruler-container" :lang="lang" :thick="thick"
      :scale="scaleValueReal" :width="10000" :height="10000" :start-x="-5000 / scaleValueReal"
      :start-y="-5000 / scaleValueReal" :shadow="shadow" :hor-line-arr="lines.h" :ver-line-arr="lines.v"
      :corner-active="true" @handle-line="handleLine" @on-corner-click="handleCornerClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.edit-control-container {
  width: 100%;
  height: 100%;
  background-image: linear-gradient(#fafafc 14px, transparent 0), linear-gradient(90deg, transparent 14px, #373739 0);
  background-color: #fff;
  background-size: 15px 15px, 15px 15px;
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
      height: calc(100% - 40px);
      user-select: none;
      padding-bottom: 0;
      top: 0;
      overflow: auto;

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
          border-radius: 20px;
          -webkit-transform-origin: 0 0;
          transform-origin: 0 0;
          overflow: hidden;

          .components-show-content {
            height: 100%;
            width: 100%;

            .custom-component-class {
              width: 100%;
              height: 100%;
              pointer-events: none;
            }

          }
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
}
</style>
