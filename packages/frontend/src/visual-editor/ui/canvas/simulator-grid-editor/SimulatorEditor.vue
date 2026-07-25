<script lang="tsx" setup>
import { CloseBold } from '@element-plus/icons-vue'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onUnmounted, ref, useTemplateRef } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { EditTools } from '@/visual-editor/ui/workbench/edit-tools'
import RightAttributePanel from '@/visual-editor/ui/workbench/right-attribute-panel/RightAttributePanel.vue'
import { ComponentList } from '../../workbench/component-list-new'
import BlockSettingsBar from './BlockSettingsBar.vue'
import PcWrapper from './PcWrapper.vue'
import '@/visual-editor/styles/visual-editor.scss'

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
      <div class="simulator-rail flex h-full shrink-0 items-center justify-center">
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
  border-radius: 12px;
  background: radial-gradient(circle at 18% 16%, rgba(45, 212, 191, 0.08), transparent 24%), var(--el-bg-color-page);
}

.simulator-toolbar {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(82, 124, 181, 0.14);
  backdrop-filter: blur(14px);
}

.simulator-rail {
  width: calc(var(--ve-rail-w, 52px) + 20px);
  padding: 12px 10px;
  border-right: 1px solid rgba(82, 124, 181, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(248, 251, 255, 0.3));
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
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.035) 1px, transparent 1px),
    radial-gradient(circle, var(--ve-grid-dot, var(--el-fill-color-lighter)) 1px, transparent 1px);
  background-size:
    80px 80px,
    80px 80px,
    20px 20px;

  &::-webkit-scrollbar {
    width: 0;
  }
}

:global(html.dark) .simulator-container {
  background: radial-gradient(circle at 18% 16%, rgba(45, 212, 191, 0.08), transparent 24%), var(--el-bg-color-page);
}

:global(html.dark) .simulator-toolbar {
  border-color: rgba(140, 210, 255, 0.12);
  background: rgba(13, 40, 64, 0.78);
}

:global(html.dark) .simulator-rail {
  border-color: rgba(140, 210, 255, 0.1);
  background: linear-gradient(180deg, rgba(13, 40, 64, 0.5), rgba(8, 28, 48, 0.28));
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
  top: 14px;
  right: 14px;
  width: 368px;
  height: calc(100% - 28px);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-light));
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    0 18px 46px rgba(31, 58, 112, 0.16);
  backdrop-filter: blur(14px);
}

.floating-setting-panel__header {
  height: 48px;
  flex-shrink: 0;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 251, 255, 0.58));
}

.floating-setting-panel__body {
  flex: 1;
  min-height: 0;
}

.floating-setting-panel-enter-active,
.floating-setting-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.floating-setting-panel-enter-from,
.floating-setting-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
