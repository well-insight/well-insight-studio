import type { PropType } from 'vue'
import type { BlockDatasetBindings } from '@/utils/datasetBinding'
import { Refresh } from '@element-plus/icons-vue'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { computed, defineComponent } from 'vue'
import { buildBarChartOption, EChartsView } from '@/components/echarts'
import { useDatasetChartData } from '@/hooks/useDatasetChartData'

export default defineComponent({
  name: 'BarChartView',
  props: {
    bindings: {
      type: Object as PropType<BlockDatasetBindings | undefined>,
      default: undefined,
    },
    barColor: { type: String, default: '#409EFF' },
    useSampleData: { type: Boolean, default: true },
    showRefresh: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    width: { type: Number as PropType<number>, default: 320 },
    height: { type: Number as PropType<number>, default: 200 },
  },
  setup(props) {
    const { data, loading, error, refresh } = useDatasetChartData({
      bindings: () => props.bindings,
      useSampleData: () => props.useSampleData,
    })

    const chartOption = computed(() =>
      buildBarChartOption({
        data: data.value,
        barColor: props.barColor,
        compact: props.compact,
      }),
    )

    return () => (
      <div
        class="relative flex h-full w-full flex-col overflow-hidden bg-[var(--el-bg-color)]"
        style={{ minHeight: props.compact ? '80px' : '120px' }}
      >
        {props.showRefresh && !props.compact && (
          <ElButton
            text
            size="small"
            class="absolute right-8px top-8px z-1"
            loading={loading.value}
            onClick={() => void refresh()}
          >
            <ElIcon>
              <Refresh />
            </ElIcon>
          </ElButton>
        )}

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
