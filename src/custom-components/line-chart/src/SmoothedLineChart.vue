<script lang="ts" setup>
import type { IProps } from './props'
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<IProps>(), {})

const options = ref({
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true,
    },
  ],
})

options.value = { ...options.value, ...props.chartOption } // 外部传入选项覆盖内部选项

onMounted(() => {
})
</script>

<template>
  <Echarts :options="options" />
</template>

<style lang="scss" scoped>

</style>
