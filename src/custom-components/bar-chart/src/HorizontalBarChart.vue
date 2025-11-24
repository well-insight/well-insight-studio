<script lang="ts" setup>
import type { IProps } from './props'
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<IProps>(), {})

const options = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    type: 'category',
    data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World'],
  },
  series: [
    {
      name: '2011',
      type: 'bar',
      data: [18203, 23489, 29034, 104970, 131744, 630230],
    },
    {
      name: '2012',
      type: 'bar',
      data: [19325, 23438, 31000, 121594, 134141, 681807],
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

<style lang="scss" scoped></style>
