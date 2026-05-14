<script lang="ts" setup>
import type { ScrollbarDirection } from "element-plus";

import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { cloneDeep } from "lodash-es";
import { computed, ref } from "vue";
import DraggableTransitionGroup from "@/visual-editor/ui/canvas/simulator-editor/DraggableTransitionGroup.vue";
import { createNewBlock } from "@/visual-editor/visual-editor.utils";
import { visualConfig } from "@/visual.config";
import { SvgIcon } from "@/components/svg-icon";

const activeComp = ref("基础组件");

const widgets = computed(() => {
  const { baseWidgets, containerComponents, formWidgets } = visualConfig.componentModules;
  return [
    {
      title: "基础组件",
      icon: "component-base",
      widgets: baseWidgets,
    },
    {
      title: "表单组件",
      icon: "component-form",
      widgets: formWidgets,
    },
    {
      title: "图表组件",
      icon: "component-chart",
      widgets: [],
    },
    {
      title: "容器组件",
      icon: "component-content",
      widgets: containerComponents,
    },
  ];
});

const currentCompIndex = computed(() =>
  widgets.value?.findIndex((e) => e?.title === activeComp.value),
);

function dragChange(evt: Event) {
  console.log("onChange:", evt);
}
// 克隆组件
function cloneDog(comp: VisualEditorComponent) {
  console.log("当前拖拽的组件：", comp);
  const newComp = cloneDeep(comp);
  return createNewBlock(newComp);
}
</script>

<template>
  <div class="flex flex-col items-center justify-center bg-[var(--el-bg-color)]">
    <el-button text v-for="(e, i) in widgets" :key="i" :label="e.title">
      <svg-icon :name="e.icon"></svg-icon>
    </el-button>
  </div>
</template>

<style lang="scss" module></style>
