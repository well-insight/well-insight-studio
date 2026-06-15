<script lang="ts" setup>
import { SvgIcon } from '@/components/svg-icon'
import { PageSetting } from '../../right-attribute-panel/components/page-setting/pageSetting'
</script>

<template>
  <el-popover
    title="页面配置"
    placement="bottom"
    trigger="click"
    width="320"
    transition="el-zoom-in-top"
    :popper-class="$style['page-setting-popover']"
  >
    <template #reference>
      <el-button text bg type="primary">
        <SvgIcon name="page-setting" />
        <span class="ml-2">页面配置</span>
      </el-button>
    </template>

    <el-scrollbar :class="$style['page-setting-panel']">
      <PageSetting />
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

  width: 320px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :global(.el-popover__title) {
    height: 40px;
    width: 100%;
    padding: 0 16px;
    display: flex;
    align-items: center;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  .page-setting-panel {
    padding: 12px 16px 0 16px;
    width: 320px;
    height: min(460px, calc(100vh - 220px));
    max-height: min(460px, calc(100vh - 220px));
    box-sizing: border-box;
  }

  :global(.el-scrollbar__wrap) {
    max-height: min(460px, calc(100vh - 220px));
  }
}
</style>
