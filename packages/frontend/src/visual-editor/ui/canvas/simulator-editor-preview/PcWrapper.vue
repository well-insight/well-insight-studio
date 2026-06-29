<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useResizeObserver } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolvePageBackgroundColor } from '@/common/types/canvasTheme'
import { useAnimate } from '@/hooks/useAnimate'
import {
  calcGridItemPixelRect,
  calcRootContentMinHeight,
  getRootCanvasGridMetrics,
} from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { resolveBlockBorderCss } from '@/utils/blockBorder'
import {
  DEFAULT_BLOCK_HEIGHT,
  DEFAULT_BLOCK_WIDTH,
  getBlockAnimationElement,
  getBlockTitleInlineStyle,
  getBlockTitleText,
  isInnerBlockTitle,
} from '@/visual-editor/core/visual-editor.utils'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import CompRender from './comp-render'

defineOptions({
  name: 'PcPreviewWrapper',
})

const props = withDefaults(
  defineProps<{
    /** 预览抽屉是否打开，用于同步布局快照 */
    active?: boolean
  }>(),
  {
    active: true,
  },
)

const { currentPage } = useVisualData()

const canvasInnerRef = ref<HTMLElement>()
const canvasWidth = ref(0)

useResizeObserver(canvasInnerRef, (entries) => {
  const entry = entries[0]
  canvasWidth.value = entry?.contentRect.width ?? 0
})

const designWidth = computed(() => currentPage.value?.config?.pageSize?.width || 1920)

function getGridMetrics() {
  const containerWidth = canvasWidth.value > 0
    ? canvasWidth.value
    : designWidth.value
  return getRootCanvasGridMetrics(containerWidth, designWidth.value)
}

function getRootItemPixelRect(block: VisualEditorBlockData) {
  return calcGridItemPixelRect(
    block.x || 0,
    block.y || 0,
    block.w || DEFAULT_BLOCK_WIDTH,
    block.h || DEFAULT_BLOCK_HEIGHT,
    getGridMetrics(),
  )
}

function getBlockBorderStyle(item: VisualEditorBlockData): CSSProperties {
  return resolveBlockBorderCss(item, currentPage.value?.config)
}

/** 预览专用布局快照，避免拖拽回写编辑态 */
const previewLayout = ref<VisualEditorBlockData[]>([])

function buildPreviewLayout() {
  const blocks = currentPage.value?.blocks ?? []
  previewLayout.value = cloneDeep(blocks).map(block => ({
    ...block,
    i: block.i ?? block._vid,
    static: true,
    focus: false,
    focusWithChild: false,
  }))
}

const editCanvasStyle = computed(() => {
  const config = currentPage.value?.config
  const bgColor = resolvePageBackgroundColor(config?.bgColor)
  const bgImage = config?.bgImage ? `url(${config.bgImage})` : 'none'
  return {
    width: '100%',
    minHeight: canvasMinHeight.value,
    backgroundColor: bgColor,
    backgroundImage: bgImage,
    backgroundRepeat: config?.bgRepeat || 'no-repeat',
    backgroundSize: config?.bgSize || 'cover',
    boxSizing: 'border-box',
  } as CSSProperties
})

const canvasMinHeight = computed(() => {
  void canvasWidth.value
  const pageH = Number(currentPage.value?.config?.pageSize?.height) || 720
  const contentH = calcRootContentMinHeight(
    previewLayout.value,
    getGridMetrics(),
    DEFAULT_BLOCK_HEIGHT,
  )
  return `${Math.max(pageH, contentH)}px`
})

function initAnimations() {
  previewLayout.value
    .filter(block => block.animations?.length)
    .forEach((block) => {
      const el = getBlockAnimationElement(block._vid)
      if (el) {
        useAnimate(el, block.animations)
      }
    })
}

watch(
  () => props.active,
  (open) => {
    if (open) {
      buildPreviewLayout()
      nextTick(() => {
        setTimeout(initAnimations, 300)
      })
    }
  },
  { immediate: true },
)

watch(
  () => currentPage.value?.blocks,
  () => {
    if (props.active) {
      buildPreviewLayout()
    }
  },
  { deep: true },
)

/** 预览模式也应用主题 */
const themeStore = useCanvasThemeStore()
const themeStyle = computed(() => themeStore.themeCSSVars)

onMounted(() => {
  if (props.active) {
    buildPreviewLayout()
    nextTick(() => setTimeout(initAnimations, 300))
  }
})
</script>

<template>
  <div :style="themeStyle" :class="$style.previewRoot">
    <el-scrollbar class="h-full w-full">
      <div :class="$style.canvas" :style="editCanvasStyle">
        <div
          ref="canvasInnerRef"
          :class="$style.canvasInner"
          :style="{ position: 'relative', minHeight: canvasMinHeight }"
        >
          <template v-if="previewLayout.length > 0">
            <div
              v-for="item in previewLayout"
              :key="item._vid"
              class="preview-block"
              :style="{
                ...getBlockBorderStyle(item),
                position: 'absolute',
                left: `${getRootItemPixelRect(item).left}px`,
                top: `${getRootItemPixelRect(item).top}px`,
                width: `${getRootItemPixelRect(item).width}px`,
                height: `${getRootItemPixelRect(item).height}px`,
              }"
              :class="{
                'preview-block--inner-title':
                  item.showTitle === true && isInnerBlockTitle(item.titleStyle),
              }"
            >
              <div
                v-if="item.showTitle === true && isInnerBlockTitle(item.titleStyle)"
                class="preview-block__title-inner"
                :style="getBlockTitleInlineStyle(item.titleStyle)"
              >
                {{ getBlockTitleText(item) }}
              </div>
              <div class="preview-block__body">
                <span
                  v-if="item.showTitle === true && !isInnerBlockTitle(item.titleStyle)"
                  class="preview-block__title-outer"
                  :class="`preview-block__title-outer--${item.titleStyle?.position || 'outer-left'}`"
                  :style="getBlockTitleInlineStyle(item.titleStyle)"
                >
                  {{ getBlockTitleText(item) }}
                </span>
                <CompRender :element="item" />
              </div>
            </div>
          </template>
          <div v-else :class="$style.empty">
            当前页面暂无组件
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" module>
.previewRoot {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.canvas {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  border-radius: var(--el-border-radius-base);
}

.canvasInner {
  width: 100%;
  min-height: inherit;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>

<style lang="scss" scoped>
.preview-block {
  position: relative;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

.preview-block__body {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}

.preview-block--inner-title {
  display: flex;
  flex-direction: column;
}

.preview-block--inner-title .preview-block__body {
  flex: 1;
  min-height: 0;
}

.preview-block__title-inner {
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.4;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-block__title-outer {
  position: absolute;
  z-index: 5;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.preview-block__title-outer--outer-left {
  top: 0;
  left: -3px;
  transform: translate(-100%, 0);
}

.preview-block__title-outer--outer-right {
  top: 0;
  right: -3px;
  transform: translate(100%, 0);
}

.preview-block__title-outer--outer-top {
  top: 2px;
  left: 0;
  transform: translate(0, -100%);
}
</style>
