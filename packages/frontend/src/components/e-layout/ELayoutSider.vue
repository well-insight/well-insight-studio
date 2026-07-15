<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { computed } from 'vue'

type Position = 'left' | 'right'
type CollapseMode = 'width' | 'transform'
type TriggerType = boolean | 'button' | 'bar'

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
    width?: number
    collapsedWidth?: number
    showTrigger?: TriggerType
    collapseMode?: CollapseMode
    position?: Position
    bordered?: boolean
    style?: CSSProperties
  }>(),
  {
    collapsed: false,
    width: 200,
    collapsedWidth: 64,
    showTrigger: false,
    collapseMode: 'width',
    position: 'left',
    bordered: false,
    style: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed)
}

const triggerIcon = computed(() => {
  if (props.position === 'left') {
    return props.collapsed ? ArrowRight : ArrowLeft
  }
  else {
    return props.collapsed ? ArrowLeft : ArrowRight
  }
})

const siderContainerStyle = computed<CSSProperties>(() => {
  const baseStyle: CSSProperties = {
    flexShrink: 0,
    transition: props.collapseMode === 'width' ? 'width 0.2s ease-in-out' : 'none',
    boxSizing: 'border-box',
    overflow: 'visible',
    position: 'relative',
    ...props.style,
  }

  if (props.collapseMode === 'width') {
    baseStyle.width = `${props.collapsed ? props.collapsedWidth : props.width}px`
  }
  else {
    baseStyle.width = `${props.width}px`
  }
  return baseStyle
})

const contentWrapperStyle = computed<CSSProperties>(() => {
  const baseWrapperStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    transition: props.collapseMode === 'transform' ? 'transform 0.2s ease-in-out' : 'none',
  }

  if (props.collapseMode === 'transform' && props.collapsed) {
    if (props.position === 'left') {
      baseWrapperStyle.transform = 'translateX(-100%)'
    }
    else {
      baseWrapperStyle.transform = 'translateX(100%)'
    }
  }
  else {
    baseWrapperStyle.transform = 'translateX(0)'
  }
  return baseWrapperStyle
})
</script>

<template>
  <aside
    class="e-layout-sider"
    :style="siderContainerStyle"
    :class="[
      `e-layout-sider--position-${position}`,
      {
        'e-layout-sider--collapsed': collapsed,
        'e-layout-sider--bordered': bordered,
        [`e-layout-sider--mode-${collapseMode}`]: true,
      },
    ]"
  >
    <!-- 边框线 -->
    <div v-if="bordered" class="e-layout-sider__border" />

    <div class="e-layout-sider__inner">
      <!-- 内容容器 -->
      <div class="e-layout-sider__content-wrapper" :style="contentWrapperStyle">
        <slot />
      </div>

      <!-- 圆形按钮触发器 -->
      <div
        v-if="showTrigger === true || showTrigger === 'button'"
        class="e-layout-sider__toggle-button"
        @click="toggleCollapsed"
      >
        <el-icon class="toggle-icon">
          <component :is="triggerIcon" />
        </el-icon>
      </div>

      <!-- 条形触发器 -->
      <div v-else-if="showTrigger === 'bar'" class="e-layout-sider__toggle-bar" @click="toggleCollapsed">
        <div class="toggle-bar__top" />
        <div class="toggle-bar__bottom" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 基础样式 */
.e-layout-sider {
  height: 100%;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  transition:
    width 0.2s ease-in-out,
    background-color 0.3s,
    color 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* 右侧放置时内容左对齐 */
.e-layout-sider--position-right {
  justify-content: flex-start;
}

/* 边框线公共样式 */
.e-layout-sider__border {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--el-border-color, #dcdfe6);
  transition: background-color 0.3s;
}

/* 左侧放置时边框在右侧 */
.e-layout-sider--position-left.e-layout-sider--bordered .e-layout-sider__border {
  right: 0;
}

/* 右侧放置时边框在左侧 */
.e-layout-sider--position-right.e-layout-sider--bordered .e-layout-sider__border {
  left: 0;
}

/* 内部容器：允许触发器溢出 */
.e-layout-sider__inner {
  height: 100%;
  position: relative;
  flex: 1;
  overflow: visible;
}

/* 内容包装器：负责隐藏溢出内容（配合 transform 折叠模式） */
.e-layout-sider__content-wrapper {
  height: 100%;
  overflow: hidden;
}

/* 圆形按钮触发器 - Element Plus 标准尺寸 */
.e-layout-sider__toggle-button {
  position: absolute;
  top: 50%;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition:
    transform 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;
  transform: translateY(-50%);
}

.e-layout-sider__toggle-button .toggle-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}

