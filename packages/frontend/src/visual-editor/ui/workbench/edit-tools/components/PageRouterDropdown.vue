<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { useEditToolsFloatingPanel, useFloatingPanelPosition } from '../useEditToolsFloatingPanel'
import PageRouterPanel from './PageRouterPanel.vue'

const PANEL_WIDTH = 340
const PANEL_MAX_HEIGHT = 520
const PANEL_GAP = 8

const { currentPage } = useVisualData()

const triggerRef = ref<HTMLElement | null>(null)

function setTriggerRef(el: any) {
  triggerRef.value = el?.$el ?? el ?? null
}

const { isVisible, toggle, close: closePanel } = useEditToolsFloatingPanel('page-router')

const { panelStyle, updatePanelPosition } = useFloatingPanelPosition({
  panelWidth: PANEL_WIDTH,
  panelMaxHeight: PANEL_MAX_HEIGHT,
  panelGap: PANEL_GAP,
  triggerRef,
  isVisible,
})

const routeButtonLabel = computed(() => {
  const page = currentPage.value
  if (page?.title && page?.path) {
    return `${page.title}「${page.path}」`
  }
  return '首页「/index」'
})

async function handleTriggerClick() {
  await toggle()
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
      :class="{ [$style.triggerBtnActive]: isVisible }"
      @click="handleTriggerClick"
    >
      <span :class="$style.triggerLabel">{{ routeButtonLabel }}</span>
    </el-button>

    <Teleport to="body">
      <Transition name="page-router-panel-fade">
        <div
          v-if="isVisible"
          :style="panelStyle"
          :class="$style.floatingPanel"
        >
          <PageRouterPanel @close="closePanel" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  display: inline-flex;
  max-width: 220px;
}

.triggerLabel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.triggerBtnActive {
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

.floatingPanel {
  pointer-events: auto;
}
</style>

<style scoped>
.page-router-panel-fade-enter-active,
.page-router-panel-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.page-router-panel-fade-enter-from,
.page-router-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
