<script lang="ts" setup>
import { Close } from '@element-plus/icons-vue'
import { SvgIcon } from '@/components/svg-icon'
import { PageSetting } from '../../right-attribute-panel/components/page-setting/pageSetting'

const props = withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false,
})

const emits = defineEmits<{
  close: []
}>()
</script>

<template>
  <div :class="[$style.panel, props.embedded && $style.panelEmbedded]">
    <div v-if="!props.embedded" :class="$style.header">
      <div :class="$style.headerMain">
        <SvgIcon name="page-setting" :size="16" />
        <span>页面配置</span>
      </div>
      <div :class="$style.headerActions">
        <el-tooltip content="关闭" placement="bottom">
          <el-button text size="small" :icon="Close" aria-label="关闭" @click.stop="emits('close')" />
        </el-tooltip>
      </div>
    </div>

    <el-scrollbar :class="[$style.scrollBody, props.embedded && $style.scrollBodyEmbedded]">
      <div :class="$style.cardList">
        <PageSetting />
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" module>
.panel {
  width: 340px;
  background: var(--el-bg-color-overlay);
  border-radius: var(--el-popover-border-radius, 12px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
}

.panelEmbedded {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 44px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.headerMain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--el-color-primary);
    margin-right: 2px;
    flex-shrink: 0;
  }
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;

  :global(.el-button) {
    width: 28px;
    height: 28px;
    min-width: 28px;
    padding: 0;
    border-radius: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.scrollBody {
  padding: 12px 14px 4px;
  width: 100%;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }
}

.scrollBodyEmbedded {
  height: 100%;
  max-height: none;
  padding: 11px 14px 16px;

  :global(.el-scrollbar__wrap) {
    max-height: none;
  }
}

.cardList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 10px;
}
</style>

<style lang="scss">
.page-setting-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 0 10px;
}

.page-setting-card {
  background: transparent;

  &__border {
    padding: 0;
  }
}

.page-setting-form {
  .el-form-item {
    margin-bottom: 12px;
    align-items: center;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-form-item__label {
    padding-right: 10px;
    font-size: 12px;
    font-weight: 500;
    line-height: 32px;
    color: var(--el-form-label-color);
  }

  .el-form-item__content {
    min-width: 0;
  }

  .el-input,
  .el-select {
    width: 100%;
  }

  .el-input__wrapper,
  .el-select__wrapper,
  .el-textarea__inner {
    min-height: 32px;
    border-radius: 7px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
    transition:
      box-shadow 0.3s ease,
      background 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-border-color-dark) inset;
    }

    &:focus-within {
      box-shadow:
        0 0 0 1px var(--el-color-primary) inset,
        0 0 0 3px var(--el-color-primary-light-8);
    }
  }

  .el-color-picker {
    height: 32px;
  }

  .el-switch {
    --el-switch-on-color: var(--el-color-primary);
  }
}
</style>
