<script setup lang="ts">
import type { AdaptiveDialogMode } from './types'
import { Close, CopyDocument, DArrowRight, FullScreen } from '@element-plus/icons-vue'
import { computed, watch } from 'vue'

export type { AdaptiveDialogMode }

const props = withDefaults(
  defineProps<{
    title?: string
    width?: string | number
    top?: string
    drawerSize?: string | number
    drawerDirection?: 'rtl' | 'ltr' | 'ttb' | 'btt'
    defaultMode?: AdaptiveDialogMode
    rememberMode?: boolean
    appendToBody?: boolean
    destroyOnClose?: boolean
    closeOnClickModal?: boolean
    showModeSwitch?: boolean
    shellClass?: string
    drawerModal?: boolean
    drawerLockScroll?: boolean
    appendTo?: string | HTMLElement
  }>(),
  {
    title: '',
    width: '50%',
    top: '',
    drawerSize: 'min(720px, 92vw)',
    drawerDirection: 'rtl',
    defaultMode: 'dialog',
    rememberMode: true,
    appendToBody: true,
    destroyOnClose: true,
    closeOnClickModal: false,
    showModeSwitch: true,
    shellClass: '',
    drawerModal: true,
    drawerLockScroll: true,
    appendTo: undefined,
  },
)

const visible = defineModel<boolean>({ required: true })
const mode = defineModel<AdaptiveDialogMode>('mode', { default: 'dialog' })

const shellClassList = computed(() => [
  'adaptive-dialog',
  `adaptive-dialog--${mode.value}`,
  props.shellClass,
].filter(Boolean))

const dialogFullscreen = computed(() => mode.value === 'fullscreen')

const normalizedWidth = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
)

const normalizedDrawerSize = computed(() =>
  typeof props.drawerSize === 'number' ? `${props.drawerSize}px` : props.drawerSize,
)

const modeButtons = [
  { mode: 'dialog' as const, icon: CopyDocument, label: '窗口模式' },
  { mode: 'fullscreen' as const, icon: FullScreen, label: '全屏' },
  { mode: 'drawer' as const, icon: DArrowRight, label: '侧边栏' },
]

function setMode(next: AdaptiveDialogMode) {
  if (mode.value !== next)
    mode.value = next
}

function close() {
  visible.value = false
}

watch(visible, (open) => {
  if (!open && !props.rememberMode)
    mode.value = props.defaultMode
})
</script>

<template>
  <el-dialog
    v-if="mode !== 'drawer'"
    v-model="visible"
    :width="normalizedWidth"
    :fullscreen="dialogFullscreen"
    :top="top"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    :class="shellClassList"
    modal-class="adaptive-dialog-modal"
  >
    <div class="adaptive-dialog__shell">
      <div class="adaptive-dialog__header">
        <div class="adaptive-dialog__title-wrap">
          <slot name="title">
            <span class="adaptive-dialog__title">{{ title }}</span>
          </slot>
        </div>
        <div class="adaptive-dialog__actions">
          <template v-if="showModeSwitch">
            <el-tooltip
              v-for="btn in modeButtons"
              :key="btn.mode"
              :content="btn.label"
              placement="bottom"
            >
              <el-button
                text
                class="adaptive-dialog__action"
                :class="{ 'is-active': mode === btn.mode }"
                :aria-label="btn.label"
                :aria-pressed="mode === btn.mode"
                @click="setMode(btn.mode)"
              >
                <el-icon :size="16">
                  <component :is="btn.icon" />
                </el-icon>
              </el-button>
            </el-tooltip>
          </template>
          <el-button
            text
            class="adaptive-dialog__action adaptive-dialog__close"
            aria-label="关闭"
            @click="close"
          >
            <el-icon :size="16">
              <Close />
            </el-icon>
          </el-button>
        </div>
      </div>

      <div class="adaptive-dialog__content" :class="{ 'adaptive-dialog__content__fullscreen': dialogFullscreen }">
        <slot />
      </div>

      <div v-if="$slots.footer" class="adaptive-dialog__footer">
        <slot name="footer" />
      </div>
    </div>
  </el-dialog>

  <el-drawer
    v-else
    v-model="visible"
    :size="normalizedDrawerSize"
    :direction="drawerDirection"
    :modal="drawerModal"
    :lock-scroll="drawerLockScroll"
    :append-to="appendTo"
    :append-to-body="appendTo ? false : appendToBody"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    :class="shellClassList"
    modal-class="adaptive-dialog-modal"
  >
    <div class="adaptive-dialog__shell adaptive-dialog__shell--drawer">
      <div class="adaptive-dialog__header">
        <div class="adaptive-dialog__title-wrap">
          <slot name="title">
            <span class="adaptive-dialog__title">{{ title }}</span>
          </slot>
        </div>
        <div class="adaptive-dialog__actions">
          <template v-if="showModeSwitch">
            <el-tooltip
              v-for="btn in modeButtons"
              :key="btn.mode"
              :content="btn.label"
              placement="bottom"
            >
              <el-button
                text
                class="adaptive-dialog__action"
                :class="{ 'is-active': mode === btn.mode }"
                :aria-label="btn.label"
                :aria-pressed="mode === btn.mode"
                @click="setMode(btn.mode)"
              >
                <el-icon :size="16">
                  <component :is="btn.icon" />
                </el-icon>
              </el-button>
            </el-tooltip>
          </template>
          <el-button
            text
            class="adaptive-dialog__action adaptive-dialog__close"
            aria-label="关闭"
            @click="close"
          >
            <el-icon :size="16">
              <Close />
            </el-icon>
          </el-button>
        </div>
      </div>

      <div class="adaptive-dialog__content" :class="{ 'adaptive-dialog__content__fullscreen': dialogFullscreen }">
        <slot />
      </div>

      <div v-if="$slots.footer" class="adaptive-dialog__footer">
        <slot name="footer" />
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.adaptive-dialog__shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.adaptive-dialog__shell--drawer {
  padding: 16px 0;
}

.adaptive-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 30px;
  padding: 0 16px 16px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.adaptive-dialog__title-wrap {
  min-width: 0;
  flex: 1;
}

.adaptive-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.25;
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

.adaptive-dialog__content {
  flex: 1;
  min-height: 40vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 20px;
}

.adaptive-dialog__content__fullscreen {
  height: 100%;
}

.adaptive-dialog__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 20px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  /* background: var(--el-fill-color-light, #fafbfc); */
}
</style>

<style>
.adaptive-dialog.el-dialog {
  max-width: 96vw;
  margin-bottom: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow);
}

.adaptive-dialog.el-dialog.is-fullscreen {
  max-width: none;
  border-radius: 0;
}

.adaptive-dialog.el-drawer {
  border-radius: 0;
  box-shadow: var(--el-box-shadow);
}

.adaptive-dialog .el-dialog__header,
.adaptive-dialog .el-drawer__header {
  display: none;
}

.adaptive-dialog .el-dialog__body,
.adaptive-dialog .el-drawer__body {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__body {
  overflow: auto;
  height: 100%;
}

.adaptive-dialog.el-drawer .el-drawer__body {
  flex: 1 1 0;
  height: 0;
}
</style>
