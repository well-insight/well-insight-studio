<script lang="tsx" setup>
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ref, useTemplateRef } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import RightAttributePanel from '@/visual-editor/ui/workbench/right-attribute-panel/RightAttributePanel.vue'
import { ComponentList } from '../../workbench/component-list-new'
import PcWrapper from './PcWrapper.vue'
import '@/visual-editor/styles/visual-editor.scss'

defineOptions({
  name: 'SimulatorGridEditor',
})

const wrapperRef = useTemplateRef('wrapperRef')

// 左右面板宽度（px），可通过切换按钮折叠，也可在分割条上拖拽调宽
const LEFT_MIN = 240
const LEFT_MAX = 560
const RIGHT_MIN = 260
const RIGHT_MAX = 560
const CENTER_MIN = 400

const leftWidth = ref(300)
const rightWidth = ref(300)
const leftDrawerOpen = ref(true)
const rightDrawerOpen = ref(true)

function onLeftResize(size: number | string) {
  const v = Math.round(Number(size))
  if (v > 0) {
    leftWidth.value = v
    leftDrawerOpen.value = true
  }
  else {
    leftDrawerOpen.value = false
  }
}

function onRightResize(size: number | string) {
  const v = Math.round(Number(size))
  if (v > 0) {
    rightWidth.value = v
    rightDrawerOpen.value = true
  }
  else {
    rightDrawerOpen.value = false
  }
}

function toggleLeft() {
  if (leftDrawerOpen.value) {
    leftDrawerOpen.value = false
  }
  else {
    if (leftWidth.value <= 0) {
      leftWidth.value = 300
    }
    leftDrawerOpen.value = true
  }
}

function toggleRight() {
  if (rightDrawerOpen.value) {
    rightDrawerOpen.value = false
  }
  else {
    if (rightWidth.value <= 0) {
      rightWidth.value = 300
    }
    rightDrawerOpen.value = true
  }
}
</script>

<template>
  <div class="simulator-container visual-editor">
    <el-splitter class="simulator-splitter">
      <el-splitter-panel
        :size="leftDrawerOpen ? leftWidth : 0"
        :min="leftDrawerOpen ? LEFT_MIN : 0"
        :max="LEFT_MAX"
        class="simulator-splitter__pane"
        @update:size="onLeftResize"
      >
        <aside class="simulator-rail" :class="{ 'is-collapsed': !leftDrawerOpen }">
          <ComponentList
            @drag-start="() => wrapperRef?.drag()"
            @drag="() => wrapperRef?.drag()"
            @drag-end="() => wrapperRef?.dragEnd()"
            @dblclick-add="(block) => wrapperRef?.addBlock(block)"
          />
        </aside>
      </el-splitter-panel>

      <el-splitter-panel :min="CENTER_MIN">
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
      </el-splitter-panel>

      <el-splitter-panel
        :size="rightDrawerOpen ? rightWidth : 0"
        :min="rightDrawerOpen ? RIGHT_MIN : 0"
        :max="RIGHT_MAX"
        class="simulator-splitter__pane"
        @update:size="onRightResize"
      >
        <aside
          class="simulator-setting-rail"
          :class="{ 'is-collapsed': !rightDrawerOpen }"
        >
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
      </el-splitter-panel>
    </el-splitter>

    <button
      class="drawer-toggle drawer-toggle--left"
      :style="{ left: `${leftDrawerOpen ? leftWidth : 0}px` }"
      :class="{ 'is-drawer-collapsed': !leftDrawerOpen }"
      type="button"
      :aria-label="leftDrawerOpen ? '收起组件库' : '展开组件库'"
      :title="leftDrawerOpen ? '收起组件库' : '展开组件库'"
      @click="toggleLeft"
    >
      <el-icon><ArrowLeft v-if="leftDrawerOpen" /><ArrowRight v-else /></el-icon>
    </button>

    <button
      class="drawer-toggle drawer-toggle--right"
      :style="{ right: `${rightDrawerOpen ? rightWidth : 0}px` }"
      :class="{ 'is-drawer-collapsed': !rightDrawerOpen }"
      type="button"
      :aria-label="rightDrawerOpen ? '收起属性配置' : '展开属性配置'"
      :title="rightDrawerOpen ? '收起属性配置' : '展开属性配置'"
      @click="toggleRight"
    >
      <el-icon><ArrowRight v-if="rightDrawerOpen" /><ArrowLeft v-else /></el-icon>
    </button>
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
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.simulator-splitter {
  width: 100%;
  height: 100%;

  :deep(.el-splitter-panel__body) {
    height: 100%;
    overflow: hidden;
  }
}

.simulator-rail,
.simulator-setting-rail {
  position: relative;
  z-index: 5;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--ve-radius-md, var(--app-shell-radius, 16px));
  border: 1px solid var(--ve-panel-border, var(--el-border-color-lighter));
  background: var(--ve-panel-bg, var(--el-bg-color));
  box-shadow: var(--ve-panel-shadow, var(--workbench-shadow, none));
  transition:
    border-color 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;

  &.is-collapsed {
    overflow: hidden;
  }
}

.simulator-rail.is-collapsed > :not(.drawer-toggle),
.simulator-setting-rail.is-collapsed > :not(.drawer-toggle) {
  visibility: hidden;
  pointer-events: none;
}

.drawer-toggle {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 56px;
  min-width: 28px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    outline: none;
  }
}

.drawer-toggle--left {
  right: auto;
  border-left: 0;
  border-radius: 0 var(--app-shell-radius, 8px) var(--app-shell-radius, 8px) 0;
}

.drawer-toggle--right {
  left: auto;
  border-right: 0;
  border-radius: var(--app-shell-radius, 8px) 0 0 var(--app-shell-radius, 8px);
}

.simulator-canvas-wrapper {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--ve-radius-md, var(--app-shell-radius, 16px));
  border: 1px solid var(--ve-panel-border, var(--el-border-color-lighter));
  background: var(--ve-canvas-bg, var(--ve-soft-bg, var(--el-bg-color-page)));
  box-shadow: var(--ve-panel-shadow, var(--workbench-shadow, none));
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
  border-radius: var(--app-shell-radius, 8px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  color: var(--el-color-primary);
}

.simulator-canvas-area {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: var(--app-shell-radius, 12px);

  :deep(> *) {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
}

.simulator-setting-rail {
  display: flex;
  flex-direction: column;
}

.simulator-setting-panel__header {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  height: 54px;
  min-height: 54px;
  box-sizing: border-box;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
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
  border-radius: var(--app-shell-radius, 8px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  color: var(--el-color-primary);
}

.simulator-setting-panel__body {
  flex: 1;
  min-height: 0;
  padding: 4px 0 12px;
}

:global(html.dark) .simulator-rail,
:global(html.dark) .simulator-setting-rail {
  border-color: var(--ve-panel-border);
  background: var(--ve-panel-bg);
  box-shadow: var(--ve-panel-shadow);
}

:global(html.dark) .simulator-canvas-wrapper {
  border-color: var(--ve-panel-border);
  background: var(--ve-canvas-bg);
  box-shadow: var(--ve-panel-shadow);
}

:global(html.dark) .simulator-setting-panel__header {
  border-color: var(--ve-panel-border);
  background: color-mix(in srgb, var(--ve-panel-bg) 88%, var(--el-bg-color-overlay));
}

:global(html.dark) .drawer-toggle {
  border-color: var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

:global(html.dark) .drawer-toggle:hover,
:global(html.dark) .drawer-toggle:focus-visible {
  background: var(--el-fill-color);
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
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
