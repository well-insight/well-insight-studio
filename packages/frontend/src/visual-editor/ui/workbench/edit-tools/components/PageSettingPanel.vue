<script lang="ts" setup>
import { Close, Expand, Fold } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { PageSetting } from '../../right-attribute-panel/components/page-setting/pageSetting'

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
  <div :class="$style.panel">
    <div :class="$style.header">
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

    <el-scrollbar :class="$style.scrollBody">
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
  padding-bottom: 12px;
}

.page-setting-card {
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--el-border-color);
  }

  &__header {
    width: 100%;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-start !important;
    padding: 0 12px;
    border: none !important;
    outline: none !important;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__arrow {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    user-select: none;
  }

  &__body {
    padding: 4px 12px 12px;
  }

  &__border {
    padding: 0 4px 8px;
  }
}

.page-setting-form {
  .el-form-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-form-item__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
