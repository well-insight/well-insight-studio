<script lang="ts" setup>
import { Close, Expand, Fold } from '@element-plus/icons-vue'
import { ref } from 'vue'
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

const pageSettingRef = ref<any>(null)

function expandAll() {
  pageSettingRef.value?.expandAll()
}

function collapseAll() {
  pageSettingRef.value?.collapseAll()
}
</script>

<template>
  <div :class="[$style.panel, props.embedded && $style.panelEmbedded]">
    <div v-if="!props.embedded" :class="$style.header">
      <div :class="$style.headerMain">
        <SvgIcon name="page-setting" :size="16" />
        <span>页面配置</span>
      </div>
      <div :class="$style.headerActions">
        <el-tooltip content="展开全部" placement="bottom">
          <el-button text size="small" :icon="Expand" @click="expandAll" />
        </el-tooltip>
        <el-tooltip content="收起全部" placement="bottom">
          <el-button text size="small" :icon="Fold" @click="collapseAll" />
        </el-tooltip>
        <el-tooltip content="关闭" placement="bottom">
          <el-button text size="small" :icon="Close" aria-label="关闭" @click.stop="emits('close')" />
        </el-tooltip>
      </div>
    </div>

    <el-scrollbar :class="[$style.scrollBody, props.embedded && $style.scrollBodyEmbedded]">
      <div :class="$style.cardList">
        <PageSetting ref="pageSettingRef" />
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
  padding: 12px 14px 14px;

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
  gap: 12px;
  padding: 2px 0 12px;
}

.page-setting-card {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(82, 124, 181, 0.08);
  box-shadow:
    0 6px 16px rgba(54, 88, 150, 0.04),
    0 1px 4px rgba(0, 0, 0, 0.02);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgba(37, 99, 235, 0.14);
    box-shadow:
      0 8px 18px rgba(54, 88, 150, 0.05),
      0 2px 6px rgba(37, 99, 235, 0.04);
    transform: translateY(-1px);
  }

  &__header {
    width: 100%;
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: flex-start !important;
    gap: 8px;
    padding: 0 12px;
    border: none !important;
    outline: none !important;
    background: #fbfcff;

    &:hover {
      background: linear-gradient(180deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.03));
    }
  }

  &__arrow {
    font-size: 14px;
    color: #6b7a93;
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: #1a2639;
    user-select: none;
    letter-spacing: -0.1px;
  }

  &__body {
    padding: 10px 14px 14px;
    border-top: 1px solid rgba(82, 124, 181, 0.08);
  }

  &__border {
    padding: 2px 2px 4px;
  }
}

.page-setting-form {
  .el-form-item {
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-form-item__label {
    font-size: 12px;
    font-weight: 600;
    color: #6f7f98;
  }

  .el-input__wrapper,
  .el-select__wrapper,
  .el-textarea__inner {
    border-radius: 12px;
    box-shadow: 0 0 0 1px rgba(82, 124, 181, 0.08);
  }

  .el-switch {
    --el-switch-on-color: #2563eb;
  }
}
</style>
