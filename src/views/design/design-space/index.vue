<script lang="ts" setup>
import { ref } from 'vue'
// import { useRouter } from 'vue-router'
import { useDesignStore } from '@/stores/design'
import { setItem } from '@/utils'
import BaseControl from './components/base-control/index.vue'
import EditControl from './components/edit-control/index.vue'
import LayerControl from './components/layer-control/index.vue'
import SideSettingControl from './components/side-setting-control/index.vue'

// const router = useRouter()
const store = useDesignStore()

const ifShowEditInput = ref(false)
const webName = ref('项目一')
const webNameRef = ref(null)
function editName(e: any) {
  if (ifShowEditInput.value && e.target.dataset.type && e.target.dataset.type === 'input') {
    return
  }
  ifShowEditInput.value = !ifShowEditInput.value;
  (webNameRef.value as any).focus()
}

const showChart = ref(true)
const showLayer = ref(false)
const showSide = ref(false)
function layerShrink() {
  showLayer.value = false
}

function showConfig(show: string, event: any) {
  switch (show) {
    case 'chart':
      showChart.value = !showChart.value
      break
    case 'layer':
      showLayer.value = !showLayer.value
      break
    case 'side':
      showSide.value = !showSide.value
      break
  }
  let target = event.target
  while (target.nodeName !== 'BUTTON') {
    target = target.parentNode
  }
  target.blur()
}

// 预览
function goPreview() {
  setItem('componentsInCanvas', store.$state.componentsInCanvas)
  setItem('pageConfig', store.$state.pageConfig)
  window.open('http://localhost:8999/#/preview', '_blank')
}
</script>

<template>
  <div class="designSpace-container">
    <!-- 头部控制 -->
    <div class="header">
      <div class="left-box">
        <span class="logo-box">
          <svg-icon class="logo" name="lightning" width="30px" height="30px" color="var(--el-color-primary)" />
        </span>
        <div class="btn-box">
          <el-tooltip
            effect="dark"
            content="图表组件"
            placement="bottom"
          >
            <el-button :plain="!showChart" type="primary" @click="showConfig('chart', $event)">
              <template #icon>
                <svg-icon name="chart" size="2em" color="" />
              </template>
            </el-button>
          </el-tooltip>
          <el-tooltip
            effect="dark"
            content="图层控制"
            placement="bottom"
          >
            <el-button :plain="!showLayer" type="primary" @click="showConfig('layer', $event)">
              <template #icon>
                <svg-icon name="layer" color="" />
              </template>
            </el-button>
          </el-tooltip>

          <el-tooltip
            effect="dark"
            content="详情设置"
            placement="bottom"
          >
            <el-button :plain="!showSide" type="primary" @click="showConfig('side', $event)">
              <template #icon>
                <svg-icon name="sideSetting" color="" />
              </template>
            </el-button>
          </el-tooltip>

          <div class="line" />
          <el-button plain disabled type="">
            <template #icon>
              <svg-icon name="pre" color="" />
            </template>
          </el-button>
          <el-button plain disabled type="">
            <template #icon>
              <svg-icon name="next" color="" />
            </template>
          </el-button>
        </div>
      </div>
      <div class="center-box">
        <div style="display: flex;align-items: center" @click="editName">
          <el-text v-show="!ifShowEditInput">
            {{ webName }}
          </el-text>
          <el-input v-show="ifShowEditInput" ref="webNameRef" v-model="webName" maxlength="20" show-word-limit data-type="input" type="text" />
        </div>
      </div>
      <div class="right-box">
        <el-button type="" size="large" @click="goPreview">
          <svg-icon name="预览" color="" size="1.2em" />
          预览
        </el-button>
        <el-button type="" size="large">
          <svg-icon name="发布" color="" size="1.2em" />
          发布
        </el-button>
      </div>
    </div>
    <!-- 内容显示 -->
    <div class="content">
      <!-- 组件图层展示区域 -->
      <div class="component-control" :class="showChart ? '' : 'shrink'">
        <BaseControl :shrink-component="showChart" />
      </div>
      <div class="layer-control" :class="!showLayer ? 'hideLayer' : ''">
        <LayerControl @shrink="layerShrink" />
      </div>
      <div class="edit-control">
        <EditControl />
      </div>
      <div class="side-setting-control" :class="!showSide ? 'hideSideSetting' : ''">
        <SideSettingControl />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src='./index.scss'></style>

<style lang="scss">

</style>
