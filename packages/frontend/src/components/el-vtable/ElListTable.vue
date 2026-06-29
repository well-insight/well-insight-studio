<script setup lang="ts">
import type { ListTableConstructorOptions } from '@visactor/vtable'
import type { Ref } from 'vue'
import { ListTable, themes } from '@visactor/vtable'
import { VTableVueAttributePlugin } from '@visactor/vue-vtable/es/components/custom/vtable-vue-attribute-plugin'
import { isArray } from '@visactor/vutils'
import { useDark } from '@vueuse/core'
import { merge } from 'lodash-es'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from 'vue'

import { buildElementPlusVTableThemePartial } from '@/utils/elVTableTheme'

// ────────────────────────────────────────────────────────────────────────
// Props 定义
// ────────────────────────────────────────────────────────────────────────
interface ElListTableProps {
  /** VTable 配置选项 */
  options?: ListTableConstructorOptions
  /** 表格宽度 */
  width?: number | string
  /** 表格高度 */
  height?: number | string
  /** 是否使用 Element Plus 风格的行高（默认 true） */
  elementSizing?: boolean
  /** 是否启用 Vue 自定义布局渲染（默认 true） */
  enableVueCustomLayout?: boolean
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ElListTableProps>(), {
  width: '100%',
  height: 400,
  elementSizing: true,
  enableVueCustomLayout: true,
})

// ────────────────────────────────────────────────────────────────────────
// 暴露给父组件的实例引用
// ────────────────────────────────────────────────────────────────────────
interface ElListTableExpose {
  /** 获取 VTable 实例 */
  vTableInstance: InstanceType<typeof ListTable> | null
}

// ────────────────────────────────────────────────────────────────────────
// 响应式引用
// ────────────────────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const listTableRef: Ref<InstanceType<typeof ListTable> | null> = shallowRef(null)
const resizeObserverRef = ref<ResizeObserver | null>(null)

// ────────────────────────────────────────────────────────────────────────
// 默认配置
// ────────────────────────────────────────────────────────────────────────
const defaultTableOptions: ListTableConstructorOptions = {
  columns: [],
  records: [],
  widthMode: 'adaptive',
  autoFillWidth: true,
  select: {
    disableSelect: true,
  },
}

// ────────────────────────────────────────────────────────────────────────
// 主题与暗黑模式
// ────────────────────────────────────────────────────────────────────────
const isDark = useDark()

/**
 * 合并 VTable 配置选项
 * 包含主题、自定义配置、默认值等
 */
const mergedOptions = computed((): ListTableConstructorOptions => {
  // 触发暗黑模式响应式更新
  void isDark.value

  const ep = buildElementPlusVTableThemePartial()
  const user = props.options
  const { theme: userThemeRaw, customConfig: userCustomConfig, ...userRest } = user

  // 处理用户传入的主题
  const userTheme
    = userThemeRaw && typeof userThemeRaw === 'object' ? userThemeRaw : {}

  // 合并主题：DEFAULT + Element Plus 风格 + 用户自定义
  const theme = themes.DEFAULT.extends(merge({}, ep, userTheme))

  // 处理自定义配置
  const customConfig = {
    ...userCustomConfig,
    ...(props.enableVueCustomLayout ? { createReactContainer: true as const } : {}),
  }

  // 合并基础配置
  const base: ListTableConstructorOptions = {
    ...defaultTableOptions,
    ...userRest,
    theme,
    customConfig,
  }

  // 应用 Element Plus 风格的行高
  if (props.elementSizing) {
    if (base.defaultRowHeight === undefined) {
      base.defaultRowHeight = 48
    }
    if (base.defaultHeaderRowHeight === undefined) {
      base.defaultHeaderRowHeight = 44
    }
  }

  return base
})

// ────────────────────────────────────────────────────────────────────────
// VTable 插件注册
// ────────────────────────────────────────────────────────────────────────
const instance = getCurrentInstance()

/**
 * 注册 VTable Vue 属性插件
 * 用于支持在 VTable 中渲染 Vue 组件
 */
watchEffect(() => {
  if (!props.enableVueCustomLayout)
    return

  // 触发 customConfig 的响应式更新
  void mergedOptions.value.customConfig?.createReactContainer

  const table = listTableRef.value
  const pluginService = table?.scenegraph?.stage?.pluginService
  if (!pluginService)
    return

  // 检查插件是否已注册，避免重复注册
  const exist = pluginService.findPluginsByName('VTableVueAttributePlugin')
  if (isArray(exist) && exist.length > 0)
    return

  // 注册插件
  pluginService.register(new VTableVueAttributePlugin(instance?.appContext))
})

// ────────────────────────────────────────────────────────────────────────
// 表格同步与初始化
// ────────────────────────────────────────────────────────────────────────
/**
 * 同步表格配置
 * - 如果表格已初始化，更新配置
 * - 如果未初始化，创建新实例
 */
function syncTable() {
  const el = containerRef.value
  if (!el)
    return

  const opts = mergedOptions.value

  if (listTableRef.value) {
    // 表格已存在，更新配置
    listTableRef.value.updateOption(opts)
    return
  }

  // 创建新表格实例
  try {
    listTableRef.value = new ListTable(el, opts)
  }
  catch (error) {
    console.error('[ElListTable] 创建 VTable 实例失败:', error)
  }
}

// ────────────────────────────────────────────────────────────────────────
// 生命周期钩子
// ────────────────────────────────────────────────────────────────────────
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      // 初始化表格
      syncTable()

      // 创建 ResizeObserver 监听容器尺寸变化
      const el = containerRef.value
      if (el) {
        resizeObserverRef.value = new ResizeObserver(() => {
          const table = listTableRef.value
          if (!table) {
            return
          }

          // 通知 VTable 重新计算尺寸并重绘
          // table.setCanvasSize(el.offsetWidth, el.offsetHeight)
          table.resize()
        })

        // 开始观察容器元素
        resizeObserverRef.value.observe(el)
      }
    }, 0)
  })
})

// 监听配置变化，自动同步表格
watch(mergedOptions, syncTable, { deep: true })

onBeforeUnmount(() => {
  // 断开 ResizeObserver 观察
  resizeObserverRef.value?.disconnect()
  resizeObserverRef.value = null

  // 释放 VTable 实例
  listTableRef.value?.release()
  listTableRef.value = null
})

defineExpose<ElListTableExpose>({
  get vTableInstance() {
    return listTableRef.value
  },
})
</script>

<template>
  <div :class="$style.root">
    <div
      ref="containerRef"
      v-bind="$attrs"
      :style="{
        width: typeof width === 'number' ? `${width}px` : String(width),
        height: typeof height === 'number' ? `${height}px` : String(height),
        position: 'relative',
      }"
    />
  </div>
</template>

<style module lang="scss">
.root {
  width: 100%;
  height: 100%;
  line-height: 0;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}
</style>
