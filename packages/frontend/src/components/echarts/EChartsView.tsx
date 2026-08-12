import type { EChartsOption } from 'echarts'
import type { PropType } from 'vue'
import { defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { echarts, ensureEChartsRegistered } from './register'
import { getEChartsLoadingOpts } from './theme'

const CANVAS_THEME_NAME = 'canvas-custom-theme'

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
    /** ECharts registerTheme 配置，来自画布主题 */
    themeConfig: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLDivElement | null>(null)
    const chartRef = shallowRef<echarts.ECharts | null>(null)
    let resizeObserver: ResizeObserver | null = null

    function getThemeName() {
      return props.themeConfig ? CANVAS_THEME_NAME : undefined
    }

    function registerThemeIfNeeded() {
      if (props.themeConfig) {
        echarts.registerTheme(CANVAS_THEME_NAME, props.themeConfig)
      }
    }

    function syncLoading() {
      if (!chartRef.value) {
        return
      }
      if (props.loading) {
        chartRef.value.showLoading(getEChartsLoadingOpts())
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
      registerThemeIfNeeded()
      chartRef.value?.dispose()
      chartRef.value = echarts.init(el, getThemeName())
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
      () => props.themeConfig,
      () => {
        initChart()
      },
      { deep: true },
    )

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
