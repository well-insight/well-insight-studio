<script lang="ts" setup>
import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { cloneDeep, isString } from 'lodash-es'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'

const emits = defineEmits<{
  dragStart: [value: VisualEditorComponent, index: number]
  drag: [k: string]
  dragEnd: []
  dblclickAdd: [value: VisualEditorBlockData]
}>()

const activeComp = ref('基础组件')

const controlStore = useControlStore()

/** 当前 hover 打开的 popover 标题 */
const hoveredPopover = ref<string | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function cancelCloseTimer() {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function onBtnMouseEnter(title: string) {
  cancelCloseTimer()
  hoveredPopover.value = title
}

function onBtnMouseLeave() {
  cancelCloseTimer()
  // 延迟关闭，给鼠标移动到面板内容的时间
  closeTimer = setTimeout(() => {
    if (!controlStore.isDragging) {
      hoveredPopover.value = null
    }
    closeTimer = null
  }, 150)
}

function onContentMouseEnter() {
  cancelCloseTimer()
}

function onContentMouseLeave() {
  cancelCloseTimer()
  closeTimer = setTimeout(() => {
    hoveredPopover.value = null
    closeTimer = null
  }, 200)
}

const widgets = computed(() => {
  const { baseWidgets, containerComponents, formWidgets, chartWidgets } = visualConfig.componentModules

  // 过滤掉不在列表中显示的组件（如组组件）
  const filterVisible = (widgets: Record<string, any>) =>
    Object.values(widgets).filter((w: any) => !w.hiddenInList)

  return [
    {
      title: '基础组件',
      icon: 'component-base',
      widgets: filterVisible(baseWidgets),
    },
    {
      title: '表单组件',
      icon: 'component-form',
      widgets: filterVisible(formWidgets),
    },
    {
      title: '图表组件',
      icon: 'component-chart',
      widgets: filterVisible(chartWidgets),
    },
    {
      title: '容器组件',
      icon: 'component-content',
      widgets: filterVisible(containerComponents),
    },
  ]
})

function dragStart(e: DragEvent, visual: VisualEditorComponent, index: number) {
  e.dataTransfer?.setData('text/plain', visual.key)
  e.dataTransfer!.effectAllowed = 'move'
  controlStore.setIsDragging(true)
  controlStore.setMoveVisualData(createNewBlock(cloneDeep(visual)))
  emits('dragStart', visual, index)
}

function dragging() {
  controlStore.setDraggingVisualKey(Date.now().toString())
  emits('drag', controlStore.draggingVisualKey)
}

function dragEnd() {
  controlStore.setIsDragging(false)
  hoveredPopover.value = null
  emits('dragEnd')
}

function onDblClick(w: VisualEditorComponent) {
  const newBlock = createNewBlock(cloneDeep(w))
  hoveredPopover.value = null
  emits('dblclickAdd', newBlock)
}
</script>

<template>
  <div
    :class="$style['component-list-container']"
    class="flex flex-col items-center justify-center rounded-[16px] bg-[var(--el-bg-color)]"
  >
    <el-popover
      v-for="(e, i) in widgets"
      :key="i"
      placement="right"
      transition="el-zoom-in-left"
      :width="280"
      :popper-class="$style['component-popover']"
      :teleported="true"
      :visible="hoveredPopover === e.title"
    >
      <template #reference>
        <el-button
          text
          :class="[
            $style['nav-btn'],
            { [$style['nav-btn--active']]: activeComp === e.title },
          ]"
          @mouseenter="onBtnMouseEnter(e.title)"
          @mouseleave="onBtnMouseLeave()"
        >
          <SvgIcon :size="20" :name="e.icon" />
        </el-button>
      </template>

      <div @mouseenter="onContentMouseEnter" @mouseleave="onContentMouseLeave">
        <el-scrollbar class="w-full select-none" view-style="padding: 6px" max-height="520px">
          <div :class="$style['popover-header']">
            <SvgIcon :size="16" :name="e.icon" />
            <span>{{ e.title }}</span>
          </div>
          <template v-for="(w, idx) in e.widgets" :key="idx">
            <div
              :class="$style['component-item']"
              draggable="true"
              @dragstart="(ev) => dragStart(ev, w, idx)"
              @drag="dragging"
              @dragend="dragEnd"
              @dblclick="onDblClick(w)"
            >
              <div :class="$style['component-item__icon']">
                <SvgIcon v-if="isString(w?.icon)" :size="28" :name="w?.icon" />
              </div>
              <div :class="$style['component-item__info']">
                <span :class="$style['component-item__label']">
                  {{ w.label }}
                </span>
                <span :class="$style['component-item__desc']">
                  {{ w.description }}
                </span>
              </div>
            </div>
          </template>
        </el-scrollbar>
      </div>
    </el-popover>
  </div>
</template>

<style lang="scss" module>
.component-list-container {
  box-shadow: var(--el-box-shadow-light);
  gap: 16px;
  padding: 8px 4px;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }

  :global {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.nav-btn {
  position: relative;
  width: 36px;
  height: 36px;
  padding: 6px;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--el-text-color-secondary);

  &:hover {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    transform: scale(1.08);
  }

  &--active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 18px;
      border-radius: 0 3px 3px 0;
      background-color: var(--el-color-primary);
    }
  }
}

.popover-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 4px;
}

.component-popover {
  padding: 0 !important;
  border-radius: 12px;
  overflow: hidden;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: var(--el-color-primary-light-9);
    transform: translateX(4px);

    :global(.svg-icon) {
      color: var(--el-color-primary);
    }
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.97);
    background-color: var(--el-color-primary-light-8);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background-color: var(--el-fill-color-light);
    flex-shrink: 0;
    transition: all 0.2s ease;
    color: var(--el-text-color-secondary);

    .component-item:hover & {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    flex: 1;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}
</style>
