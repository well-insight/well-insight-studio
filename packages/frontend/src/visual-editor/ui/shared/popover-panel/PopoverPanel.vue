<script setup lang="ts">
defineProps<{
  title: string
  width?: number | string
}>()

defineSlots<{
  trigger(props: {}): any
  'header-actions'(props: {}): any
  default(props: {}): any
}>()
</script>

<template>
  <el-popover
    placement="bottom"
    trigger="click"
    :width="width ?? 340"
    :show-arrow="false"
    transition="el-zoom-in-top"
    popper-class="popover-panel"
    :hide-on-click="false"
  >
    <template #reference>
      <slot name="trigger" />
    </template>

    <div :class="$style['custom-header']">
      <span :class="$style['header-title']">{{ title }}</span>
      <div v-if="$slots['header-actions']" :class="$style['header-actions']">
        <slot name="header-actions" />
      </div>
    </div>

    <el-scrollbar :class="$style['scroll-body']">
      <div :class="$style['card-list']">
        <slot />
      </div>
    </el-scrollbar>
  </el-popover>
</template>

<style lang="scss" module>
.custom-header {
  height: 44px;
  padding: 0 14px 0 18px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.3px;

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

.header-actions {
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

.scroll-body {
  padding: 12px 14px 4px;
  width: 100%;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 10px;
}
</style>

<style lang="scss">
.popover-panel {
  --el-popover-padding: 0;
  --el-popover-border-radius: 12px;

  padding: 0 !important;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-dark);

  .el-popover__title {
    display: none;
  }

  .el-form-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
