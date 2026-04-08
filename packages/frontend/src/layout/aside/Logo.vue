<script lang="ts" setup>
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

const props = defineProps<{ collapse?: boolean }>()
</script>

<template>
  <div class="w-full h-full px-2 flex items-center">
    <el-space>
      <el-icon color="var(--el-color-primary)" :size="32">
        <SvgIcon name="lightning" />
      </el-icon>
      <el-text type="primary" class="text-[1.25em] font-600"> WellCube </el-text>
    </el-space>
  </div>
</template>

<style lang="scss" module></style>
