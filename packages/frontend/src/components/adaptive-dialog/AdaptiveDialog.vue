<script setup lang="ts">
import type { AdaptiveDialogMode } from './types'
import { Close, CopyDocument, FullScreen, DArrowRight } from '@element-plus/icons-vue'
import { computed, watch } from 'vue'

// ==================== 类型导出 ====================
export type { AdaptiveDialogMode }

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    title?: string
    width?: string | number
    /** 自定义距顶部距离，不传则使用 el-dialog 默认值 */
    top?: string
    drawerSize?: string | number
    drawerDirection?: 'rtl' | 'ltr' | 'ttb' | 'btt'
    defaultMode?: AdaptiveDialogMode
    /** 关闭后是否记住当前模式，若为 false 则重置为 defaultMode */
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

// ==================== Model ====================
const visible = defineModel<boolean>({ required: true })
const mode = defineModel<AdaptiveDialogMode>('mode', { default: 'dialog' })

// ==================== Computed ====================
const shellClassList = computed(() => {
  const list = [
    'adaptive-dialog',
    `adaptive-dialog--${mode.value}`,
    props.shellClass,
  ]
  return list.filter(Boolean)
})

const dialogFullscreen = computed(() => mode.value === 'fullscreen')

// 统一的 body 样式（所有模式相同）
const bodyStyle = {
  '--adaptive-body-height': '100%',
  '--adaptive-body-min-height': '0',
  '--adaptive-layout-overflow': 'auto',
  '--chart-config-max-height': 'none',
} as Record<string, string>

// 单位转换
const normalizedWidth = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
)
const normalizedDrawerSize = computed(() =>
  typeof props.drawerSize === 'number' ? `${props.drawerSize}px` : props.drawerSize,
)

// 模式切换按钮配置
const modeButtons = [
  { mode: 'dialog' as const, icon: CopyDocument, label: '窗口模式' },
  { mode: 'fullscreen' as const, icon: FullScreen, label: '全屏' },
  { mode: 'drawer' as const, icon: DArrowRight, label: '侧边栏' },
]

// ==================== Methods ====================
function setMode(next: AdaptiveDialogMode) {
  if (mode.value === next) return
  mode.value = next
}

function close() {
  visible.value = false
}

// 关闭后是否重置模式
watch(visible, (open) => {
  if (!open && !props.rememberMode) {
    mode.value = props.defaultMode
  }
})
</script>

<template>
  <!-- ==================== Dialog 模式 ==================== -->
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
    <template #header>
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

  <!-- ==================== Drawer 模式 ==================== -->
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
    <template #header>
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

<!-- ==================== Scoped Styles ==================== -->
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

<!-- ==================== Global Styles (覆盖 Element Plus) ==================== -->
<style>
/* ----- Dialog 基础样式 ----- */
.adaptive-dialog.el-dialog {
  max-width: 96vw;
  margin-bottom: 0;
  border-radius: 12px;
  overflow: hidden;
}

/* 全屏时：header靠顶、footer靠底、body填满剩余空间 */
.adaptive-dialog.el-dialog.is-fullscreen {
  max-width: none;
  border-radius: 0;
  display: flex !important;
  flex-direction: column;
  height: 100% !important;
}
.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__header {
  flex-shrink: 0;
}
.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__body {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.adaptive-dialog.el-dialog.is-fullscreen .adaptive-dialog__body {
  overflow: auto;
}
.adaptive-dialog.el-dialog.is-fullscreen .el-dialog__footer {
  flex-shrink: 0;
  margin-top: 0;
}

/* Dialog 头部/身体/底部 */
.adaptive-dialog .el-dialog__header {
  padding: 14px 24px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.adaptive-dialog .el-dialog__body {
  padding: 16px 20px;
}
.adaptive-dialog .el-dialog__footer {
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light, #fafbfc);
}

/* ----- Drawer 样式 ----- */
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
  background: var(--el-fill-color-light, #fafbfc);
}
</style>