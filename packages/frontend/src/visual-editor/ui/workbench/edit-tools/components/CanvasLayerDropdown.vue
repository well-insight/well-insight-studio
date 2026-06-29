<script lang="ts" setup>
import { List } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useEditToolsFloatingPanel, useFloatingPanelPosition } from '../useEditToolsFloatingPanel'
import CanvasLayerPanel from './CanvasLayerPanel.vue'

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
} = useEditToolsFloatingPanel('canvas-layer')

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
      :icon="List"
      :class="{ [$style.triggerBtnPinned]: isPinned }"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="onTriggerMouseLeave"
      @click="handleTriggerClick"
    >
      <span>画布层级</span>
    </el-button>

    <Teleport to="body">
      <Transition name="layer-panel-fade">
        <div
          v-if="isVisible"
          :style="panelStyle"
          :class="$style.floatingPanel"
          @mouseenter="onPanelMouseEnter"
          @mouseleave="onPanelMouseLeave"
        >
          <CanvasLayerPanel @close="closePanel" />
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
.layer-panel-fade-enter-active,
.layer-panel-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.layer-panel-fade-enter-from,
.layer-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
