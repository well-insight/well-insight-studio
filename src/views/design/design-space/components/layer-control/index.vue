<script lang="ts" setup>
import type { Compnents } from '@/type'
import { computed, reactive, watch } from 'vue'
import { useDesignStore } from '@/stores/design'

const store = useDesignStore()
// layer 组件数据集合
const layerControlData = reactive<{ layerList: Compnents[] }>({
  layerList: [],
})

// 获取当前展示在 画布中的组件列表
const layerList = computed(() => store.$state.componentsInCanvas)

// 当前选中组件
const curComponentIndex = computed(() => store.$state.curComponentIndex)

watch(layerList, (n) => {
  layerControlData.layerList = (n || []).map((o: Compnents) => {
    o.ifLock = o.ifLock ? o.ifLock : false
    o.ifShow = o.ifShow ? o.ifShow : true
    return o
  })
})

function selectLayer(index: number) {
  store.$patch({
    curComponentIndex: index,
  })
}
</script>

<template>
  <div class="layer-control-container w-full h-full">
    <div
      v-for="(item, index) in layerList"
      :key="item.title || `${index}`"
      :class="curComponentIndex === index ? 'active' : ''"
      class="h-[40px] w-full"
      @click="selectLayer(index)"
    >
      <svg-icon :name="item.icon" class="img" />
      <span class="title">{{ item.title }}</span>
      <span class="control">
        <svg-icon class="lock" name="unlock" />
        <svg-icon class="show" name="show" />
      </span>
    </div>
  </div>
</template>
