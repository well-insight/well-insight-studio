<script lang="ts" setup>
import { Lock, View } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useDesignStore } from '@/stores/design'

const designStore = useDesignStore()

const { componentsInCanvas } = storeToRefs(designStore)

// 获取当前展示在 画布中的组件列表
const layerList = computed(() => {
  return componentsInCanvas.value
})

// 当前选中组件
const curComponentIndex = computed(() => designStore.$state.curComponentIndex)

function selectLayer(index: number) {
  designStore.$patch({
    curComponentIndex: index,
  })
}
</script>

<template>
  <div class="layer-control-container w-full h-full">
    <el-empty v-if="!layerList.length" description="请先选择组件" />
    <el-scrollbar v-else view-style="padding: 1rem">
      <div
        v-for="(item, index) in layerList" :key="item.title || `${index}`"
        :class="curComponentIndex === index ? 'is-active' : ''"
        class=" w-full flex items-center justify-between p-4 layer-item mb-4" @click="selectLayer(index)"
      >
        <el-space>
          <svg-icon name="component" />
          <span class="title">{{ item.title }}</span>
        </el-space>

        <el-space>
          <el-icon><Lock /></el-icon>
          <el-icon><View /></el-icon>
        </el-space>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.layer-control-container {
  .layer-item {
    border: var(--el-border);
    border-radius: var(--el-border-radius-base);
    cursor: pointer;

    &:hover {
      background-color: #f4f4f4;
      // border: 1px solid var(--el-color-primary);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);

      :deep(.svg-icon) {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
