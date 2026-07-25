<script lang="ts" setup>
import { PageTree } from '@/visual-editor/ui/workbench/left-aside/components/page-tree'
import ScreenList from '@/visual-editor/ui/workbench/left-aside/components/screen-list/index.vue'
import '@/visual-editor/styles/visual-editor.scss'
</script>

<template>
  <div class="visual-editor left-aside-panel">
    <el-splitter layout="vertical" class="left-aside-panel__splitter">
      <el-splitter-panel size="35%">
        <section class="left-aside-panel__section left-aside-panel__section--screens">
          <ScreenList />
        </section>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <section class="left-aside-panel__section">
          <PageTree />
        </section>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style lang="scss" scoped>
.left-aside-panel {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 251, 255, 0.86)), var(--el-bg-color);
}

.left-aside-panel__splitter {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.left-aside-panel__section {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-lighter));
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
}

.left-aside-panel__section--screens {
  margin-bottom: 8px;
}

:deep(.el-splitter-panel) {
  min-height: 0;
}

:deep(.el-splitter-bar) {
  margin: 6px 0;
}

:global(html.dark) .left-aside-panel {
  background: linear-gradient(180deg, rgba(13, 40, 64, 0.88), rgba(8, 28, 48, 0.84)), var(--el-bg-color);
}

:global(html.dark) .left-aside-panel__section {
  background: rgba(13, 40, 64, 0.72);
}
</style>
