<script setup lang="ts">
import type { AdaptiveDialogMode } from "./types";
import { Close, CopyDocument, FullScreen, Menu } from "@element-plus/icons-vue";
import { computed, nextTick, watch } from "vue";

const visible = defineModel<boolean>({ required: true });
const mode = defineModel<AdaptiveDialogMode>("mode", { default: "dialog" });

const props = withDefaults(
  defineProps<{
    title?: string;
    width?: string | number;
    top?: string;
    drawerSize?: string | number;
    drawerDirection?: "rtl" | "ltr" | "ttb" | "btt";
    defaultMode?: AdaptiveDialogMode;
    appendToBody?: boolean;
    destroyOnClose?: boolean;
    closeOnClickModal?: boolean;
    showModeSwitch?: boolean;
    /** 附加到 dialog / drawer 根节点的 class */
    shellClass?: string;
    /** 窗口模式下 dialog body 固定高度，如 66vh */
    dialogBodyHeight?: string;
  }>(),
  {
    title: "",
    width: "50%",
    top: "4vh",
    drawerSize: "min(720px, 92vw)",
    drawerDirection: "rtl",
    defaultMode: "dialog",
    appendToBody: true,
    destroyOnClose: true,
    closeOnClickModal: false,
    showModeSwitch: true,
    shellClass: "",
    dialogBodyHeight: "",
  },
);

const shellClassList = computed(() => {
  const list = [
    "adaptive-dialog",
    `adaptive-dialog--${mode.value}`,
    props.shellClass,
  ];
  if (props.dialogBodyHeight && mode.value === "dialog") {
    list.push("adaptive-dialog--fixed-body");
  }
  return list;
});

const dialogShellStyle = computed(() => {
  if (mode.value !== "dialog" || !props.dialogBodyHeight) {
    return undefined;
  }
  return {
    "--adaptive-dialog-shell-body-height": props.dialogBodyHeight,
  };
});

const dialogFullscreen = computed(() => mode.value === "fullscreen");

const bodyStyle = computed(() => {
  if (mode.value === "fullscreen" || mode.value === "drawer") {
    return {
      "--adaptive-body-height": "100%",
      "--adaptive-body-min-height": "0",
      "--adaptive-layout-overflow": "hidden",
      "--chart-config-max-height": "none",
    } as Record<string, string>;
  }
  return {
    "--adaptive-body-height": "100%",
    "--adaptive-body-min-height": "0",
    "--adaptive-layout-overflow": "hidden",
    "--chart-config-max-height": "none",
  } as Record<string, string>;
});

function setMode(next: AdaptiveDialogMode) {
  if (mode.value === next) {
    return;
  }
  const wasOpen = visible.value;
  mode.value = next;
  if (wasOpen) {
    void nextTick(() => {
      visible.value = true;
    });
  }
}

function close() {
  visible.value = false;
}

watch(visible, (open) => {
  if (!open) {
    mode.value = props.defaultMode;
  }
});
</script>

