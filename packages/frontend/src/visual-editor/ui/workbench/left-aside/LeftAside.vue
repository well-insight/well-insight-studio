<script lang="ts" setup>
import { PageTree } from '@/visual-editor/ui/workbench/left-aside/components/page-tree'
import ScreenList from '@/visual-editor/ui/workbench/left-aside/components/screen-list/index.vue'
import '@/visual-editor/styles/visual-editor.scss'
</script>

<template>
  <div class="visual-editor flex h-full w-full flex-col border-end-1 bg-[var(--el-bg-color)]">
    <el-splitter layout="vertical">
      <el-splitter-panel size="35%">
        <ScreenList />
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <PageTree />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style lang="scss" module></style>
