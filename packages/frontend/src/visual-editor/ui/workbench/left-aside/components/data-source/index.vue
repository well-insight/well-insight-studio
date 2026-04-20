<script setup lang="tsx" name="基本组件">
import { DataBoard } from '@element-plus/icons-vue'
import DataFetch from './data-fetch.vue'
import DataModel from './data-model.vue'

defineOptions({
  label: '数据源',
  order: 2,
  icon: DataBoard
})
</script>

<template>
  <el-tabs type="border-card" stretch class="data-source">
    <el-tab-pane label="数据模型" lazy>
      <DataModel />
    </el-tab-pane>
    <el-tab-pane label="数据接口" lazy>
      <DataFetch />
    </el-tab-pane>
  </el-tabs>
</template>

<style lang="scss" scoped>
.data-source :deep {
  .el-tabs__header {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .el-tabs__content {
    contain: layout;
    content-visibility: auto;
  }
}
</style>
