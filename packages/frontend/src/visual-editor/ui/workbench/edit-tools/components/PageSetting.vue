<script lang="ts" setup>
import { ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { PageSetting } from '../../right-attribute-panel/components/page-setting/pageSetting'

const pageSettingRef = ref<any>(null)
const allExpanded = ref(false)

function toggleExpand() {
  allExpanded.value = !allExpanded.value
  if (allExpanded.value) {
    pageSettingRef.value?.expandAll()
  }
  else {
    pageSettingRef.value?.collapseAll()
  }
}

const toggleIcon = computed(() => (allExpanded.value ? ArrowUpBold : ArrowDownBold))
const toggleTooltip = computed(() => (allExpanded.value ? '收起全部卡片' : '展开全部卡片'))
</script>

<template>
  <el-popover
    placement="bottom"
    trigger="click"
    width="340"
    transition="el-zoom-in-top"
    :popper-class="$style['page-setting-popover']"
  >
    <template #reference>
      <el-button text bg type="primary" :class="$style['trigger-btn']">
        <SvgIcon name="page-setting" />
        <span class="ml-1">页面配置</span>
      </el-button>
    </template>

    <!-- 自定义标题栏 -->
    <div :class="$style['custom-header']">
      <span :class="$style['header-title']">页面配置</span>
      <div :class="$style['header-actions']">
        <el-tooltip :content="toggleTooltip" placement="bottom">
          <el-button text size="small" :icon="toggleIcon" @click="toggleExpand" />
        </el-tooltip>
      </div>
    </div>

    <el-scrollbar :class="$style['page-setting-panel']">
      <PageSetting ref="pageSettingRef" />
    </el-scrollbar>
  </el-popover>
</template>

<style lang="scss" module>
.page-setting-popover {
  --el-popover-bg-color: var(--el-bg-color-overlay);
  --el-popover-font-size: var(--el-font-size-base);
  --el-popover-border-color: var(--el-border-color-lighter);
  --el-popover-padding: 0;
  --el-popover-border-radius: 12px;

  width: 340px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--el-box-shadow-dark);

  :global(.el-popover__title) {
    display: none;
  }

  .custom-header {
    height: 44px;
    padding: 0 14px 0 18px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;

    :global(.el-button) {
      width: 28px;
      height: 28px;
      font-size: 14px;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }
    }
  }

  .header-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.3px;
    white-space: nowrap;
    flex-shrink: 0;

    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: var(--el-color-primary);
      margin-right: 8px;
      vertical-align: middle;
    }
  }

  .page-setting-panel {
    padding: 16px 18px 4px;
    width: 340px;
    height: min(480px, calc(100vh - 200px));
    max-height: min(480px, calc(100vh - 200px));
    box-sizing: border-box;
  }

  :global {
    .el-scrollbar__wrap {
      max-height: min(480px, calc(100vh - 200px));
    }

    .el-divider__text {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }

    /* ── 可折叠卡片 ── */
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
        // margin-right: 6px;
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
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .el-form-item__label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
