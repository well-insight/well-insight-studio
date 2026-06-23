<script setup lang="ts">
import { CaretBottom, Connection, DataLine, Grid, MoreFilled, VideoPlay } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { isChartComponent } from '@/utils/datasetBinding'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import ChartDatasetBindDialog from '@/visual-editor/ui/shared/dataset-bind/ChartDatasetBindDialog.vue'
import { CollapsibleCard, PopoverPanel } from '@/visual-editor/ui/shared/popover-panel'
import { PropConfig } from '@/visual-editor/ui/workbench/right-attribute-panel/components/attr-editor/components/prop-config'
import BasicConfigDropdown from './components/BasicConfigDropdown.vue'

const props = withDefaults(
  defineProps<{
    /** default: 自由布局浮层；dock: 网格编辑器顶部上下文栏 */
    variant?: 'default' | 'dock'
  }>(),
  { variant: 'default' },
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

function openMorePanel() {
  controlStore.floatingSettingActiveTab = 'attr'
  controlStore.floatingSettingVisible = true
}

function openAnimatePanel() {
  controlStore.floatingSettingActiveTab = 'animate'
  controlStore.floatingSettingVisible = true
}

function openEventPanel() {
  controlStore.floatingSettingActiveTab = 'event'
  controlStore.floatingSettingVisible = true
}
</script>

<template>
  <div
    v-if="currentBlock?._vid && componentItem"
    class="toolbar-wrapper" :class="[variant === 'dock' && 'toolbar-wrapper--dock']"
  >
    <BasicConfigDropdown :block="currentBlock" />

    <el-divider direction="vertical" />

    <PopoverPanel title="组件配置">
      <template #trigger>
        <el-button text :icon="Grid">
          <span>组件配置</span>
          <el-icon><CaretBottom /></el-icon>
        </el-button>
      </template>
      <CollapsibleCard title="组件配置" :default-open="true">
        <PropConfig :component="componentItem" :block="currentBlock" />
      </CollapsibleCard>
    </PopoverPanel>

    <el-divider direction="vertical" />

    <template v-if="isChartBlock">
      <el-button text :icon="Connection" @click="chartBindVisible = true">
        <span>数据配置</span>
      </el-button>
      <ChartDatasetBindDialog v-model="chartBindVisible" :block="currentBlock" />
      <el-divider direction="vertical" />
    </template>

    <el-button text :icon="VideoPlay" @click="openAnimatePanel">
      <span>动画</span>
    </el-button>

    <el-divider direction="vertical" />

    <el-button text :icon="DataLine" @click="openEventPanel">
      <span>事件</span>
    </el-button>

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

.toolbar-wrapper--dock {
  box-shadow: none;
  padding: 0;
  background: transparent;
  flex-wrap: nowrap;
  white-space: nowrap;
  align-items: center;
  height: 32px;
}
</style>
