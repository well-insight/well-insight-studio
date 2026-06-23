<script lang="ts" setup>
import { ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { PopoverPanel } from '@/visual-editor/ui/shared/popover-panel'
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
  <PopoverPanel title="页面配置">
    <template #trigger>
      <el-button text bg type="primary">
        <SvgIcon name="page-setting" />
        <span class="ml-1">页面配置</span>
      </el-button>
    </template>
    <template #header-actions>
      <el-tooltip :content="toggleTooltip" placement="bottom">
        <el-button text size="small" :icon="toggleIcon" @click="toggleExpand" />
      </el-tooltip>
    </template>
    <PageSetting ref="pageSettingRef" />
  </PopoverPanel>
</template>

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
