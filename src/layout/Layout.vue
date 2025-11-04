<script lang="ts" setup>
import { ref } from 'vue'

import DesignHeader from '@/components/Header/index.vue'
import Sidebar from '@/components/Sidebar/index.vue'
import TabBar from '@/components/TabBar/index.vue'

// 获取全局对象
// const global = inject('global')

const isCollapse = ref(false)

function arrowSide(isClose: boolean) {
  isCollapse.value = isClose
}
</script>

<template>
  <div class="component-box">
    <el-container>
      <el-aside :style="{ width: !isCollapse ? '200px' : '70px' }">
        <suspense>
          <Sidebar @arrow="arrowSide" />
        </suspense>
      </el-aside>
      <el-container>
        <el-header style="padding: 0">
          <DesignHeader />
        </el-header>
        <div class="tabBar">
          <TabBar />
        </div>
        <el-main style="padding: 0; height: calc(100% - 100px);">
          <suspense>
            <router-view />
          </suspense>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss">
.component-box {
  display: flex;
  height: 100%;

  .el-aside {
    transition: width .5s;
  }

  .tabBar {
    height: 40px;
    width:100%;
    background-color: #FFFFFF;
    border-bottom: 1px solid #dddfe5;
  }
}
</style>
