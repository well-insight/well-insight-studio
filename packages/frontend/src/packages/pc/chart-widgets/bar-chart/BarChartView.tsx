import type { PropType } from 'vue'
import type { BlockDatasetBindings } from '@/utils/datasetBinding'
import { ElEmpty } from 'element-plus'
import { computed, defineComponent } from 'vue'
import { buildBarChartOption, EChartsView } from '@/components/echarts'
import { useChartThemeColors } from '@/hooks/useChartThemeColors'
import { useDatasetChartData } from '@/hooks/useDatasetChartData'

export default defineComponent({
  name: 'BarChartView',
  props: {
    bindings: {
      type: Object as PropType<BlockDatasetBindings | undefined>,
      default: undefined,
    },
    useSampleData: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    width: { type: Number as PropType<number>, default: 320 },
    height: { type: Number as PropType<number>, default: 200 },
  },
  setup(props) {
    const { data, loading, error, refresh } = useDatasetChartData({
      bindings: () => props.bindings,
      useSampleData: () => props.useSampleData,
    })

    // 直接从画布主题获取图表颜色
    const { chartColors } = useChartThemeColors()

    const chartOption = computed(() =>
      buildBarChartOption({
        data: data.value,
        colors: chartColors.value,
        compact: props.compact,
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
                    loading={loading.value && data.value.length === 0}
                  />
                )}
        </div>
      </div>
    )
  },
})
