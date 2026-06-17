<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { GridLayout } from '@/components/grid-layout-plus'
import { cloneDeep } from 'lodash-es'
import { computed, ref } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { generateNanoid } from '@/visual-editor/lib'
import CompRender from '@/visual-editor/ui/canvas/simulator-grid-editor/comp-render'

interface GridItemLayout {
  x: number
  y: number
  w: number
  h: number
  i: string
}

const props = defineProps({
  /** 插槽中的子组件数组 */
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: (): VisualEditorBlockData[] => [],
  },
  /** 插槽名称 */
  slotKey: {
    type: String,
    default: '',
  },
  /** 网格列数 */
  colNum: {
    type: Number,
    default: 12,
  },
  /** 网格行高 */
  rowHeight: {
    type: Number,
    default: 15,
  },
  /** 父容器是否被选中（简单选中状态） */
  parentFocus: {
    type: Boolean,
    default: false,
  },
  /** 父容器是否处于编辑模式（双击后进入） */
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:children', 'dragEnter', 'dragLeave', 'drop'])

const controlStore = useControlStore()

// 本地数据
const localChildren = computed({
  get: () => props.children || [],
  set: (val) => emit('update:children', val),
})

// 构建组件查找映射，避免每次遍历数组
const childMap = computed(() => {
  const map = new Map<string, VisualEditorBlockData>()
  for (const child of localChildren.value) {
    map.set(child._vid, child)
  }
  return map
})

// 转换为 GridLayout 布局格式 - 使用 computed 缓存
const layout = computed<GridItemLayout[]>(() =>
  localChildren.value.map((child) => ({
    x: child.x ?? 0,
    y: child.y ?? 0,
    w: child.w ?? 4,
    h: child.h ?? 2,
    i: child._vid,
  }))
)

// 当前选中的组件 id
const selectedId = ref<string | null>(null)

// 网格布局 ref
const gridLayoutRef = ref<InstanceType<typeof GridLayout>>()

// 处理布局更新
function handleLayoutUpdated(newLayout: GridItemLayout[]) {
  const updated = localChildren.value.map((child) => {
    const item = newLayout.find((l) => l.i === child._vid)
    if (item && (child.x !== item.x || child.y !== item.y || child.w !== item.w || child.h !== item.h)) {
      return { ...child, x: item.x, y: item.y, w: item.w, h: item.h }
    }
    return child
  })
  emit('update:children', updated)
}

// 处理拖拽移动
function handleMove(i: string, newX: number, newY: number) {
  const child = childMap.value.get(i)
  if (child) {
    child.x = newX
    child.y = newY
  }
}

// 处理调整大小
function handleResize(i: string, newH: number, newW: number) {
  const child = childMap.value.get(i)
  if (child) {
    child.w = newW
    child.h = newH
  }
}

// 处理组件选中 - 阻止事件冒泡
function handleSelect(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block) return
  e.stopPropagation()
  e.preventDefault()
  selectedId.value = block._vid
}

// 阻止事件冒泡
function stopPropagation(e: Event) {
  e.stopPropagation()
}

// 获取组件样式
function getBlockStyle(block: VisualEditorBlockData): CSSProperties {
  const styles = block.styles || {}
  return {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...styles,
  }
}

// 是否启用拖拽 - 只有在编辑模式下才启用
const isDraggable = computed(() => props.isEditing)
const isResizable = computed(() => props.isEditing)

// 处理拖放进入
function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragEnter', e)
}

// 处理拖放离开
function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragLeave', e)
}

// 处理拖放悬停
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

