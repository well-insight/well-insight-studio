<script setup lang="ts">
import type { ComponentBorderOverride, TextStyleConfig as TextStyleConfigValue } from '@/visual-editor/core/visual-editor.utils'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { ArrowDown, CaretBottom, Setting } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { defaultTextStyleConfig } from '@/visual-editor/core/visual-editor.utils'
import { BorderStyleConfig } from '@/visual-editor/ui/shared/border-style-config'
import { FormatInputNumber } from '@/visual-editor/ui/shared/format-input-number'
import ImageUpload from '@/visual-editor/ui/shared/image-upload/ImageUpload.vue'
import { TextStyleConfig } from '@/visual-editor/ui/shared/text-style-config'

const props = defineProps<{ block: VisualEditorBlockData }>()

const open1 = ref(true)
const open2 = ref(true)
const open3 = ref(false)

const showTitle = computed({
  get: () => props.block?.showTitle === true,
  set(val: boolean) {
    if (!props.block?._vid) return
    props.block.showTitle = val
    if (val && !props.block.titleStyle) {
      props.block.titleStyle = defaultTextStyleConfig()
    }
  },
})

const titleStyle = computed({
  get: () => props.block?.titleStyle ?? defaultTextStyleConfig(),
  set(val: TextStyleConfigValue) {
    if (!props.block?._vid) return
    props.block.titleStyle = val
  },
})

const gridWidth = computed({
  get: () => props.block?.w ?? props.block?.width ?? 2,
  set(val: number) {
    if (!props.block?._vid) return
    props.block.w = val
    if ('width' in props.block) {
      ;(props.block as any).width = val
    }
  },
})

const gridHeight = computed({
  get: () => props.block?.h ?? props.block?.height ?? 2,
  set(val: number) {
    if (!props.block?._vid) return
    props.block.h = val
    if ('height' in props.block) {
      ;(props.block as any).height = val
    }
  },
})

const borderOverride = computed({
  get: (): ComponentBorderOverride => {
    if (!props.block?.borderOverride) {
      props.block.borderOverride = { show: null }
    }
    return props.block.borderOverride
  },
  set(val: ComponentBorderOverride) {
    if (!props.block?._vid) return
    props.block.borderOverride = val
  },
})

const compPaddingAttrs = ['paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom']

watch(
  () => compPaddingAttrs.map(item => (props.block?.styles as any)?.[item]),
  (val: string[]) => {
    if (!props.block?.styles) return
    const isSame = val.every(item => props.block.styles?.tempPadding === item)
    if (isSame || new Set(val).size === 1) {
      props.block.styles.tempPadding = val[0]
    } else {
      props.block.styles.tempPadding = ''
    }
  },
  { immediate: true },
)

const compPadding = computed({
  get: () => props.block?.styles?.tempPadding,
  set(val) {
    if (!props.block?.styles) return
    const styles = props.block.styles as any
    compPaddingAttrs.forEach((item) => { styles[item] = val })
    styles.tempPadding = val
  },
})

