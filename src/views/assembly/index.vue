<script setup lang="ts">
import type { assemblyType } from '@/type'
import { computed, ref } from 'vue'
import { getAssemblyLists } from '@/api'
import { Icons } from './components'

const assemblyList = ref<assemblyType[]>([])

const current = ref('icon')

const assemblyListShow = computed(() => {
  return assemblyList.value?.map((e) => {
    return {
      ...e,
      label: e?.title,
    }
  })
})

function getList() {
  getAssemblyLists().then((res) => {
    if (res) {
      assemblyList.value = res || []
    }
  })
}

const detailBoxVisible = ref<boolean>(false)
function showAssemblyDetail(item: assemblyType, e: any) {
  detailBoxVisible.value = true
}

getList()
</script>

<template>
  <div class="w-full h-full p-4">
    <el-card shadow="never" class="w-full h-full full-card">
      <!-- 组件：组件包含内置的组件，外部也可以自己上传组件，然后预览介绍，详情接口入参配置等。 -->
      <el-container class="w-full h-full">
        <el-aside width="200px" class="h-full mr-6">
          <div class="w-full h-full left-menu">
            <el-tree
              :data="assemblyListShow"
              highlight-current
              node-key="id"
              current-node-key="icon"
            />
          </div>
        </el-aside>
        <el-main class="assembly-main">
          <template v-if="current === 'icon'">
            <Icons />
          </template>
        </el-main>
      </el-container>
    </el-card>

    <!-- 组件详情 -->
    <el-card v-show="detailBoxVisible" class="show-assembly-box">
      <h1 @click="detailBoxVisible = false">
        退出
      </h1>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.full-card {

  :deep(.el-card__body) {
    height: 100%;
    width: 100%;
  }
}

.left-menu {
  border: var(--el-border);
  border-radius: var(--el-border-radius-base);
  // padding: 20px;
}

.assembly-main {
  border: var(--el-border);
  border-radius: var(--el-border-radius-base);
}
</style>
