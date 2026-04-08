<script lang="ts" setup>
import {
  Iphone,
  Menu,
  Monitor,
  Orange,
  RefreshLeft,
  RefreshRight,
  ScaleToOriginal,
  Setting,
  VideoPlay,
  WarnTriangleFilled
} from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import Preview from './components/Preview.vue'

// store
const workspaceStore = useWorkspaceStore()
const controlStore = useControlStore()
const { currentApp } = storeToRefs(workspaceStore)
const {} = storeToRefs(controlStore)

const previewVisible = ref(false)

const value1 = ref(false)

function triggerClient() {
  currentApp.value.clientType = currentApp.value.clientType === 1 ? 2 : 1
}

function previewPage() {
  previewVisible.value = true
}
</script>

<template>
  <div class="h-full w-full overflow-hidden border-bottom-1 flex items-center px-4 justify-between">
    <div class="h-full flex items-center" />

    <div class="h-full flex items-center">
      <el-button text :icon="RefreshLeft" />
      <el-button text :icon="RefreshRight" />
      <el-divider direction="vertical" />
      <el-button v-if="currentApp?.clientType === 2" text :icon="Iphone" @click="triggerClient" />
      <el-button v-if="currentApp?.clientType === 1" text :icon="Monitor" @click="triggerClient" />
      <el-button text :icon="Orange" />
      <el-button text :icon="WarnTriangleFilled" />
      <el-divider direction="vertical" />
      <el-button text :icon="VideoPlay" @click="previewPage"> 预览 </el-button>
      <el-divider direction="vertical" />
      <el-space>
        <el-button text>
          <span class="mr-2" :class="[$style.status, $style.enable]" />
          <el-text>激活</el-text>
        </el-button>
        <el-switch v-model="value1" />
      </el-space>
    </div>
  </div>

  <Preview v-model="previewVisible" :device="currentApp?.clientType === 1 ? 'pc' : 'mobile'" />
</template>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>
