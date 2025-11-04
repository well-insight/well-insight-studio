<script lang="ts" setup>
import type { Compnents } from '@/type'
import { computed, reactive, watch } from 'vue'
import { useDesignStore } from '@/stores/design'

const emits = defineEmits(['shrink'])
const store = useDesignStore()
// layer 组件数据集合
const layerControlData = reactive<{ layerList: Compnents[] }>({
  layerList: [],
})

// 获取当前展示在 画布中的组件列表
const layerList = computed(() => store.$state.componentsInCanvas)

// 当前选中组件
const curComponentIndex = computed(() => store.$state.curComponentIndex)

watch(layerList, (n, o) => {
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

function shrink() {
  emits('shrink', true)
}
</script>

<template>
  <div class="layer-control-container">
    <div class="top">
      <span class="left-box">
        图层
        <svg-icon name="layer" />
      </span>
      <span class="right-box">
        <el-button-group size="small">
          <el-tooltip effect="dark" placement="top" content="缩略图">
            <el-button type="" plain>
              <template #icon>
                <svg-icon name="缩略图" />
              </template>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" placement="top" content="文本列">
            <el-button type="" plain>
              <template #icon>
                <svg-icon name="列表1" />
              </template>
            </el-button>
          </el-tooltip>
        </el-button-group>
        <svg-icon class="prev" title="收起" size="1.1em" name="pre" @click="shrink" />
      </span>
    </div>
    <div class="content">
      <ul>
        <li v-for="(item, index) in layerList" :key="item.title || `${index}`" :class="curComponentIndex === index ? 'active' : ''" @click="selectLayer(index)">
          <svg-icon :name="item.icon" class="img" />
          <span class="title">{{ item.title }}</span>
          <span class="control">
            <svg-icon class="lock" name="unlock" />
            <svg-icon class="show" name="show" />
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped src='./index.scss' lang="scss"></style>
