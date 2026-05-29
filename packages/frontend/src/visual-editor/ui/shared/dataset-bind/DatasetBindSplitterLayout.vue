<script setup lang="ts">
/**
 * 数据集绑定弹窗：横向三栏（字段 | 配置 | 预览）
 */
</script>

<template>
  <el-splitter class="bind-split-layout">
    <el-splitter-panel size="24%" :min="220" :max="360">
      <div class="bind-split-layout__pane bind-split-layout__pane--aside">
        <slot name="aside" />
      </div>
    </el-splitter-panel>
    <el-splitter-panel size="42%" :min="300">
      <div class="bind-split-layout__pane bind-split-layout__pane--config">
        <slot name="config" />
      </div>
    </el-splitter-panel>
    <el-splitter-panel :min="280">
      <div class="bind-split-layout__pane bind-split-layout__pane--preview">
        <slot name="preview" />
      </div>
    </el-splitter-panel>
  </el-splitter>
</template>

<style scoped>
.bind-split-layout {
  --bind-bg: #f7f8fa;
  flex: 1;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.bind-split-layout__pane {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bind-split-layout__pane--aside {
  background: var(--bind-bg);
}

.bind-split-layout__pane--config {
  background: #fff;
  overflow-y: auto;
}

.bind-split-layout__pane--preview {
  background: #fff;
}

.bind-split-layout :deep(.el-splitter-panel) {
  overflow: hidden;
}

.bind-split-layout :deep(.el-splitter-panel__body) {
  height: 100%;
  overflow: hidden;
}

.bind-split-layout :deep(.el-splitter__wrapper) {
  height: 100%;
}
</style>
