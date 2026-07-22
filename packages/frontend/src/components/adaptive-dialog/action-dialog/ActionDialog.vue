<script setup lang="ts">
import { CloseBold, Select } from '@element-plus/icons-vue'
import { ElScrollbar } from 'element-plus'
import { Maximize, Minimize } from 'lucide-vue-next'
import { computed, getCurrentInstance, ref, useSlots } from 'vue'
import SActionButton from '@/components/action-button'
import ElDialog from './plugins/dialog/src/dialog.vue'

defineOptions({ name: 'SActionDialog' })

const props = withDefaults(
  defineProps<{
    hasFullscreen?: boolean
    title?: string
    buttons?: ButtonType[]
    okText?: string
    cancelText?: string
    width?: string | number
    okButtonProps?: ButtonOptions
    cancelButtonProps?: ButtonOptions
    isDefaultFullscreen?: boolean
    /**
     * 是否使用弹框中的滚动条
     */
    contentScrollBar?: boolean
  }>(),
  {
    buttons: () => ['ok', 'cancel'],
    width: '70%',
    hasFullscreen: true,
    isDefaultFullscreen: false,
    contentScrollBar: true,
  },
)

const emits = defineEmits([
  'update:modelValue',
  'cancel',
  'ok',
  'open',
  'close',
  'closed',
])

const instance = getCurrentInstance()

type ButtonType = 'ok' | 'cancel'

interface ButtonOptions {
  disabled: boolean
}

const isFullscreen = ref(false)

const hasOkButton = computed(() => {
  return props.buttons.includes('ok')
})

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

const hasCancelButton = computed(() => {
  return props.buttons.includes('cancel')
})

const okText = computed(() => {
  return props.okText || '确定'
})

const cancelText = computed(() => {
  return props.cancelText || '取消'
})

const slots: any = useSlots()

function onOpen() {
  // 是否默认最大化
  // debugger
  if (props.isDefaultFullscreen) {
    isFullscreen.value = true
  }
  emits('open')
}

// 判断是否存在名为 "name" 的插槽
// const hasHeaderSlot = computed(() => !!slots.header);

const hasFooterSlot = computed(() => !!slots.footer)

function onClose() {
  doClose()
  emits('close')
}

function doClose() {
  emits('update:modelValue', false)
}

function onClosed() {
  isFullscreen.value = false
  emits('closed')
}

const isLoading = ref(false)

async function onCancel() {
  // 如果还在提交数据，就不让点击cancel按钮了
  if (isLoading.value) {
    return
  }
  doClose()
  emits('cancel')
  return true
}

async function onAction(): Promise<boolean> {
  const handler = instance?.vnode?.props?.onOk

  if (!handler)
    return false

  isLoading.value = true

  try {
    // 执行事件回调
    const result = handler()

    if (result instanceof Promise) {
      await result
    }

    // 如果正常执行，就关闭dialog
    // doClose();
  }
  catch (err) {
    console.error('❌ 事件执行出错：', err)
  }

  isLoading.value = false

  return true
}

function handleBeforeClose(done) {
  // 检测图片预览组件是否存在（开启状态）
  const previewWrapper = document.querySelector('#s-img-preview-wrap')
  if (previewWrapper) {
    // 图片预览开启中，阻止弹窗关闭
    return
  }
  // 图片预览已关闭，允许弹窗关闭
  done()
}
</script>

<template>
  <ElDialog
    class="s-action-dialog"
    destroy-on-close
    :width="props.width"
    :draggable="true"
    v-bind="$attrs"
    align-center
    @close="onClose"
    :fullscreen="isFullscreen"
    @closed="onClosed"
    transition="dialog-scale"
    :show-close="false"
    :before-close="handleBeforeClose"
    @open="onOpen"
  >
    <template v-if="contentScrollBar">
      <ElScrollbar

        class="s-action-dialog-content"
        always
        :max-height="isFullscreen ? 'none' : 'calc(100vh - 200px)'"
        :wrap-style="{ width: 'calc(100% - 10px)' }"
      >
        <slot />
      </ElScrollbar>
    </template>

    <template v-else>
      <slot />
    </template>

    <template #header-right>
      <SActionButton
        v-if="hasFullscreen"
        class="dialog-tool-button"
        link
        :icon="isFullscreen ? Minimize : Maximize"
        @action="toggleFullscreen"
      />

      <SActionButton
        class="dialog-tool-button"
        link
        :icon="CloseBold"
        @action="doClose"
      />
    </template>

    <template #header>
      <div class="s-action-dialog-header">
        <div class="main">
          {{ props.title }}
          <slot name="header" />
        </div>
      </div>
    </template>

    <template v-if="hasFooterSlot" #footer>
      <slot name="footer" />
    </template>
    <template v-else #footer>
      <span class="dialog-footer">
        <SActionButton
          v-if="hasCancelButton"
          v-bind="cancelButtonProps"
          :icon="CloseBold"
          @action="onCancel"
        >{{ cancelText }}</SActionButton>
        <slot name="footer-mid" />
        <SActionButton
          v-if="hasOkButton"
          v-bind="okButtonProps"
          :icon="Select"
          type="primary"
          @action="onAction"
        >
          {{ okText }}
        </SActionButton>
      </span>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
:global(.s-action-dialog.is-dragging) {
  border: 2px dashed var(--el-color-primary);
  opacity: 0.65;
}

/* Scale Animation */
:global(.dialog-scale-enter-active),
:global(.dialog-scale-leave-active),
:global(.dialog-scale-enter-active .el-dialog),
:global(.dialog-scale-leave-active .el-dialog) {
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

:global(.dialog-scale-enter-from),
:global(.dialog-scale-leave-to) {
  opacity: 0;
}

:global(.dialog-scale-enter-from .el-dialog),
:global(.dialog-scale-leave-to .el-dialog) {
  transform: scale(0.5);
  opacity: 0;
}

.s-action-dialog-header {
  display: flex;
  flex-direction: row;
  .main {
    flex: 1;
    font-size: 18px;
    color: #303133;
  }
  .end {
    margin-left: auto;
  }
}

:global(.s-action-dialog .el-dialog__body) {
  flex: 1;
  overflow: hidden;
}

:global(.s-action-dialog .el-dialog__footer) {
  padding: 15px 0 0 0;
}

:global(.s-action-dialog .el-dialog__header) {
  display: flex;
}

:global(.s-action-dialog .el-dialog__header .s-action-dialog-header-right-container) {
  margin-left: auto;
}

:global(.s-action-dialog) {
  display: flex;
  flex-direction: column;
}

.s-action-dialog {
  display: flex;
  .dialog-tool-button {
    margin-left: 0px;
  }

  &.is-fullscreen {
    .s-action-dialog-content {
      max-height: none;
      overflow: auto;
    }
  }

  .s-action-dialog-content {
    overflow: auto;
    height: 100%;
    // min-height: 100px;
  }
}
</style>
