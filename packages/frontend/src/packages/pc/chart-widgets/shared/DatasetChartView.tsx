import type { EChartsOption } from 'echarts'
import type { PropType } from 'vue'
import type { BlockDatasetBindings } from '@/utils/datasetBinding'
import type { BaseChartOptionParams } from '@/components/echarts'
import { ElEmpty } from 'element-plus'
import { computed, defineComponent } from 'vue'
import { EChartsView } from '@/components/echarts'
import { useChartThemeColors } from '@/hooks/useChartThemeColors'
import { useDatasetChartData } from '@/hooks/useDatasetChartData'

export default defineComponent({
  name: 'DatasetChartView',
  props: {
    bindings: {
      type: Object as PropType<BlockDatasetBindings | undefined>,
      default: undefined,
    },
    useSampleData: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    chartVariant: { type: String, default: 'basic' },
    buildOption: {
      type: Function as PropType<(params: BaseChartOptionParams) => EChartsOption>,
      required: true,
    },
  },
  setup(props) {
    const { data, loading, error } = useDatasetChartData({
      bindings: () => props.bindings,
      useSampleData: () => props.useSampleData,
    })

    const { chartColors, echartsThemeConfig } = useChartThemeColors()

    const chartOption = computed(() =>
      props.buildOption({
        data: data.value,
        colors: chartColors.value,
        compact: props.compact,
        chartVariant: props.chartVariant,
      }),
    )

    return () => (
      <div
        class="relative flex h-full w-full flex-col overflow-hidden bg-[var(--el-bg-color)]"
        style={{ minHeight: props.compact ? '80px' : '120px' }}
      >
        <div class="relative min-h-0 flex-1">
          {error.value && data.value.length === 0
            ? (
                <ElEmpty description={error.value} image-size={56} />
              )
            : data.value.length === 0 && !loading.value
              ? (
                  <ElEmpty description="暂无图表数据" image-size={56} />
                )
              : (
                  <EChartsView
                    option={chartOption.value}
                    theme-config={echartsThemeConfig.value}
                    loading={loading.value && data.value.length === 0}
                  />
                )}
        </div>
      </div>
    )
  },
})
