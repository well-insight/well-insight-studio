<template>
  <div v-if="currentBlock?._vid && componentItem" class="toolbar-wrapper">
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
        <el-dropdown-menu>
          <el-dropdown-item>
            <div class="flex w-full items-center justify-between">
              <span>宽度</span>
              <el-input-number size="small" :min="0" v-model="currentBlock.width" />
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="flex w-full items-center justify-between">
              <span>高度</span>
              <el-input-number size="small" :min="0" v-model="currentBlock.height" />
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>

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
        <el-dropdown-menu class="w-[280px]">
          <PropConfig :component="componentItem" :block="currentBlock" />
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>

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
        <el-dropdown-menu class="w-[280px]">
          <el-dropdown-item>
            <div class="toolbar-item-column">
              <span class="toolbar-item-title">水平对齐</span>
              <el-radio-group v-model="currentBlock.styles.justifyContent" size="small">
                <el-radio-button label="flex-start">左</el-radio-button>
                <el-radio-button label="center">中</el-radio-button>
                <el-radio-button label="flex-end">右</el-radio-button>
              </el-radio-group>
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="toolbar-item-column">
              <span class="toolbar-item-title">垂直对齐</span>
              <el-radio-group v-model="currentBlock.styles.alignItems" size="small">
                <el-radio-button label="flex-start">上</el-radio-button>
                <el-radio-button label="center">中</el-radio-button>
                <el-radio-button label="flex-end">下</el-radio-button>
              </el-radio-group>
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="toolbar-item-column">
              <span class="toolbar-item-title">组件内边距</span>
              <FormatInputNumber v-model="compPadding" />
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>

    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      :hide-on-click="false"
      popper-class="toolbar-dropdown toolbar-dropdown-panel"
    >
      <el-button text :icon="VideoPlay">
        <span>动画</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <div class="toolbar-panel">
          <Animate />
        </div>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>
    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      :hide-on-click="false"
      popper-class="toolbar-dropdown toolbar-dropdown-panel"
    >
      <el-button text :icon="DataLine">
        <span>数据配置 </span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <div class="toolbar-panel">
          <EventAction />
        </div>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>
    <el-tooltip content="更多选项" placement="bottom">
      <el-button text :icon="MoreFilled" class="toolbar-more-btn" @click="openMorePanel" />
    </el-tooltip>
  </div>
 </template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useVisualData } from "@/visual-editor/hooks/useVisualData";
import { FormatInputNumber } from "@/visual-editor/ui/common/format-input-number";
import { Animate, EventAction } from "@/visual-editor/ui/right-attribute-panel/components";
import { useControlStore } from "@/stores/controlStore";
import {
  BrushFilled,
  CaretBottom,
  DataLine,
  Grid,
  MoreFilled,
  Setting,
  VideoPlay,
} from "@element-plus/icons-vue";
import { PropConfig } from "../right-attribute-panel/components/attr-editor/components/prop-config/prop-config-dropdown";

const props = withDefaults(defineProps<{ virualRef: any }>(), {
  virualRef: null,
});

const controlStore = useControlStore();
const { visualConfig, currentBlock } = useVisualData();

const componentItem = computed(() => {
  const componentKey = currentBlock.value?.componentKey;
  return componentKey ? visualConfig.componentMap[componentKey] : null;
});

const compPaddingAttrs = ["paddingTop", "paddingLeft", "paddingRight", "paddingBottom"];

watch(
  () => compPaddingAttrs.map((item) => currentBlock.value?.styles?.[item]),
  (val: string[]) => {
    if (!currentBlock.value?.styles) {
      return;
    }
    const isSame = val.every((item) => currentBlock.value.styles?.tempPadding === item);
    if (isSame || new Set(val).size === 1) {
      currentBlock.value.styles.tempPadding = val[0];
    } else {
      currentBlock.value.styles.tempPadding = "";
    }
  },
  { immediate: true }
);

const compPadding = computed({
  get: () => currentBlock.value?.styles?.tempPadding,
  set(val) {
    if (!currentBlock.value?.styles) {
      return;
    }
    compPaddingAttrs.forEach((item) => {
      currentBlock.value.styles[item] = val;
    });
    currentBlock.value.styles.tempPadding = val;
  },
});

function openMorePanel() {
  controlStore.floatingSettingVisible = true;
}
</script>

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

.toolbar-item-column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.toolbar-item-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1;
}

.toolbar-more-btn {
  width: 30px;
  min-width: 30px;
  padding: 0 !important;
}
</style>

<style>
.toolbar-dropdown {
  border-radius: 10px !important;
  border: 1px solid var(--el-border-color-light) !important;
  box-shadow: 0 10px 24px rgb(0 0 0 / 10%) !important;
  padding: 0 !important;
  overflow: hidden;

  .el-dropdown-menu {
    width: 280px;
    max-height: 420px;
    padding: 8px;
    overflow: auto;
    background: var(--el-bg-color-overlay);
    scrollbar-width: thin;
    
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
}

.toolbar-dropdown-panel {
  padding: 6px !important;
  border: 0 !important;
  border-radius: 12px !important;
}
</style>

<style scoped>
.toolbar-panel {
  width: 460px;
  max-height: 500px;
  overflow: auto;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  scrollbar-width: thin;
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