// 处理放置 - 从外部拖入组件
function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  // 获取拖拽数据
  const block = controlStore.moveVisualData
  if (!block) {
    return
  }

  // 如果不在编辑模式，先通知父组件进入编辑模式
  if (!props.isEditing) {
    emit('drop', e)
    return
  }

  // 计算放置位置（相对于 GridLayout）
  const gridEl = gridLayoutRef.value?.$el as HTMLElement | undefined
  if (!gridEl) {
    return
  }

  const rect = gridEl.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 转换为网格坐标
  const colWidth = rect.width / props.colNum
  const gridX = Math.max(0, Math.min(props.colNum - 4, Math.floor(x / colWidth)))
  const gridY = Math.max(0, Math.floor(y / props.rowHeight))

  // 创建新组件
  const copiedBlock = cloneDeep(block) as VisualEditorBlockData
  copiedBlock._vid = `vid_${generateNanoid()}`
  copiedBlock.i = copiedBlock._vid
  copiedBlock.x = gridX
  copiedBlock.y = gridY
  copiedBlock.w = 4 // 默认宽度
  copiedBlock.h = 2 // 默认高度
  copiedBlock.focus = false
  copiedBlock.focusWithChild = false

  // 添加到子组件列表
  localChildren.value = [...localChildren.value, copiedBlock]
  controlStore.setMoveVisualData(null)
}
</script>

<template>
  <div
    class="slot-grid-canvas"
    :class="{
      'is-editing': isEditing,
      'is-focused': parentFocus && !isEditing,
    }"
    @dragenter.stop.prevent="handleDragEnter"
    @dragleave.stop.prevent="handleDragLeave"
    @dragover.stop.prevent="handleDragOver"
    @drop.stop.prevent="handleDrop"
    @mousedown.stop
    @click.stop
  >
    <GridLayout
      v-if="layout.length > 0"
      ref="gridLayoutRef"
      :layout="layout"
      class="slot-grid-layout"
      :class="{ 'is-editing': isEditing }"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :vertical-compact="false"
      :use-css-transforms="true"
      :margin="[0, 0]"
      :prevent-collision="false"
      :is-bounded="true"
      @layout-updated="handleLayoutUpdated"
      @move="handleMove"
      @resize="handleResize"
    >
      <grid-item
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        class="slot-grid-item"
        :class="{
          'is-selected': selectedId === item.i,
          'is-editing': isEditing,
        }"
        @click.stop="(e: MouseEvent) => handleSelect(childMap.get(item.i), e)"
        @mousedown.stop
      >
        <div
          v-if="childMap.get(item.i)"
          class="slot-block-wrapper"
          :class="{ 'is-editing': isEditing }"
          :style="getBlockStyle(childMap.get(item.i)!)"
        >
          <CompRender :element="childMap.get(item.i)!" />
        </div>
      </grid-item>
    </GridLayout>
    <!-- 空状态 -->
    <div v-else class="slot-grid-empty">
      <span class="empty-text">
        {{ isEditing ? '拖入组件' : '双击容器进入编辑模式' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slot-grid-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;
  // 始终允许接收拖放事件
  pointer-events: auto;

  // 非编辑模式下禁用内部元素的交互
  &:not(.is-editing) {
    .slot-grid-layout {
      pointer-events: none;
    }

    .slot-grid-item {
      pointer-events: none;
    }

    // 但保留空状态的交互能力
    .slot-grid-empty {
      pointer-events: auto;
    }
  }

  // 编辑模式下启用所有鼠标事件
  &.is-editing {
    .slot-grid-layout {
      pointer-events: auto;
    }

    .slot-grid-item {
      pointer-events: auto;
    }
  }

  // 仅被选中但未进入编辑模式时的样式
  &.is-focused {
    .slot-grid-empty {
      background: #f0f7ff;
      border-color: #409eff;

      .empty-text {
        color: #409eff;
      }
    }
  }
}

:deep(.vue-grid-layout) {
  width: 100%;
  min-height: 100%;
}

.slot-grid-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  background: #fafafa;
  pointer-events: auto; // 空状态需要接收拖入事件

  .empty-text {
    color: #909399;
    font-size: 12px;
  }
}

.slot-grid-item {
  position: relative;
  touch-action: none;

  &.is-selected {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -1px;
    z-index: 10;
  }

  // 拖拽手柄
  :deep(.vue-resizable-handle) {
    z-index: 20;
    pointer-events: auto;
  }

  // 拖拽时的样式
  &.vue-grid-item.vue-grid-item-dragging {
    z-index: 100;
    opacity: 0.9;
  }
}

.slot-block-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
