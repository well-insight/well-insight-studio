<script lang="tsx" setup>
import { Plus } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { EditTools } from '../edit-tools'
import MobileWrapper from './MobileWrapper.vue'
import PcWrapper from './PcWrapper.vue'

defineOptions({
  name: 'SimulatorEditor'
})

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const controlStore = useControlStore()

const { editScale } = storeToRefs(controlStore)

const scaleValue = computed({
  get() {
    return editScale.value * 100
  },
  set(v: number) {
    editScale.value = v / 100
  }
})

function changeScale(s: number) {
  editScale.value = s
}

function triggerShowComponents() {
  controlStore.customComponentsVisible = !controlStore.customComponentsVisible
}
</script>

<template>
  <div class="simulator-container">
    <div class="h-[50px] w-full">
      <EditTools />
    </div>

    <div class="simulator-editor">
      <MobileWrapper v-if="currentApp?.clientType === 2" />
      <PcWrapper v-else :scale="editScale" @change-scale="changeScale" />
    </div>

    <!-- 添加按钮 -->
    <el-button
      class="absolute right-6 bottom-[75px] h-[60px]! w-[60px]!"
      type="primary"
      circle
      @click="triggerShowComponents"
    >
      <el-icon size="30px">
        <Plus />
      </el-icon>
    </el-button>

    <!-- 底部控制栏 -->
    <div class="h-[50px] w-full flex items-center justify-end px-4">
      <el-space>
        <el-slider v-model="scaleValue" :min="10" class="w-[300px]" show-input />
      </el-space>
    </div>
  </div>
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

<style lang="scss" scoped>
@import './func.scss';

.simulator-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
}

.simulator-editor {
  width: 100%;
  overflow: hidden auto;
  background: #fafafa;
  border-radius: 5px;
  box-sizing: border-box;
  background-clip: content-box;
  contain: layout;
  flex: 1;
  height: 0;
  display: flex;
  justify-content: center;
  // padding: 32px 0 0 0;

  &::-webkit-scrollbar {
    width: 0;
  }

  .simulator-editor-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  &-content {
    background-color: var(--el-bg-color);
    // transform: translate(0);
    box-shadow: 0 8px 12px #ebedf0;
    margin-top: 32px;
    border-radius: var(--el-border-radius-base);
    position: absolute;
    top: 50%;
    left: 50%;
    // transform: translate(-50%, -50%);
  }
}

.list-group-item {
  position: relative;
  // padding: 3px;
  border: 2px solid var(--el-bg-color);
  cursor: move;

  > div {
    position: relative;
  }

  &.focus {
    @include showComponentBorder;
  }

  &.drag::after {
    display: none;
  }

  &:not(.has-slot) {
    content: '';
  }

  &.focusWithChild {
    @include showContainerBorder;
  }

  i {
    cursor: pointer;
  }

  &:hover {
    // 边框
    @include showComponentBorder;

    &::after {
      // 标签
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(left);
    }
  }
}
</style>