.e-layout-sider__toggle-button:hover {
  background-color: var(--el-fill-color-light);
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.e-layout-sider__toggle-button:hover .toggle-icon {
  color: var(--el-color-primary);
}

/* 左侧布局圆形按钮位置 */
.e-layout-sider--position-left .e-layout-sider__toggle-button {
  right: 0;
  transform: translateX(50%) translateY(-50%);
}

/* 右侧布局圆形按钮位置 */
.e-layout-sider--position-right .e-layout-sider__toggle-button {
  left: 0;
  transform: translateX(-50%) translateY(-50%);
}

/* 条形触发器 - 优化版 */
.e-layout-sider__toggle-bar {
  position: absolute;
  top: 50%;
  width: 36px;
  height: 80px;
  cursor: pointer;
  z-index: 10;
  transform: translateY(-50%);
}

.e-layout-sider__toggle-bar .toggle-bar__top,
.e-layout-sider__toggle-bar .toggle-bar__bottom {
  position: absolute;
  width: 6px;
  height: 42px;
  border-radius: 3px;
  background-color: var(--el-text-color-secondary, #909399);
  transition:
    background-color 0.2s,
    transform 0.2s,
    opacity 0.2s;
  left: 15px;
}

.e-layout-sider__toggle-bar .toggle-bar__top {
  top: 0;
}

.e-layout-sider__toggle-bar .toggle-bar__bottom {
  bottom: 0;
}

.e-layout-sider__toggle-bar:hover .toggle-bar__top,
.e-layout-sider__toggle-bar:hover .toggle-bar__bottom {
  background-color: var(--el-color-primary, #409eff);
}

/* 左侧布局条形触发器位置 */
.e-layout-sider--position-left .e-layout-sider__toggle-bar {
  right: -30px;
}

/* 右侧布局条形触发器位置 */
.e-layout-sider--position-right .e-layout-sider__toggle-bar {
  left: -30px;
}

/* 左侧未折叠时，条形触发器悬浮动画：箭头指向左 */
.e-layout-sider--position-left:not(.e-layout-sider--collapsed) .e-layout-sider__toggle-bar:hover .toggle-bar__top {
  transform: rotate(14deg) scale(1.2) translateY(-2px);
}

.e-layout-sider--position-left:not(.e-layout-sider--collapsed) .e-layout-sider__toggle-bar:hover .toggle-bar__bottom {
  transform: rotate(-14deg) scale(1.2) translateY(2px);
}

/* 左侧折叠时，条形触发器悬浮动画：箭头指向右 */
.e-layout-sider--position-left.e-layout-sider--collapsed .e-layout-sider__toggle-bar:hover .toggle-bar__top {
  transform: rotate(-14deg) scale(1.2) translateY(-2px);
}

.e-layout-sider--position-left.e-layout-sider--collapsed .e-layout-sider__toggle-bar:hover .toggle-bar__bottom {
  transform: rotate(14deg) scale(1.2) translateY(2px);
}

/* 右侧未折叠时，条形触发器悬浮动画：箭头指向右 */
.e-layout-sider--position-right:not(.e-layout-sider--collapsed) .e-layout-sider__toggle-bar:hover .toggle-bar__top {
  transform: rotate(-14deg) scale(1.2) translateY(-2px);
}

.e-layout-sider--position-right:not(.e-layout-sider--collapsed) .e-layout-sider__toggle-bar:hover .toggle-bar__bottom {
  transform: rotate(14deg) scale(1.2) translateY(2px);
}

/* 右侧折叠时，条形触发器悬浮动画：箭头指向左 */
.e-layout-sider--position-right.e-layout-sider--collapsed .e-layout-sider__toggle-bar:hover .toggle-bar__top {
  transform: rotate(14deg) scale(1.2) translateY(-2px);
}

.e-layout-sider--position-right.e-layout-sider--collapsed .e-layout-sider__toggle-bar:hover .toggle-bar__bottom {
  transform: rotate(-14deg) scale(1.2) translateY(2px);
}
</style>
