<template>
  <div class="toolbar-wrapper">
    <div class="toolbar-inner-item">
      <el-icon><Crop /></el-icon>
      <span>基础配置</span>
      <el-icon><CaretBottom /></el-icon>
    </div>
    <el-divider direction="vertical"></el-divider>
    <div class="toolbar-inner-item"></div>
  </div>
</template>

<script setup lang="ts">
import { Crop, CaretBottom } from "@element-plus/icons-vue";
import { ref } from "vue";

import type { PopoverInstance } from "element-plus";

const props = withDefaults(defineProps<{ virualRef: any }>(), {
  virualRef: null,
});

const popoverInstance = ref<PopoverInstance>();

defineExpose({
  popoverInstance,
});
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  width: auto;
  padding: 8px 4px;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  display: flex;
  align-items: center;
  box-shadow: var(--el-box-shadow);
}

.toolbar-inner-item {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 32px;
  height: 32px;
}
</style>
