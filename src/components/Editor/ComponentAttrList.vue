<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import customComponents from '@/custom-components'
import { useDesignStore } from '@/stores/design'
import AeerListRender from './AttrListRender.vue'

const designStore = useDesignStore()

const { currentComponentConfig } = storeToRefs(designStore)

const configs = computed(() => {
  return addParamsToData(customComponents.find(e => e?.name === currentComponentConfig.value?.component)?.config || []) || []
})

// 递归添加 level 属性的函数
function addParamsToData(data: any, currentLevel = 1, key = '') {
  return data.map((item: any) => {
    // 复制原对象并添加 level
    const path = key ? `${key}.${item.value}` : item?.value
    const newItem = { ...item, level: currentLevel, path }
    // 如果有 children，递归处理子层级
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      newItem.children = addParamsToData(item.children, currentLevel + 1, item.value)
    }
    return newItem
  })
}
</script>

<template>
  <div class="component-attr-list-container flex flex-col gap-4">
    <div class="title">
      <span>组件配置</span>
      <svg-icon name="预览" />
    </div>
    <el-tabs type="border-card" class="w-full h-full" stretch>
      <el-tab-pane label="基础">
        <AeerListRender :configs="configs" collapse-all />
      </el-tab-pane>
      <el-tab-pane label="动画">
        Config
      </el-tab-pane>
      <el-tab-pane label="数据">
        Role
      </el-tab-pane>
      <el-tab-pane label="事件">
        Task
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.component-attr-list-container {
  width: 100%;
  height: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  // overflow-y: scroll;

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    height: 35px;
    flex-shrink: 0;
    width: 100%;
    border-radius: 6px;
    background-color: #fff;
    cursor: pointer;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 8%);

    span {
      margin-right: 5px;
    }
  }

}
</style>
