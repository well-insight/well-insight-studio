<template>
  <div class="toolbar-wrapper">
    <el-dropdown
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      transition="el-zoom-in-top"
      popper-class="toolbar-dropdown"
      :hide-on-click="false"
    >
      <el-button text :icon="Crop">
        <span>基础配置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>
            <div class="flex w-full items-center justify-between">
              <span>宽度</span>
              <el-input-number size="small" v-model="currentBlock.width" />
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="flex w-full items-center justify-between">
              <span>高度</span>
              <el-input-number size="small" v-model="currentBlock.height" />
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
      <el-button text :icon="Crop">
        <span>组件配置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="w-[200px]">
          <PropConfig :component="componentItem" :block="currentBlock" />
          <!-- <el-dropdown-item>
            <div class="flex w-full items-center justify-between">
              <span>高度</span>
              <el-input-number size="small" v-model="currentBlock.height" />
            </div>
          </el-dropdown-item> -->
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-divider direction="vertical"></el-divider>

    <div class="toolbar-inner-item">
      <el-icon><Crop /></el-icon>
      <span>样式设置</span>
      <el-icon><CaretBottom /></el-icon>
    </div>

    <el-divider direction="vertical"></el-divider>
    <div class="toolbar-inner-item">
      <el-icon><Crop /></el-icon>
      <span>动画</span>
      <el-icon><CaretBottom /></el-icon>
    </div>

    <el-divider direction="vertical"></el-divider>
    <div class="toolbar-inner-item">
      <el-icon><Crop /></el-icon>
      <span>数据配置 </span>
      <el-icon><CaretBottom /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVisualData } from "@/visual-editor/hooks/useVisualData";
import { CaretBottom, Crop } from "@element-plus/icons-vue";
import { PropConfig } from "../right-attribute-panel/components/attr-editor/components/prop-config/prop-config-dropdown";

const props = withDefaults(defineProps<{ virualRef: any }>(), {
  virualRef: null,
});

const { visualConfig, currentBlock } = useVisualData();

const { componentKey } = currentBlock.value;
const componentItem = visualConfig.componentMap[componentKey];
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  width: auto;
  padding: 8px;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  display: flex;
  align-items: center;
  box-shadow: var(--el-box-shadow);

  :deep(.el-button) {
    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.toolbar-inner-item {
  white-space: nowrap;
  gap: 4px;
  line-height: 32px;
  height: 32px;
}
</style>

<style>
.toolbar-dropdown {
  .el-dropdown-menu {
    width: 200px;
    max-height: 300px;
    padding: 6px;
    
    .el-dropdown-menu__item {
      padding: 6px;
      border-radius: var(--el-border-radius-base);
    }
  }
}
</style>
