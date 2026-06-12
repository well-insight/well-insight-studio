<script setup lang="ts">
import type { ComponentBorderOverride, TextStyleConfig as TextStyleConfigValue } from '@/visual-editor/core/visual-editor.utils'
import {
  BrushFilled,
  CaretBottom,
  Connection,
  DataLine,
  Grid,
  MoreFilled,
  Setting,
  VideoPlay,
} from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { isChartComponent } from '@/utils/datasetBinding'
import { defaultTextStyleConfig } from '@/visual-editor/core/visual-editor.utils'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { BorderStyleConfig } from '@/visual-editor/ui/shared/border-style-config'
import ChartDatasetBindDialog from '@/visual-editor/ui/shared/dataset-bind/ChartDatasetBindDialog.vue'
import { FormatInputNumber } from '@/visual-editor/ui/shared/format-input-number'
import { TextStyleConfig } from '@/visual-editor/ui/shared/text-style-config'
import { EventAction } from '@/visual-editor/ui/workbench/right-attribute-panel/components'
import { PropConfig } from '@/visual-editor/ui/workbench/right-attribute-panel/components/attr-editor/components/prop-config/prop-config-dropdown'
import ImageUpload from '@/visual-editor/ui/workbench/right-attribute-panel/components/page-setting/ImageUpload.vue'

const props = withDefaults(
  defineProps<{
    virualRef?: any
    /** default: 自由布局浮层；dock: 网格编辑器顶部上下文栏 */
    variant?: 'default' | 'dock'
  }>(),
  {
    virualRef: null,
    variant: 'default',
  },
)

const controlStore = useControlStore()
const { visualConfig, currentBlock } = useVisualData()

const chartBindVisible = ref(false)

const isChartBlock = computed(() =>
  currentBlock.value?.componentKey ? isChartComponent(currentBlock.value.componentKey) : false,
)

const componentItem = computed(() => {
  const componentKey = currentBlock.value?.componentKey
  return componentKey ? visualConfig.componentMap[componentKey] : null
})

const showTitle = computed({
  get: () => currentBlock.value?.showTitle === true,
  set(val: boolean) {
    if (!currentBlock.value?._vid)
      return
    currentBlock.value.showTitle = val
    if (val && !currentBlock.value.titleStyle) {
      currentBlock.value.titleStyle = defaultTextStyleConfig()
    }
  },
})

const titleStyle = computed({
  get: () => currentBlock.value?.titleStyle ?? defaultTextStyleConfig(),
  set(val: TextStyleConfigValue) {
    if (!currentBlock.value?._vid)
      return
    currentBlock.value.titleStyle = val
  },
})

const borderOverride = computed({
  get: (): ComponentBorderOverride => {
    if (!currentBlock.value?.borderOverride) {
      currentBlock.value.borderOverride = { show: null }
    }
    return currentBlock.value.borderOverride
  },
  set(val: ComponentBorderOverride) {
    if (!currentBlock.value?._vid)
      return
    currentBlock.value.borderOverride = val
  },
})

/** 网格布局：w/h；自由布局：width/height */
const gridWidth = computed({
  get: () => currentBlock.value?.w ?? currentBlock.value?.width ?? 2,
  set(val: number) {
    if (!currentBlock.value?._vid)
      return
    currentBlock.value.w = val
    if ('width' in currentBlock.value) {
      currentBlock.value.width = val
    }
  },
})

const gridHeight = computed({
  get: () => currentBlock.value?.h ?? currentBlock.value?.height ?? 2,
  set(val: number) {
    if (!currentBlock.value?._vid)
      return
    currentBlock.value.h = val
    if ('height' in currentBlock.value) {
      currentBlock.value.height = val
    }
  },
})

const compPaddingAttrs = ['paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom']

watch(
  () => compPaddingAttrs.map(item => currentBlock.value?.styles?.[item]),
  (val: string[]) => {
    if (!currentBlock.value?.styles) {
      return
    }
    const isSame = val.every(item => currentBlock.value.styles?.tempPadding === item)
    if (isSame || new Set(val).size === 1) {
      currentBlock.value.styles.tempPadding = val[0]
    }
    else {
      currentBlock.value.styles.tempPadding = ''
    }
  },
  { immediate: true },
)

const compPadding = computed({
  get: () => currentBlock.value?.styles?.tempPadding,
  set(val) {
    if (!currentBlock.value?.styles) {
      return
    }
    compPaddingAttrs.forEach((item) => {
      currentBlock.value.styles[item] = val
    })
    currentBlock.value.styles.tempPadding = val
  },
})

