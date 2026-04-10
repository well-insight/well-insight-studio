<script setup lang="ts">
import type { ListTableConstructorOptions } from "@visactor/vtable";
import { ListTable, themes } from "@visactor/vtable";
import { VTableVueAttributePlugin } from "@visactor/vue-vtable/es/components/custom/vtable-vue-attribute-plugin";
import { isArray } from "@visactor/vutils";
import { useDark } from "@vueuse/core";
import { merge } from "lodash-es";
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from "vue";

import { buildElementPlusVTableThemePartial } from "@/utils/elVTableTheme";

const props = withDefaults(
  defineProps<{
    options: ListTableConstructorOptions;
    width?: number | string;
    height?: number | string;
    /** When true (default), row/header heights approximate el-table default size. */
    elementSizing?: boolean;
    /**
     * 为 true（默认）时启用列 `customLayout` 内 `vue: { element: VNode }` 的渲染（注册 VTable Vue DOM 插件）。
     * 纯文本表格可设为 false 略少开销。
     */
    enableVueCustomLayout?: boolean;
  }>(),
  {
    width: "100%",
    height: 400,
    elementSizing: true,
    enableVueCustomLayout: true,
  },
);

defineOptions({
  inheritAttrs: false,
});

const containerRef = ref<HTMLElement | null>(null);
const listTableRef = shallowRef<InstanceType<typeof ListTable> | null>(null);

const defaultTableOptions: ListTableConstructorOptions = {
  columns: [],
  records: [],
  widthMode: "adaptive",
  autoFillWidth: true,
  select: {
    disableSelect: true,
  }
};

defineExpose({
  get vTableInstance() {
    return listTableRef.value;
  },
});

const isDark = useDark();

const mergedOptions = computed((): ListTableConstructorOptions => {
  void isDark.value;
  const ep = buildElementPlusVTableThemePartial();
  const user = props.options;
  const { theme: userThemeRaw, customConfig: userCustomConfig, ...userRest } = user;
  const userTheme = userThemeRaw && typeof userThemeRaw === "object" ? userThemeRaw : {};
  const theme = themes.DEFAULT.extends(merge({}, ep, userTheme));

  const customConfig = {
    ...userCustomConfig,
    ...(props.enableVueCustomLayout ? { createReactContainer: true as const } : {}),
  };

  const base: ListTableConstructorOptions = {
    ...defaultTableOptions,
    ...userRest,
    theme,
    customConfig,
  };

  if (props.elementSizing) {
    if (base.defaultRowHeight === undefined) base.defaultRowHeight = 48;
    if (base.defaultHeaderRowHeight === undefined) base.defaultHeaderRowHeight = 44;
  }

  return base;
});

const instance = getCurrentInstance();

watchEffect(() => {
  if (!props.enableVueCustomLayout) return;
  void mergedOptions.value.customConfig?.createReactContainer;
  const table = listTableRef.value;
  const pluginService = table?.scenegraph?.stage?.pluginService;
  if (!pluginService) return;
  const exist = pluginService.findPluginsByName("VTableVueAttributePlugin");
  if (isArray(exist) && exist.length > 0) return;
  pluginService.register(new VTableVueAttributePlugin(instance?.appContext));
});

function syncTable() {
  const el = containerRef.value;
  if (!el) return;

  const opts = mergedOptions.value;
  if (listTableRef.value) {
    listTableRef.value.updateOption(opts);
    return;
  }
  listTableRef.value = new ListTable(el, opts);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  syncTable();
  const el = containerRef.value;
  if (el) {
    resizeObserver = new ResizeObserver(() => {
      const table = listTableRef.value;
      if (!table) return;
      // 容器尺寸变化时通知 VTable 重新测量并重绘
      table.setCanvasSize(el.offsetWidth, el.offsetHeight);
    });
    // 观察容器本身：width:100% 时父级变化会直接反映到它身上
    resizeObserver.observe(el);
  }
});

watch(mergedOptions, syncTable, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  listTableRef.value?.release();
  listTableRef.value = null;
});
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
