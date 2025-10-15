<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import geoJson from '@/assets/assembly/china.json'
import { registerTheme } from '@/hooks/useEchartTheme'
import { useDesignStore } from '@/stores/design'
// import elementResizeDetectorMaker from 'element-resize-detector';
import { getRandomKey } from '@/utils'
import bus from '@/utils/eventBus'

const props = defineProps({
  options: {
    type: Object,
    default: () => {
      return {
        title: {},
        tooltip: {},
        xAxis: {
          data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
        },
        yAxis: {},
        series: [
          {
            name: '销量',
            type: 'bar',
            data: [5, 20, 36, 10, 10, 20],
          },
        ],
      }
    },
  },
  width: {
    type: [String],
    default: '100%',
  },
  height: {
    type: [String],
    default: '100%',
  },
})

const store = useDesignStore()

// 主题
const theme = computed(() => store.$state.pageConfig.theme)

let myChart: any

const myOptions = computed(() => {
  return props.options
})

const myEchartRef = ref<HTMLElement>()

function initCharts() {
  if (myEchartRef.value) {
    if (myChart) {
      myChart.dispose()
    }
    // 基于准备好的dom，初始化echarts实例
    myChart = echarts.init(myEchartRef.value, theme.value)
    echarts.registerMap('china', geoJson as any)
    bus.emit('chartRender', myChart)
    myChart.setOption(myOptions.value)
  }
}

function resizeCharts() {
  // 窗口变动自适应echart
  window.addEventListener('resize', () => {
    myChart.resize()
  })

  // 监听元素尺寸变化 自适应echart
  const ifRender = ref(false)
  const resizeObserver = new ResizeObserver(
    (element) => {
      nextTick(() => {
        if (ifRender.value) {
          myChart.resize()
        }
        ifRender.value = true
      })
    },
  )
  resizeObserver.observe(myEchartRef.value as HTMLElement)
}
onMounted(() => {
  // 注册echarts主题
  if (echarts) {
    registerTheme(echarts)
  };
  setTimeout(() => {
    nextTick(() => {
      initCharts()
      resizeCharts()
    })
  }, 0)
})

watch(theme, (n) => {
  initCharts()
})
</script>

<template>
  <div :key="getRandomKey" ref="myEchartRef" class="my-echarts" :style="{ height, width }" />
</template>

<style scoped lang="scss">
.my-echarts {
    width: 100%;
    height: 100%;
    //background-color: #fff;
}
</style>