<template>
  <el-dialog
    v-if="mode !== 'drawer'"
    v-model="visible"
    :width="width"
    :top="top"
    :fullscreen="dialogFullscreen"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    :class="shellClassList"
    :style="dialogShellStyle"
    modal-class="adaptive-dialog-modal"
  >
    <template #header>
      <div class="adaptive-dialog__header">
        <div class="adaptive-dialog__title-wrap">
          <slot name="title">
            <span class="adaptive-dialog__title">{{ title }}</span>
          </slot>
        </div>
        <div class="adaptive-dialog__actions">
          <template v-if="showModeSwitch">
            <el-tooltip content="窗口模式" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action"
                :class="{ 'is-active': mode === 'dialog' }"
                @click="setMode('dialog')"
              >
                <el-icon :size="16"><CopyDocument /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="全屏" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action"
                :class="{ 'is-active': mode === 'fullscreen' }"
                @click="setMode('fullscreen')"
              >
                <el-icon :size="16"><FullScreen /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="侧边栏" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action"
                :class="{ 'is-active': mode === 'drawer' }"
                @click="setMode('drawer')"
              >
                <el-icon :size="16"><Menu /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
          <el-button text class="adaptive-dialog__action adaptive-dialog__close" @click="close">
            <el-icon :size="16"><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="adaptive-dialog__body" :style="bodyStyle">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <div class="adaptive-dialog__footer">
        <slot name="footer" />
      </div>
    </template>
  </el-dialog>

  <el-drawer
    v-else
    v-model="visible"
    :size="drawerSize"
    :direction="drawerDirection"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    :class="shellClassList"
    modal-class="adaptive-dialog-modal"
  >
    <template #header>
      <div class="adaptive-dialog__header">
        <div class="adaptive-dialog__title-wrap">
          <slot name="title">
            <span class="adaptive-dialog__title">{{ title }}</span>
          </slot>
        </div>
        <div class="adaptive-dialog__actions">
          <template v-if="showModeSwitch">
            <el-tooltip content="窗口模式" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action"
                @click="setMode('dialog')"
              >
                <el-icon :size="16"><CopyDocument /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="全屏" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action"
                @click="setMode('fullscreen')"
              >
                <el-icon :size="16"><FullScreen /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="侧边栏" placement="bottom">
              <el-button
                text
                class="adaptive-dialog__action is-active"
                @click="setMode('drawer')"
              >
                <el-icon :size="16"><Menu /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
          <el-button text class="adaptive-dialog__action adaptive-dialog__close" @click="close">
            <el-icon :size="16"><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="adaptive-dialog__container adaptive-dialog__container--drawer">
      <div class="adaptive-dialog__body" :style="bodyStyle">
        <slot />
      </div>
      <div v-if="$slots.footer" class="adaptive-dialog__footer">
        <slot name="footer" />
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.adaptive-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 28px;
}

.adaptive-dialog__title-wrap {
  min-width: 0;
  flex: 1;
}

.adaptive-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.adaptive-dialog__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.adaptive-dialog__action {
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-text-color-secondary);
}

.adaptive-dialog__action:hover,
.adaptive-dialog__action.is-active {
  color: var(--el-color-primary);
}

.adaptive-dialog__close:hover {
  color: var(--el-color-danger);
}

.adaptive-dialog__container {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.adaptive-dialog__container--drawer {
  height: 100%;
}

.adaptive-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<style>
.adaptive-dialog.el-dialog {
  max-width: 96vw;
  margin-bottom: 0;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog.el-dialog.is-fullscreen {
  border-radius: 0;
  max-width: none;
  display: flex !important;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  margin: 0;
}

.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__header {
  flex-shrink: 0;
}

.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__body {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__footer {
  flex-shrink: 0;
  margin-top: 0;
}

.adaptive-dialog.is-fullscreen .adaptive-dialog__body {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog .el-dialog__header {
  padding: 18px 24px 14px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.adaptive-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  overflow: hidden;
}

.adaptive-dialog.adaptive-dialog--fixed-body:not(.is-fullscreen) .el-dialog__body {
  height: var(--adaptive-dialog-shell-body-height);
  min-height: var(--adaptive-dialog-shell-body-height);
  max-height: var(--adaptive-dialog-shell-body-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.adaptive-dialog.adaptive-dialog--fixed-body:not(.is-fullscreen) .adaptive-dialog__body {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.adaptive-dialog.is-fullscreen .el-dialog__body {
  padding: 16px 20px 20px;
  max-height: none;
}

.adaptive-dialog .el-dialog__footer {
  padding: 12px 24px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fafbfc;
}

.adaptive-dialog.el-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.adaptive-dialog.el-drawer .el-drawer__header {
  flex-shrink: 0;
}

.adaptive-dialog .el-drawer__header {
  padding: 18px 20px 14px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.adaptive-dialog .el-drawer__body {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  padding: 16px 20px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog--drawer .adaptive-dialog__container {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
}

.adaptive-dialog--drawer .adaptive-dialog__body {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.adaptive-dialog--drawer .adaptive-dialog__footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fafbfc;
}
</style>
