<script setup lang="ts">
import type { ApiDatasetField } from '@/api/dataset'
import { ElText } from 'element-plus'
import { computed } from 'vue'
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

const props = withDefaults(
  defineProps<{
    field: ApiDatasetField | null
  }>(),
  {
    field: null,
  },
)

const textIconName = computed(() => {
  return props?.field?.field_type === 'text'
    ? 'text'
    : props?.field?.field_type === 'number'
      ? 'number'
      : 'datetime'
})

const textIconColor = computed(() => {
  return props?.field?.field_type === 'text'
    ? 'var(--el-color-primary)'
    : props?.field?.field_type === 'number'
      ? 'var(--el-color-primary)'
      : 'var(--el-color-primary)'
})
</script>

<template>
  <div v-if="field" class="inline-flex items-center gap-1 cursor-pointer">
    <SvgIcon :size="14" :name="textIconName" :color="textIconColor" />
    <ElText>{{ field?.name }}</ElText>
  </div>
</template>
