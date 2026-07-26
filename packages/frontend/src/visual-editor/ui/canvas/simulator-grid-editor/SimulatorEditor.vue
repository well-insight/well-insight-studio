<script lang="tsx" setup>
import { onUnmounted, useTemplateRef } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import RightAttributePanel from '@/visual-editor/ui/workbench/right-attribute-panel/RightAttributePanel.vue'
import { ComponentList } from '../../workbench/component-list-new'
import PcWrapper from './PcWrapper.vue'
import '@/visual-editor/styles/visual-editor.scss'

defineOptions({
  name: 'SimulatorGridEditor',
})

const workspaceStore = useWorkspaceStore()
const controlStore = useControlStore()

const wrapperRef = useTemplateRef('wrapperRef')

onUnmounted(() => {
  workspaceStore.setCurrentApp(null)
  controlStore.floatingSettingVisible = false
})
</script>

<template>
  <div class="simulator-container visual-editor">
    <aside class="simulator-rail">
      <ComponentList
        @drag-start="() => wrapperRef?.drag()"
        @drag="() => wrapperRef?.drag()"
        @drag-end="() => wrapperRef?.dragEnd()"
        @dblclick-add="(block) => wrapperRef?.addBlock(block)"
      />
    </aside>

    <main class="simulator-canvas-wrapper">
      <div class="simulator-canvas-toolbar">
        <h3>
          <span class="simulator-canvas-toolbar__icon">
            <SvgIcon :size="15" name="component-base" />
          </span>
          画布设计
        </h3>
      </div>
      <div class="simulator-canvas-area">
        <PcWrapper ref="wrapperRef" />
      </div>
    </main>

    <aside class="simulator-setting-rail">
      <div class="simulator-setting-panel__header">
        <span class="simulator-setting-panel__icon">
          <SvgIcon :size="15" name="page-setting" />
        </span>
        属性配置
      </div>
      <div class="simulator-setting-panel__body">
        <RightAttributePanel />
      </div>
    </aside>
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
  gap: 12px;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.simulator-rail {
  width: 300px;
  min-width: 300px;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(82, 124, 181, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 251, 255, 0.9)), var(--el-bg-color);
  box-shadow: 0 18px 40px rgba(31, 58, 112, 0.08);
}

.simulator-canvas-wrapper {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(82, 124, 181, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.68)), var(--el-bg-color-page);
  box-shadow: 0 18px 40px rgba(31, 58, 112, 0.08);
  padding: 0 16px 16px;
}

.simulator-canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 54px;
  min-height: 54px;
  box-sizing: border-box;
  padding: 0;
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.simulator-canvas-toolbar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.simulator-canvas-area {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: 12px;

  :deep(> *) {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
}

.simulator-setting-rail {
  width: 300px;
  min-width: 300px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(82, 124, 181, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 251, 255, 0.9)), var(--el-bg-color);
  box-shadow: 0 18px 40px rgba(31, 58, 112, 0.08);
}

.simulator-setting-panel__header {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  height: 54px;
  min-height: 54px;
  box-sizing: border-box;
  padding: 0 16px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.simulator-setting-panel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.simulator-setting-panel__body {
  flex: 1;
  min-height: 0;
  padding: 4px 16px 12px;
}

:global(html.dark) .simulator-rail,
:global(html.dark) .simulator-canvas-wrapper,
:global(html.dark) .simulator-setting-rail {
  border-color: rgba(140, 210, 255, 0.14);
  background: linear-gradient(180deg, rgba(13, 40, 64, 0.92), rgba(8, 28, 48, 0.9)), var(--el-bg-color);
  box-shadow: 0 18px 40px rgba(4, 16, 30, 0.3);
}

:global(html.dark) .simulator-setting-panel__header {
  border-color: rgba(140, 210, 255, 0.12);
  background: rgba(13, 40, 64, 0.72);
}

:global(html.dark) .simulator-canvas-toolbar__icon,
:global(html.dark) .simulator-setting-panel__icon {
  background:
    radial-gradient(circle at 30% 25%, rgba(64, 158, 255, 0.28), transparent 52%),
    linear-gradient(180deg, rgba(64, 158, 255, 0.18), rgba(64, 158, 255, 0.08));
  border-color: rgba(64, 158, 255, 0.2);
  color: #5ab2ff;
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
