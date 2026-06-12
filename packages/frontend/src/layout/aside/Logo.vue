<script lang="ts" setup>
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

defineProps<{ collapse?: boolean }>()
</script>

<template>
  <div class="logo-bar flex h-full w-full items-center">
    <el-icon color="var(--el-color-primary)" :size="32">
      <SvgIcon name="logo" />
    </el-icon>
    <el-text v-show="!collapse" type="primary" class="logo-bar__title font-600 text-[1.25em]">
      WellCube
    </el-text>
  </div>
</template>

<style lang="scss" scoped>
.logo-bar {
  gap: 8px;
  padding-left: 20px;
}

.logo-bar__title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}
</style>
