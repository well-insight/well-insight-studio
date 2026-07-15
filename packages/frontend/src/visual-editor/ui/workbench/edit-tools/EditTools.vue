<script lang="ts" setup>
import CanvasLayerDropdown from './components/CanvasLayerDropdown.vue'
import PageSettingButton from './components/PageSetting.vue'
</script>

<template>
  <div class="border-bottom-1 flex h-full w-full items-center gap-2 overflow-hidden bg-[var(--el-bg-color)] px-3">
    <CanvasLayerDropdown />
    <PageSettingButton />
    <div class="min-w-0 flex-1">
      <slot name="center" />
    </div>
  </div>
</template>
