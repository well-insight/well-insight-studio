<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

defineOptions({
  name: 'SvgIcon',
  inheritAttrs: false
})

const props = withDefaults(defineProps<SvgIconProps>(), {
  size: '1em',
  color: '',
  rotate: 0,
  title: '',
  disabled: false
})

// 定义 Emits 类型
const emit = defineEmits<{
  /** 图标点击事件（禁用状态下不触发） */
  click: [e: MouseEvent]
}>()

// 定义 Props 类型接口
interface SvgIconProps {
  /** 图标名称 */
  name?: string
  /** 图标尺寸 */
  size?: number | string
  /** 图标颜色 */
  color?: string
  /** 旋转角度 */
  rotate?: number
  /** 图标标题（ */
  title?: string
  /** 是否禁用点击交互 */
  disabled?: boolean
}

// 校验 Props
if (import.meta.env.DEV) {
  // 开发环境校验 name 非空
  if (props?.name?.trim() === '') {
    console.warn('[SvgIcon] name 属性不能为空字符串！')
  }
  // 开发环境校验 rotate 为有效数字
  if (Number.isNaN(props.rotate)) {
    console.warn('[SvgIcon] rotate 属性必须是有效数字！')
  }
}

// 统一处理尺寸格式
const computedSize = computed<string>(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

// 整合动态样式
const svgStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  // 自定义颜色
  if (props.color) style.color = props.color
  // 旋转角度
  if (props.rotate) style.transform = `rotate(${props.rotate}deg)`
  return style
})

// 处理点击事件
function handleClick(e: MouseEvent) {
  if (props.disabled) return
  emit('click', e)
}
</script>

<template>
  <svg
    v-if="name"
    class="svg-icon"
    :class="{ 'svg-icon--disabled': disabled }"
    :aria-hidden="!title"
    :aria-label="title || name"
    :width="computedSize"
    :height="computedSize"
    :style="svgStyle"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- 可访问性标题 -->
    <title v-if="title">{{ title }}</title>
    <!-- SVG 引用（核心逻辑） -->
    <use v-if="name.trim()" :href="`#icon-${name}`" />
    <!-- 容错占位（开发环境提示） -->
    <text v-else x="0" y="1em" font-size="0.8em" fill="#f56c6c">图标不存在</text>
  </svg>
</template>

<style scoped lang="scss">
// SCSS 变量
$svg-icon-default-color: currentColor;
$svg-icon-disabled-opacity: 0.5;
$svg-icon-hover-color: var(--el-color-primary);
$svg-icon-transition-duration: 0.2s;

// 基础样式
.svg-icon {
  vertical-align: -0.15em;
  fill: $svg-icon-default-color;
  overflow: hidden;
  cursor: pointer;
  // 过渡效果
  transition:
    color $svg-icon-transition-duration ease,
    opacity $svg-icon-transition-duration ease;

  // 禁用状态
  &--disabled {
    cursor: not-allowed;
    opacity: $svg-icon-disabled-opacity;
    pointer-events: none;
  }

  // 非禁用状态的 hover 效果
  &:not(&--disabled):hover {
    color: $svg-icon-hover-color;
  }
}
</style>
