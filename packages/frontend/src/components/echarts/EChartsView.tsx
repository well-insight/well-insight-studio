import type { EChartsOption } from 'echarts'
import type { PropType } from 'vue'
import { defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { echarts, ensureEChartsRegistered } from './register'

export default defineComponent({
  name: 'EChartsView',
  props: {
    option: {
      type: Object as PropType<EChartsOption>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLDivElement | null>(null)
    const chartRef = shallowRef<echarts.ECharts | null>(null)
    let resizeObserver: ResizeObserver | null = null

    function syncLoading() {
      if (!chartRef.value) {
        return
      }
      if (props.loading) {
        chartRef.value.showLoading({ text: '' })
      }
      else {
        chartRef.value.hideLoading()
      }
    }

    function renderChart() {
      if (!chartRef.value) {
        return
      }
      chartRef.value.setOption(props.option, { notMerge: true })
      syncLoading()
    }

    function initChart() {
      const el = containerRef.value
      if (!el) {
        return
      }
      ensureEChartsRegistered()
      chartRef.value?.dispose()
      chartRef.value = echarts.init(el)
      renderChart()
    }

    onMounted(() => {
      initChart()
      const el = containerRef.value
      if (!el) {
        return
      }
      resizeObserver = new ResizeObserver(() => {
        chartRef.value?.resize()
      })
      resizeObserver.observe(el)
    })

    watch(
      () => props.option,
      () => renderChart(),
      { deep: true },
    )

    watch(
      () => props.loading,
      () => syncLoading(),
    )

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      resizeObserver = null
      chartRef.value?.dispose()
      chartRef.value = null
    })

    return () => <div ref={containerRef} class="h-full w-full min-h-0" />
  },
})
