<script lang='ts' setup>
import type { DividerProps } from './props'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<DividerProps>(), {
  style: () => ({
    width: '120px',
    height: '32px',
  }),
  configs: () => ({
    value: '',
  }),
})

const originProps = computed(() => {
  return {
    ...props?.configs,
  }
})

const compRef = ref()

defineExpose({
  compRef,
})
</script>

<template>
  <el-divider v-bind="originProps" ref="compRef" :class="$style.divider">
    {{ originProps.value }}
  </el-divider>
</template>

<style lang='scss' module>
.divider {
  // width: 100%;
  // height: 100%;
}
</style>
