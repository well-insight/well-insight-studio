<script lang="tsx" setup>
import { useControlStore } from "@/stores/controlStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { EditTools } from "@/visual-editor/ui/workbench/edit-tools";
import RightAttributePanel from "@/visual-editor/ui/workbench/right-attribute-panel/RightAttributePanel.vue";
import { CloseBold, Plus } from "@element-plus/icons-vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, onUnmounted, ref } from "vue";
import MobileWrapper from "./MobileWrapper.vue";
import PcWrapper from "./PcWrapper.vue";

defineOptions({
  name: "SimulatorEditor",
});

const workspaceStore = useWorkspaceStore();

const { currentApp } = storeToRefs(workspaceStore);

const controlStore = useControlStore();
const { floatingSettingVisible } = storeToRefs(controlStore);

const { editScale } = storeToRefs(controlStore);

const scaleValue = computed({
  get() {
    return editScale.value * 100;
  },
  set(v: number) {
    editScale.value = v / 100;
  },
});


// const floatingPanelRef = ref<HTMLElement | null>(null);

// onClickOutside(floatingPanelRef, () => {
//   if (controlStore.floatingSettingVisible) {
//     controlStore.floatingSettingVisible = false;
//   }
// });

function changeScale(s: number) {
  editScale.value = s;
}

function triggerShowComponents() {
  controlStore.customComponentsVisible = !controlStore.customComponentsVisible;
}

onUnmounted(() => {
  workspaceStore.setCurrentApp(null);
  controlStore.floatingSettingVisible = false;
});
</script>

<template>
  <div class="simulator-container">
    <div class="h-[50px] w-full">
      <EditTools />
    </div>

    <div class="simulator-editor">
      <MobileWrapper v-if="currentApp?.clientType === 2" />
      <PcWrapper v-else :scale="editScale" @change-scale="changeScale" />

      <transition name="floating-setting-panel">
        <div v-if="floatingSettingVisible" ref="floatingPanelRef" class="floating-setting-panel">
          <div class="floating-setting-panel__header">
            <span>详细配置</span>
            <el-button text circle @click="controlStore.floatingSettingVisible = false">
              <el-icon><CloseBold /></el-icon>
            </el-button>
          </div>
          <div class="floating-setting-panel__body">
            <RightAttributePanel />
          </div>
        </div>
      </transition>
    </div>

    <!-- 添加按钮 -->
    <el-button
      class="absolute right-6 bottom-[75px] h-[60px]! w-[60px]!"
      type="primary"
      circle
      @click="triggerShowComponents"
    >
      <el-icon size="30px">
        <Plus />
      </el-icon>
    </el-button>

    <!-- 底部控制栏 -->
    <div class="flex h-[50px] w-full items-center justify-end px-4">
      <el-space>
        <el-slider v-model="scaleValue" :min="10" class="w-[300px]" show-input />
      </el-space>
    </div>
  </div>
</template>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>

<style lang="scss" scoped>
@import "./func.scss";

.simulator-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
}

.simulator-editor {
  width: 100%;
  overflow: hidden auto;
  background: #fafafa;
  border-radius: 5px;
  box-sizing: border-box;
  background-clip: content-box;
  contain: layout;
  flex: 1;
  height: 0;
  display: flex;
  justify-content: center;
  position: relatuve;
  // padding: 32px 0 0 0;

  &::-webkit-scrollbar {
    width: 0;
  }

  .simulator-editor-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  &-content {
    background-color: var(--el-bg-color);
    // transform: translate(0);
    box-shadow: 0 8px 12px #ebedf0;
    margin-top: 32px;
    border-radius: var(--el-border-radius-base);
    position: absolute;
    top: 50%;
    left: 50%;
    // transform: translate(-50%, -50%);
  }
}

.list-group-item {
  position: relative;
  // padding: 3px;
  border: 2px solid var(--el-bg-color);
  cursor: move;

  > div {
    position: relative;
  }

  &.focus {
    @include showComponentBorder;
  }

  &.drag::after {
    display: none;
  }

  &:not(.has-slot) {
    content: "";
  }

  &.focusWithChild {
    @include showContainerBorder;
  }

  i {
    cursor: pointer;
  }

  &:hover {
    // 边框
    @include showComponentBorder;

    &::after {
      // 标签
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(left);
    }
  }
}
</style>

<style lang="scss" scoped>
.floating-setting-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 380px;
  height: calc(100% - 32px);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgb(0 0 0 / 12%);
  overflow: hidden;
}

.floating-setting-panel__header {
  height: 46px;
  flex-shrink: 0;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-blank);
  font-size: 13px;
  font-weight: 600;
}

.floating-setting-panel__body {
  flex: 1;
  min-height: 0;
}

.floating-setting-panel-enter-active,
.floating-setting-panel-leave-active {
  transition: all 0.2s ease;
}

.floating-setting-panel-enter-from,
.floating-setting-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
