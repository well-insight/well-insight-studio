<script lang="ts" setup>
import { ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useEditToolsFloatingPanel, useFloatingPanelPosition } from '../useEditToolsFloatingPanel'
import PageSettingPanel from './PageSettingPanel.vue'

const PANEL_WIDTH = 340
const PANEL_MAX_HEIGHT = 520
const PANEL_GAP = 8

const triggerRef = ref<HTMLElement | null>(null)

function setTriggerRef(el: any) {
  triggerRef.value = el?.$el ?? el ?? null
}

const {
  isVisible,
  isPinned,
  onTriggerMouseEnter,
  onTriggerMouseLeave,
  onPanelMouseEnter,
  onPanelMouseLeave,
  onTriggerClick,
  closePanel,
} = useEditToolsFloatingPanel('page-setting')

const { panelStyle, updatePanelPosition } = useFloatingPanelPosition({
  panelWidth: PANEL_WIDTH,
  panelMaxHeight: PANEL_MAX_HEIGHT,
  panelGap: PANEL_GAP,
  triggerRef,
  isVisible,
})

async function handleTriggerMouseEnter() {
  await onTriggerMouseEnter()
  updatePanelPosition()
}

async function handleTriggerClick() {
  await onTriggerClick()
  updatePanelPosition()
}
</script>

<template>
  <div :class="$style.wrapper">
    <el-button
      :ref="setTriggerRef"
      text
      bg
      type="primary"
      :class="{ [$style.triggerBtnPinned]: isPinned }"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="onTriggerMouseLeave"
      @click="handleTriggerClick"
    >
      <SvgIcon name="page-setting" />
      <span class="ml-1">页面配置</span>
    </el-button>

    <Teleport to="body">
      <Transition name="page-setting-panel-fade">
        <div
          v-if="isVisible"
          :style="panelStyle"
          :class="$style.floatingPanel"
          @mouseenter="onPanelMouseEnter"
          @mouseleave="onPanelMouseLeave"
        >
          <PageSettingPanel @close="closePanel" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  display: inline-flex;
}

.triggerBtnPinned {
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

.floatingPanel {
  pointer-events: auto;
}
</style>

<style scoped>
.page-setting-panel-fade-enter-active,
.page-setting-panel-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.page-setting-panel-fade-enter-from,
.page-setting-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