const bgImageUrl = computed({
  get: () => {
    const raw = `${props.block?.styles?.backgroundImage || ''}`.trim()
    const matched = raw.match(/^url\((['"]?)(.*)\1\)$/)
    return matched ? matched[2] : raw
  },
  set: (val: string) => {
    if (!props.block?.styles) return
    const next = (val || '').trim()
    props.block.styles.backgroundImage = next ? `url(${next})` : 'none'
  },
})
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom"
    :show-arrow="false"
    transition="el-zoom-in-top"
    popper-class="toolbar-popover"
    :hide-on-click="false"
  >
    <el-button text :icon="Setting">
      <span>基础配置</span>
      <el-icon><CaretBottom /></el-icon>
    </el-button>
    <template #dropdown>
      <div :class="$style['custom-header']">
        <span :class="$style['header-title']">基础配置</span>
      </div>
      <el-scrollbar :class="$style['scroll-body']">
        <div :class="$style['card-list']">
        <!-- 基础设置 -->
        <div :class="$style['card']">
          <div :class="$style['card__header']" @click="open1 = !open1">
            <el-icon :class="$style['card__arrow']" :style="{ transform: open1 ? 'rotate(0deg)' : 'rotate(-90deg)' }">
              <ArrowDown />
            </el-icon>
            <span :class="$style['card__title']">基础设置</span>
          </div>
          <div v-show="open1" :class="$style['card__body']">
            <div :class="$style['row']">
              <span :class="$style['row__label']">组件名称</span>
              <div :class="$style['row__content']">
                <el-input v-model="block.label" clearable placeholder="请输入组件名称" maxlength="32" />
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">展示标题</span>
              <div :class="$style['row__content']">
                <el-switch v-model="showTitle" />
              </div>
            </div>
            <TextStyleConfig v-if="showTitle" v-model="titleStyle" layout="dropdown" show-position show-background show-border-radius size="default" :teleported="false" />
          </div>
        </div>

        <!-- 尺寸与背景 -->
        <div :class="$style['card']">
          <div :class="$style['card__header']" @click="open2 = !open2">
            <el-icon :class="$style['card__arrow']" :style="{ transform: open2 ? 'rotate(0deg)' : 'rotate(-90deg)' }">
              <ArrowDown />
            </el-icon>
            <span :class="$style['card__title']">尺寸与背景</span>
          </div>
          <div v-show="open2" :class="$style['card__body']">
            <div :class="$style['row']">
              <span :class="$style['row__label']">宽度</span>
              <div :class="$style['row__content']">
                <el-input-number v-model="gridWidth" :min="1" />
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">高度</span>
              <div :class="$style['row__content']">
                <el-input-number v-model="gridHeight" :min="1" />
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">背景颜色</span>
              <div :class="$style['row__content']">
                <el-color-picker v-model="block.styles.backgroundColor" />
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">背景图片</span>
              <div :class="$style['row__content']">
                <ImageUpload v-model="bgImageUrl" />
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">图片重复</span>
              <div :class="$style['row__content']">
                <el-select v-model="block.styles.backgroundRepeat" clearable :teleported="false">
                  <el-option label="不重复" value="no-repeat" />
                  <el-option label="双向重复" value="repeat" />
                  <el-option label="水平重复" value="repeat-x" />
                  <el-option label="垂直重复" value="repeat-y" />
                </el-select>
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">图片大小</span>
              <div :class="$style['row__content']">
                <el-select v-model="block.styles.backgroundSize" clearable :teleported="false">
                  <el-option label="覆盖" value="cover" />
                  <el-option label="完整显示" value="contain" />
                  <el-option label="拉伸铺满" value="100% 100%" />
                  <el-option label="原始尺寸" value="auto" />
                </el-select>
              </div>
            </div>
          </div>
        </div>

        <!-- 布局 -->
        <div :class="$style['card']">
          <div :class="$style['card__header']" @click="open3 = !open3">
            <el-icon :class="$style['card__arrow']" :style="{ transform: open3 ? 'rotate(0deg)' : 'rotate(-90deg)' }">
              <ArrowDown />
            </el-icon>
            <span :class="$style['card__title']">布局</span>
          </div>
          <div v-show="open3" :class="$style['card__body']">
            <div :class="$style['row']">
              <span :class="$style['row__label']">水平对齐</span>
              <div :class="$style['row__content']">
                <el-radio-group v-model="block.styles.justifyContent">
                  <el-radio-button value="flex-start">左</el-radio-button>
                  <el-radio-button value="center">中</el-radio-button>
                  <el-radio-button value="flex-end">右</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">垂直对齐</span>
              <div :class="$style['row__content']">
                <el-radio-group v-model="block.styles.alignItems">
                  <el-radio-button value="flex-start">上</el-radio-button>
                  <el-radio-button value="center">中</el-radio-button>
                  <el-radio-button value="flex-end">下</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div :class="$style['row']">
              <span :class="$style['row__label']">内边距</span>
              <div :class="$style['row__content']">
                <FormatInputNumber v-model="compPadding" />
              </div>
            </div>
            <BorderStyleConfig v-model="borderOverride" inheritable :teleported="false" />
          </div>
        </div>
      </div>
    </el-scrollbar>
    </template>
  </el-dropdown>
</template>

<style lang="scss" module>
.custom-header {
  height: 44px;
  padding: 0 14px 0 18px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.3px;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--el-color-primary);
    margin-right: 8px;
    vertical-align: middle;
  }
}

.header-actions {
  margin-left: auto;

  :global(.el-button) {
    width: 28px;
    height: 28px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.scroll-body {
  padding: 12px 14px 4px;
  width: 340px;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 10px;
}

.card {
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--el-border-color);
  }

  &__header {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 10px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__arrow {
    margin-right: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    padding: 2px 10px 10px;
  }
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  gap: 12px;

  & + & {
    margin-top: 6px;
  }

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }
}
</style>

<style lang="scss">
.toolbar-popover {
  --el-popover-padding: 0;
  --el-popover-border-radius: 12px;

  padding: 0 !important;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-dark);
  width: 340px !important;
}
</style>
