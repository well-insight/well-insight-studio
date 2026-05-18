<script lang="ts" setup>
import type { ScrollbarDirection } from "element-plus";

import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import { cloneDeep, isString } from "lodash-es";
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
  <div
    :class="$style['component-list-container']"
    class="flex flex-col items-center justify-center gap-[24px] rounded-[24px] bg-[var(--el-bg-color)] px-2 py-3"
  >
    <el-popover
      v-for="(e, i) in widgets"
      trigger="hover"
      :key="i"
      placement="right"
      transition="el-zoom-in-left"
    >
      <template #reference>
        <el-button text class="h-[40px] w-[40px] p-[6px]">
          <svg-icon :size="18" :name="e.icon"></svg-icon>
        </el-button>
      </template>

      <div :class="$style['popover-content']" class="max-h-[400px] w-full">
        <el-scrollbar>
          <template v-for="(w, i) in e.widgets" :key="i">
            <el-tooltip v-if="w?.description" :content="w?.description" placement="right">
              <div
                :class="$style['popover-item']"
                class="flex cursor-pointer items-center px-[12px] py-[6px] hover:bg-[var(--el-fill-color-light)] hover:text-[var(--el-color-primary)]"
              >
                <template v-if="isString(w.icon)">
                  <svg-icon class="mr-2" :size="18" :name="w.icon"></svg-icon>
                </template>
                <template v-else>
                  <component class="mr-2" :is="w.icon"></component>
                </template>
                <span>{{ w.label }}</span>
              </div>
            </el-tooltip>
            <template v-else>
              <div
                :class="$style['popover-item']"
                class="flex cursor-pointer items-center px-[12px] py-[6px] hover:bg-[var(--el-fill-color-light)] hover:text-[var(--el-color-primary)]"
              >
                <template v-if="isString(w.icon)">
                  <svg-icon class="mr-2" :size="18" :name="w.icon"></svg-icon>
                </template>
                <template v-else>
                  <component class="mr-2" :is="w.icon"></component>
                </template>
                <span>{{ w.label }}</span>
              </div>
            </template>
          </template>
        </el-scrollbar>
      </div>
    </el-popover>
  </div>
</template>

<style lang="scss" module>
.component-list-container {
  box-shadow: var(--el-box-shadow-light);
  :global {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
