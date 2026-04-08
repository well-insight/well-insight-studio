<script lang="ts" setup>
import { PageTree } from '@/visual-editor/components/left-aside/components/page-tree'
import ScreenList from '@/visual-editor/components/left-aside/components/screen-list/index.vue'
</script>

<template>
  <div class="w-full h-full flex flex-col border-end-1">
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
