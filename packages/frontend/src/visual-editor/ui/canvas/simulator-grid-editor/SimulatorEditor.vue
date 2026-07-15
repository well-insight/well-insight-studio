<script lang="tsx" setup>
import { CloseBold } from '@element-plus/icons-vue'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onUnmounted, ref, useTemplateRef } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { EditTools } from '@/visual-editor/ui/workbench/edit-tools'
import RightAttributePanel from '@/visual-editor/ui/workbench/right-attribute-panel/RightAttributePanel.vue'
import '@/visual-editor/styles/visual-editor.scss'
import { ComponentList } from '../../workbench/component-list-new'
import BlockSettingsBar from './BlockSettingsBar.vue'
import PcWrapper from './PcWrapper.vue'

defineOptions({
  name: 'SimulatorGridEditor',
})

const workspaceStore = useWorkspaceStore()
const controlStore = useControlStore()
const { floatingSettingVisible } = storeToRefs(controlStore)

const floatingPanelRef = ref<HTMLElement | null>(null)

const wrapperRef = useTemplateRef('wrapperRef')

onClickOutside(floatingPanelRef, () => {
  if (controlStore.floatingSettingVisible) {
    controlStore.floatingSettingVisible = false
  }
})

onUnmounted(() => {
  workspaceStore.setCurrentApp(null)
  controlStore.floatingSettingVisible = false
})
</script>

<template>
  <div class="simulator-container visual-editor">
    <div class="simulator-toolbar h-[var(--ve-header-h,50px)] w-full shrink-0">
      <EditTools>
        <template #center>
          <BlockSettingsBar />
        </template>
      </EditTools>
    </div>

    <div class="simulator-editor">
      <div class="simulator-rail flex h-full shrink-0 items-center justify-center px-2">
        <ComponentList
          @drag-start="() => wrapperRef?.drag()"
          @drag="() => wrapperRef?.drag()"
          @drag-end="() => wrapperRef?.dragEnd()"
          @dblclick-add="(block) => wrapperRef?.addBlock(block)"
        />
      </div>
      <div class="simulator-canvas-area">
        <PcWrapper ref="wrapperRef" />

        <transition name="floating-setting-panel">
          <div v-if="floatingSettingVisible" ref="floatingPanelRef" class="floating-setting-panel">
            <div class="floating-setting-panel__header">
              <span class="ve-panel-title">配置</span>
              <el-button text circle @click="controlStore.floatingSettingVisible = false">
                <el-icon><CloseBold /></el-icon>
              </el-button>
            </div>
            <div class="floating-setting-panel__body">
              <RightAttributePanel />
            </div>
          </div>
        </transition>
      </div>
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
@use './func.scss' as *;

.simulator-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.simulator-toolbar {
  background: var(--el-bg-color);
}

.simulator-rail {
  width: calc(var(--ve-rail-w, 52px) + 16px);
}

.simulator-canvas-area {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: center;

  :deep(> *) {
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
  }
}

.simulator-editor {
  width: 100%;
  flex: 1;
  height: 0;
  min-height: 0;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--el-bg-color-page);
  background-image: radial-gradient(circle, var(--ve-grid-dot, var(--el-fill-color-lighter)) 1px, transparent 1px);
  background-size: 20px 20px;

  &::-webkit-scrollbar {
    width: 0;
  }
}

.list-group-item {
  position: relative;
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
    @include showComponentBorder;

    &::after {
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(left);
    }
  }
}
</style>

<style lang="scss" scoped>
.floating-setting-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 360px;
  height: calc(100% - 32px);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--ve-radius-md, 10px);
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-light));
  background: var(--el-bg-color);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    var(--el-box-shadow);
}

.floating-setting-panel__header {
  height: 46px;
  flex-shrink: 0;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
}

.floating-setting-panel__body {
  flex: 1;
  min-height: 0;
}

.floating-setting-panel-enter-active,
.floating-setting-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.floating-setting-panel-enter-from,
.floating-setting-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