const bgImageUrl = computed({
  get: () => {
    const raw = `${currentBlock.value?.styles?.backgroundImage || ''}`.trim()
    const matched = raw.match(/^url\((['"]?)(.*)\1\)$/)
    return matched ? matched[2] : raw
  },
  set: (val: string) => {
    if (!currentBlock.value?.styles) {
      return
    }
    const next = (val || '').trim()
    currentBlock.value.styles.backgroundImage = next ? `url(${next})` : 'none'
  },
})

function openMorePanel() {
  controlStore.floatingSettingActiveTab = 'attr'
  controlStore.floatingSettingVisible = true
}

function openAnimatePanel() {
  controlStore.floatingSettingActiveTab = 'animate'
  controlStore.floatingSettingVisible = true
}
</script>

<template>
  <div
    v-if="currentBlock?._vid && componentItem"
    class="toolbar-wrapper" :class="[variant === 'dock' && 'toolbar-wrapper--dock']"
  >
    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      popper-class="toolbar-dropdown"
      :hide-on-click="false"
    >
      <el-button text :icon="Setting">
        <span>基础配置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-scrollbar class="toolbar-dropdown-scroll" max-height="420px">
          <el-dropdown-menu>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">组件名称</span>
                <div class="toolbar-item-content">
                  <el-input
                    v-model="currentBlock.label"
                    clearable
                    placeholder="请输入组件名称"
                    maxlength="32"
                  />
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">展示标题</span>
                <div class="toolbar-item-content">
                  <el-switch v-model="showTitle" />
                </div>
              </div>
            </el-dropdown-item>
            <TextStyleConfig
              v-if="showTitle"
              v-model="titleStyle"
              layout="dropdown"
              show-position
              show-background
              show-border-radius
              size="default"
              :teleported="false"
            />
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">宽度</span>
                <div class="toolbar-item-content">
                  <el-input-number v-model="gridWidth" :min="1" />
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">高度</span>
                <div class="toolbar-item-content">
                  <el-input-number v-model="gridHeight" :min="1" />
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">背景颜色</span>
                <div class="toolbar-item-content">
                  <el-color-picker v-model="currentBlock.styles.backgroundColor" />
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">背景图片</span>
                <div class="toolbar-item-content">
                  <ImageUpload v-model="bgImageUrl" />
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">图片重复</span>
                <div class="toolbar-item-content">
                  <el-select
                    v-model="currentBlock.styles.backgroundRepeat"
                    clearable
                    :teleported="false"
                  >
                    <el-option label="不重复" value="no-repeat" />
                    <el-option label="双向重复" value="repeat" />
                    <el-option label="水平重复" value="repeat-x" />
                    <el-option label="垂直重复" value="repeat-y" />
                  </el-select>
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">图片大小</span>
                <div class="toolbar-item-content">
                  <el-select
                    v-model="currentBlock.styles.backgroundSize"
                    clearable
                    :teleported="false"
                  >
                    <el-option label="覆盖" value="cover" />
                    <el-option label="完整显示" value="contain" />
                    <el-option label="拉伸铺满" value="100% 100%" />
                    <el-option label="原始尺寸" value="auto" />
                  </el-select>
                </div>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-scrollbar>
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />

    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      :hide-on-click="false"
      popper-class="toolbar-dropdown"
    >
      <el-button text :icon="Grid">
        <span>组件配置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-scrollbar class="toolbar-dropdown-scroll" max-height="420px">
          <el-dropdown-menu>
            <PropConfig :component="componentItem" :block="currentBlock" common-only />
          </el-dropdown-menu>
        </el-scrollbar>
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />

    <template v-if="isChartBlock">
      <el-button text :icon="Connection" @click="chartBindVisible = true">
        <span>数据配置</span>
      </el-button>
      <ChartDatasetBindDialog v-model="chartBindVisible" :block="currentBlock" />
      <el-divider direction="vertical" />
    </template>

    <el-dropdown
      v-if="currentBlock?.showStyleConfig"
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      :hide-on-click="false"
      popper-class="toolbar-dropdown"
    >
      <el-button text :icon="BrushFilled">
        <span>样式设置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-scrollbar class="toolbar-dropdown-scroll" max-height="420px">
          <el-dropdown-menu>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">水平对齐</span>
                <div class="toolbar-item-content">
                  <el-radio-group v-model="currentBlock.styles.justifyContent">
                    <el-radio-button value="flex-start">
                      左
                    </el-radio-button>
                    <el-radio-button value="center">
                      中
                    </el-radio-button>
                    <el-radio-button value="flex-end">
                      右
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">垂直对齐</span>
                <div class="toolbar-item-content">
                  <el-radio-group v-model="currentBlock.styles.alignItems">
                    <el-radio-button value="flex-start">
                      上
                    </el-radio-button>
                    <el-radio-button value="center">
                      中
                    </el-radio-button>
                    <el-radio-button value="flex-end">
                      下
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div class="toolbar-item-row">
                <span class="toolbar-item-title">组件内边距</span>
                <div class="toolbar-item-content">
                  <FormatInputNumber v-model="compPadding" />
                </div>
              </div>
            </el-dropdown-item>
            <BorderStyleConfig v-model="borderOverride" inheritable :teleported="false" />
          </el-dropdown-menu>
        </el-scrollbar>
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />

    <el-button text :icon="VideoPlay" @click="openAnimatePanel">
      <span>动画</span>
    </el-button>

    <el-divider direction="vertical" />
    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      :hide-on-click="false"
      popper-class="toolbar-dropdown toolbar-dropdown-panel"
    >
      <el-button text :icon="DataLine">
        <span>事件 </span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-scrollbar class="toolbar-panel-scroll" max-height="500px">
          <div class="toolbar-panel">
            <EventAction />
          </div>
        </el-scrollbar>
      </template>
    </el-dropdown>

    <el-divider direction="vertical" />
    <el-tooltip content="更多选项" placement="bottom">
      <el-button text :icon="MoreFilled" class="toolbar-more-btn" @click="openMorePanel" />
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  width: auto;
  padding: 6px 10px;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  display: flex;
  align-items: center;
  box-shadow: var(--el-box-shadow);
  gap: 2px;

  :deep(.el-button) {
    height: 30px;
    padding: 0 8px;
    border-radius: 6px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  :deep(.el-divider--vertical) {
    margin: 0 2px;
  }
}

.toolbar-item-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-item-content {
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-end;
  margin-left: 12px;
}

.toolbar-item-title {
  color: var(--el-text-color);
  /* font-size: 12px; */
  line-height: 1.2;
  flex-shrink: 0;
  min-width: 64px;
}

.toolbar-item-content :deep(.el-input),
.toolbar-item-content :deep(.el-input-number),
.toolbar-item-content :deep(.el-select),
.toolbar-item-content :deep(.el-color-picker),
.toolbar-item-content :deep(.formatInputNumber) {
  width: 100%;
}

.toolbar-more-btn {
  width: 30px;
  min-width: 30px;
  padding: 0 !important;
}

.toolbar-wrapper--dock {
  box-shadow: none;
  padding: 0;
  background: transparent;
  flex-wrap: nowrap;
  white-space: nowrap;
  align-items: center;
  height: 32px;

  :deep(.el-button) {
    height: 32px;
    padding: 0 8px;
  }

  :deep(.el-divider--vertical) {
    height: 18px;
    margin: 0 2px;
  }
}
</style>

<style>
.toolbar-dropdown {
  width: 320px !important;
  max-width: 320px !important;
  border-radius: 10px !important;
  border: 1px solid var(--el-border-color-light) !important;
  box-shadow: 0 10px 24px rgb(0 0 0 / 10%) !important;
  padding: 0 !important;
  overflow: hidden;

  .toolbar-dropdown-scroll {
    width: 320px;
  }

  .el-dropdown-menu {
    width: 320px;
    padding: 8px;
    background: var(--el-bg-color-overlay);

    .el-dropdown-menu__item {
      min-height: auto;
      margin-bottom: 6px;
      padding: 8px;
      border-radius: 8px;
      white-space: normal;
      line-height: 1.4;
      color: inherit;
      background: var(--el-fill-color-blank);

      &:last-child {
        margin-bottom: 0;
      }

      &:hover,
      &:focus {
        background: var(--el-fill-color-light);
      }
    }

    .el-form-item {
      width: 100%;
      margin-bottom: 0;
    }

    .el-input-number,
    .el-input,
    .el-select,
    .el-cascader {
      width: 100%;
    }

    .el-input-number {
      .el-input__inner {
        text-align: left;
      }
    }
  }

  .toolbar-item-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between !important;
  }

  .toolbar-item-title {
    color: var(--el-text-color);
    line-height: 1.2;
    flex-shrink: 0;
    min-width: 64px;
  }

  .toolbar-item-content {
    flex: 1;
    width: 0;
    display: flex;
    justify-content: flex-end !important;
    align-items: center;
    margin-left: 12px !important;
  }

  .toolbar-item-content .el-input,
  .toolbar-item-content .el-input-number,
  .toolbar-item-content .el-select,
  .toolbar-item-content .el-color-picker,
  .toolbar-item-content .formatInputNumber {
    width: 100%;
  }

  .toolbar-item-content > * {
    margin-left: auto;
    max-width: 100%;
  }

  .toolbar-item-content .el-switch,
  .toolbar-item-content .el-radio-group,
  .toolbar-item-content .el-checkbox-group,
  .toolbar-item-content .el-button-group,
  .toolbar-item-content .el-button {
    margin-left: auto;
  }

  .toolbar-item-row--stack {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-options-item .toolbar-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }

  .toolbar-item-content--full {
    width: 100%;
    margin-left: 0 !important;
    justify-content: flex-start !important;
  }

  .toolbar-item-content--full > * {
    margin-left: 0 !important;
    max-width: 100%;
  }

  .toolbar-options-item .toolbar-item-title {
    min-width: auto;
  }
}

.toolbar-dropdown-panel {
  padding: 6px !important;
  border: 0 !important;
  border-radius: 12px !important;
}
</style>

<style scoped>
.toolbar-panel {
  width: 320px;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
}

.toolbar-panel-scroll {
  width: 320px;
}

.toolbar-panel :deep(.el-card) {
  border-radius: 8px;
}

.toolbar-panel :deep(.el-alert) {
  border-radius: 8px;
}

.toolbar-panel :deep(.el-button) {
  border-radius: 8px;
}
</style>
