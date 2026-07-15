<script setup lang="ts">
import { Expand, Fold } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'

// 定义组件Props
const props = withDefaults(
  defineProps<{
    // 侧边栏方位：top/right/bottom/left
    direction?: 'top' | 'right' | 'bottom' | 'left'
    // 展开尺寸（宽度/高度，px）
    expandSize?: number
    // 收缩尺寸（宽度/高度，px）
    collapseSize?: number
    // 是否默认收缩
    defaultCollapsed?: boolean
    // 容器尺寸（垂直方位时是高度，水平方位时是宽度）
    containerSize?: string
    // 过渡动画时长（s）
    transitionDuration?: number
    // 触发按钮大小
    triggerSize?: number
    // 背景颜色
    bgColor?: string
  }>(),
  {
    direction: 'left',
    expandSize: 240,
    collapseSize: 64,
    defaultCollapsed: false,
    containerSize: '100%',
    transitionDuration: 0.3,
    triggerSize: 18,
    bgColor: 'var(--el-bg-color)',
  },
)

// 定义事件
const emit = defineEmits<{
  (e: 'collapseChange', collapsed: boolean): void
}>()

// 收缩状态
const collapsed = ref(props.defaultCollapsed)

// 根据方位计算触发按钮旋转角度
const triggerRotate = computed(() => {
  const rotateMap = {
    left: 0,
    right: 180,
    top: 90,
    bottom: 270,
  }
  return rotateMap[props.direction]
})

// 切换收缩状态
function toggleCollapse() {
  collapsed.value = !collapsed.value
  emit('collapseChange', collapsed.value)
}

// 监听默认收缩状态变化
watch(
  () => props.defaultCollapsed,
  (newVal) => {
    collapsed.value = newVal
  },
  { immediate: true },
)
</script>

<template>
  <!-- 核心容器：$style + UnoCSS 组合使用 -->
  <div
    class="inline-block relative overflow-hidden"
    :class="[
      $style.sidebarWrapper,
      // 根据方位设置容器尺寸
      direction === 'top' || direction === 'bottom'
        ? `w-${containerSize === '100%' ? 'full' : containerSize}`
        : `h-${containerSize === '100%' ? 'full' : containerSize}`,
      // 动态宽/高（收缩/展开）
      direction === 'left' || direction === 'right'
        ? `w-${collapsed ? `${collapseSize}px` : `${expandSize}px`}`
        : `h-${collapsed ? `${collapseSize}px` : `${expandSize}px`}`,
    ]"
  >
    <!-- 侧边栏主体 -->
    <div
      class="relative bg-[var(--sidebar-bg)] rounded-md shadow-sm transition-all duration-300 ease-in-out overflow-hidden"
      :class="[
        $style.sidebarContainer,
        // 方位类名
        `flex ${direction === 'left' || direction === 'right' ? 'flex-col' : 'flex-row'}`,
        // 动态宽/高
        direction === 'left' || direction === 'right'
          ? `w-${collapsed ? `${collapseSize}px` : `${expandSize}px`} h-full`
          : `w-full h-${collapsed ? `${collapseSize}px` : `${expandSize}px`}`,
        // 收缩状态样式
        collapsed && '!p-0',
      ]"
      :style="{
        '--sidebar-bg': bgColor,
        '--sidebar-transition': `all ${transitionDuration}s ease`,
      }"
    >
      <!-- 侧边栏内容插槽 -->
      <div
        class="w-full h-full box-border items-center justify-center gap-2"
        :class="[
          $style.sidebarContent,
          // 基础内边距
          collapsed ? 'p-4' : 'p-4 px-2',
          // 布局方式
          `flex ${direction === 'left' || direction === 'right' ? 'flex-col' : 'flex-row'}`,
          // 收缩状态适配
          collapsed && 'justify-center gap-1',
        ]"
      >
        <slot />
      </div>

      <!-- 收缩/展开触发按钮 -->
      <div
        class="absolute z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border"
        :class="[
          $style.collapseTrigger,
          direction === 'left'
            ? 'right-2'
            : direction === 'right'
              ? 'left-2'
              : direction === 'top'
                ? 'bottom-2'
                : 'top-2',
          direction === 'left' || direction === 'right' ? 'bottom-4' : 'right-4',
        ]"
        :title="collapsed ? '展开' : '收起'"
        :style="{ transform: `rotate(${triggerRotate}deg)` }"
        @click="toggleCollapse"
      >
        <el-icon :size="triggerSize">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<!-- 直接使用 style module，样式写在组件内，模板用 $style 引用 -->
<style module lang="less">
// 侧边栏容器样式
.sidebarWrapper {
  // 不同方位的内容间距适配
  :global(.direction-left),
  :global(.direction-right) {
    .sidebarContent {
      gap: 4px;
    }
  }

  :global(.direction-top),
  :global(.direction-bottom) {
    .sidebarContent {
      gap: 8px;
      flex-wrap: nowrap;
    }
  }
}

// 侧边栏主体样式
.sidebarContainer {
  // 动画性能优化
  will-change: width, height;

  // 收缩状态下的内容适配
  &.collapsed {
    .sidebarContent {
      .item {
        @apply py-2 px-0 text-center;
      }
    }
  }
}

// 内容区域样式
.sidebarContent {
  // 内容溢出处理
  overflow: hidden;

  // 自定义内容项样式（供外部使用）
  .item {
    @apply py-2 px-3 rounded-md cursor-pointer whitespace-nowrap transition-colors;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}

// 触发按钮样式
.collapseTrigger {
  background-color: var(--el-fill-color-light);
  border-color: var(--el-border-color);
  color: var(--el-text-color-secondary);

  &:hover {
    background-color: var(--el-fill-color);
    color: var(--el-color-primary);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
