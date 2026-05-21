<script lang="ts" setup>
import { AttrSettingsToolbar } from '@/visual-editor/ui/workbench/attr-settings-toolbar'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { computed } from 'vue'

const { currentBlock } = useVisualData()

const hasSelection = computed(() => !!currentBlock.value?._vid)
</script>

<template>
  <Transition name="block-settings-inline">
    <div v-show="hasSelection" class="block-settings-inline">
      <el-divider direction="vertical" class="block-settings-inline__divider" />
      <div class="block-settings-inline__meta">
        <span class="block-settings-inline__tag">当前组件</span>
        <span class="block-settings-inline__name" :title="currentBlock.label">
          {{ currentBlock.label }}
        </span>
      </div>
      <el-divider direction="vertical" class="block-settings-inline__divider" />
      <div class="block-settings-inline__actions">
        <AttrSettingsToolbar variant="dock" />
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.block-settings-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.block-settings-inline__divider {
  height: 20px;
  margin: 0;
  flex-shrink: 0;
}

.block-settings-inline__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  line-height: 1;
}

.block-settings-inline__tag {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.block-settings-inline__name {
  max-width: 100px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-settings-inline__actions {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 0;
  }
}

.block-settings-inline-enter-active,
.block-settings-inline-leave-active {
  transition: opacity 0.15s ease;
}

.block-settings-inline-enter-from,
.block-settings-inline-leave-to {
  opacity: 0;
}
</style>
