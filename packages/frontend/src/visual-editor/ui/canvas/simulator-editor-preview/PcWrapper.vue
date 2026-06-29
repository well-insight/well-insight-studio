<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { cloneDeep } from 'lodash-es'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolvePageBackgroundColor } from '@/common/types/canvasTheme'
import { useAnimate } from '@/hooks/useAnimate'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { resolveBlockBorderCss } from '@/utils/blockBorder'
import {
  getBlockAnimationElement,
  getBlockTitleInlineStyle,
  getBlockTitleText,
  isInnerBlockTitle,
} from '@/visual-editor/core/visual-editor.utils'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import CompRender from './comp-render'
import PreviewSlotItem from './PreviewSlotItem.vue'

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

const gridColNum = computed(() => {
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth)) // 1px 步长：列数 = 设计宽度
})

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
    minHeight: `${config?.pageSize?.height || 720}px`,
    backgroundColor: bgColor,
    backgroundImage: bgImage,
    backgroundRepeat: config?.bgRepeat || 'no-repeat',
    backgroundSize: config?.bgSize || 'cover',
    boxSizing: 'border-box',
  } as CSSProperties
})

function initAnimations() {
  const blocks = previewLayout.value
  blocks
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
        <div :class="$style.canvasInner" :style="{ position: 'relative', minHeight: '400px' }">
          <template v-if="previewLayout.length > 0">
            <!-- 预览使用自研绝对定位（不再依赖 grid-layout-plus） -->
            <div
              v-for="item in previewLayout"
              :key="item._vid"
              class="preview-block"
              :style="{
                ...getBlockBorderStyle(item),
                position: 'absolute',
                left: `${(item.x || 0)}px`,
                top: `${(item.y || 0)}px`,
                width: `${(item.w || 120)}px`,
                height: `${(item.h || 40)}px`,
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
                <CompRender :element="item">
                  <template
                    v-for="(slotValue, slotKey) in item.props?.slots"
                    :key="slotKey"
                    #[slotKey]
                  >
                    <PreviewSlotItem :children="slotValue.children ?? []" />
                  </template>
                </CompRender>
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
.grid-layout-preview {
  width: 100%;
  min-height: 100%;
}

.preview-block {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

.preview-block__body {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  overflow: hidden;
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

:deep(.vgl-item) {
  transition: none;
}

:deep(.vgl-item__resizer) {
  display: none !important;
}
</style>
