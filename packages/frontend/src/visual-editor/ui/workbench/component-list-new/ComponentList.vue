<script lang="ts" setup>
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores'
import CascadeCatalogPanel from './CascadeCatalogPanel.vue'
import { WIDGET_CATALOGS } from './widget-catalog'

const emits = defineEmits<{
  dragStart: [value: VisualEditorBlockData, index: number]
  drag: [k: string]
  dragEnd: []
  dblclickAdd: [value: VisualEditorBlockData]
}>()

const activeComp = ref(WIDGET_CATALOGS[0]?.title ?? '')
const controlStore = useControlStore()

const hoveredPopover = ref<string | null>(null)
/** 点击菜单图标后固定浮窗，避免拖拽或移开鼠标时自动关闭 */
const pinnedPopover = ref<string | null>(null)
const panelStyle = ref<Record<string, string>>({})
const navBtnRefs = ref<Record<string, HTMLElement | null>>({})

let closeTimer: ReturnType<typeof setTimeout> | null = null

const catalogs = computed(() => WIDGET_CATALOGS)

const activeCatalog = computed(() =>
  catalogs.value.find(c => c.title === hoveredPopover.value),
)

function setNavBtnRef(title: string, el: HTMLElement | null) {
  if (el)
    navBtnRefs.value[title] = el
}

function cancelCloseTimer() {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function updatePanelPosition(title: string) {
  const el = navBtnRefs.value[title]
  if (!el)
    return

  const rect = el.getBoundingClientRect()
  const panelWidth = 532
  const panelMaxHeight = 520
  const gap = 10

  let left = rect.right + gap
  let top = rect.top

  if (left + panelWidth > window.innerWidth - 8) {
    left = Math.max(8, rect.left - panelWidth - gap)
  }

  if (top + panelMaxHeight > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - panelMaxHeight - 8)
  }

  panelStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: '2050',
  }
}

async function onBtnMouseEnter(title: string) {
  cancelCloseTimer()
  activeComp.value = title
  hoveredPopover.value = title
  await nextTick()
  updatePanelPosition(title)
}

async function onBtnClick(title: string) {
  cancelCloseTimer()
  if (pinnedPopover.value === title) {
    pinnedPopover.value = null
    hoveredPopover.value = null
    return
  }
  pinnedPopover.value = title
  activeComp.value = title
  hoveredPopover.value = title
  await nextTick()
  updatePanelPosition(title)
}

function shouldKeepPanelOpen() {
  return Boolean(pinnedPopover.value || controlStore.isDragging)
}

function onBtnMouseLeave() {
  if (shouldKeepPanelOpen())
    return
  cancelCloseTimer()
  closeTimer = setTimeout(() => {
    if (!controlStore.isDragging)
      hoveredPopover.value = null
    closeTimer = null
  }, 150)
}

function onContentMouseEnter() {
  cancelCloseTimer()
}

function onContentMouseLeave() {
  if (shouldKeepPanelOpen())
    return
  cancelCloseTimer()
  closeTimer = setTimeout(() => {
    if (!controlStore.isDragging)
      hoveredPopover.value = null
    closeTimer = null
  }, 200)
}

function onWindowChange() {
  if (hoveredPopover.value)
    updatePanelPosition(hoveredPopover.value)
}

watch(hoveredPopover, (title) => {
  if (title) {
    window.addEventListener('scroll', onWindowChange, true)
    window.addEventListener('resize', onWindowChange)
  }
  else {
    window.removeEventListener('scroll', onWindowChange, true)
    window.removeEventListener('resize', onWindowChange)
  }
})

onBeforeUnmount(() => {
  cancelCloseTimer()
  window.removeEventListener('scroll', onWindowChange, true)
  window.removeEventListener('resize', onWindowChange)
})

function dragging() {
  controlStore.setDraggingVisualKey(Date.now().toString())
  emits('drag', controlStore.draggingVisualKey)
}

function dragEnd() {
  controlStore.setIsDragging(false)
  emits('dragEnd')
}

function onCatalogDragStart(block: VisualEditorBlockData, index: number) {
  cancelCloseTimer()
  if (hoveredPopover.value)
    pinnedPopover.value = hoveredPopover.value
  emits('dragStart', block, index)
}

function closePanel() {
  cancelCloseTimer()
  pinnedPopover.value = null
  hoveredPopover.value = null
}

function onCatalogDblclickAdd(block: VisualEditorBlockData) {
  closePanel()
  emits('dblclickAdd', block)
}
</script>

<template>
  <div
    :class="$style['component-list-container']"
    class="flex flex-col items-center justify-center"
  >
    <el-button
      v-for="catalog in catalogs"
      :key="catalog.title"
      :ref="(el) => setNavBtnRef(catalog.title, (el as any)?.$el ?? el)"
      text
      :title="catalog.title"
      :class="[
        $style['nav-btn'],
        {
          [$style['nav-btn--active']]: activeComp === catalog.title,
          [$style['nav-btn--pinned']]: pinnedPopover === catalog.title,
        },
      ]"
      @mouseenter="onBtnMouseEnter(catalog.title)"
      @mouseleave="onBtnMouseLeave()"
      @click="onBtnClick(catalog.title)"
    >
      <SvgIcon :size="18" :name="catalog.icon" />
    </el-button>

    <Teleport to="body">
      <Transition name="component-panel-fade">
        <div
          v-if="hoveredPopover && activeCatalog"
          :style="panelStyle"
          :class="$style['floating-panel']"
          @mouseenter="onContentMouseEnter"
          @mouseleave="onContentMouseLeave"
        >
          <CascadeCatalogPanel
            :config="activeCatalog"
            @drag-start="onCatalogDragStart"
            @drag="dragging"
            @drag-end="dragEnd"
            @dblclick-add="onCatalogDblclickAdd"
            @close="closePanel"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" module>
.component-list-container {
  gap: 7px;
  padding: 8px 6px;
  border-radius: 12px;
  border: 1px solid var(--ve-paper-edge, var(--el-border-color-light));
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    0 12px 26px rgba(31, 58, 112, 0.12);

  :global {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.nav-btn {
  position: relative;
  width: 38px;
  height: 38px;
  padding: 7px;
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background-color: var(--ve-active-fill, var(--el-color-primary-light-9));
    color: var(--el-color-primary);
    transform: translateY(-1px);
  }

  &--active {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.08));
    color: var(--el-color-primary);

    &::before {
      content: '';
      position: absolute;
      left: -7px;
      top: 50%;
      transform: translateY(-50%);
      width: 2px;
      height: 16px;
      border-radius: 1px;
      background-color: var(--ve-spine, var(--el-color-primary));
    }
  }

  &--pinned {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  }
}

.floating-panel {
  pointer-events: auto;
}
</style>

<style scoped>
.component-panel-fade-enter-active,
.component-panel-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.component-panel-fade-enter-from,
.component-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
