import { buildBarChartOption, EChartsView } from "@/components/echarts";
import { useDatasetChartData } from "@/hooks/useDatasetChartData";
import type { BlockDatasetBindings } from "@/utils/datasetBinding";
import { Refresh } from "@element-plus/icons-vue";
import { ElButton, ElEmpty, ElIcon } from "element-plus";
import { computed, defineComponent, type PropType } from "vue";

export default defineComponent({
  name: "BarChartView",
  props: {
    title: { type: String, default: "柱状图" },
    bindings: {
      type: Object as PropType<BlockDatasetBindings | undefined>,
      default: undefined,
    },
    barColor: { type: String, default: "#409EFF" },
    useSampleData: { type: Boolean, default: true },
    showRefresh: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    width: { type: Number as PropType<number>, default: 320 },
    height: { type: Number as PropType<number>, default: 200 },
  },
  setup(props) {
    const { data, loading, error, total, canLoadFromDataset, refresh } = useDatasetChartData({
      bindings: () => props.bindings,
      useSampleData: () => props.useSampleData,
    });

    const subtitle = computed(() => {
      if (canLoadFromDataset.value) {
        return `已绑定数据集 · ${data.value.length} 项${total.value > data.value.length ? `（共 ${total.value} 行）` : ""}`;
      }
      if (props.useSampleData) {
        return "示例数据 · 可在属性中绑定数据集";
      }
      return "请绑定数据集并选择字段";
    });

    const chartOption = computed(() =>
      buildBarChartOption({
        data: data.value,
        barColor: props.barColor,
        compact: props.compact,
      }),
    );

    return () => (
      <div
        class="flex h-full w-full flex-col overflow-hidden rounded-[6px] bg-[var(--el-bg-color)]"
        style={{ minHeight: props.compact ? "80px" : "120px" }}
      >
        {!props.compact && (
          <div class="flex shrink-0 items-start justify-between gap-8px px-12px pt-10px">
            <div class="min-w-0 flex-1">
              <div class="truncate text-14px font-600 text-[var(--el-text-color-primary)]">
                {props.title}
              </div>
              <div class="mt-2px truncate text-12px text-[var(--el-text-color-secondary)]">
                {subtitle.value}
              </div>
            </div>
            {props.showRefresh && (
              <ElButton text size="small" loading={loading.value} onClick={() => void refresh()}>
                <ElIcon>
                  <Refresh />
                </ElIcon>
              </ElButton>
            )}
          </div>
        )}

        <div class="relative min-h-0 flex-1 px-8px pb-8px">
          {error.value && data.value.length === 0 ? (
            <ElEmpty description={error.value} image-size={56} />
          ) : data.value.length === 0 && !loading.value ? (
            <ElEmpty description="暂无图表数据" image-size={56} />
          ) : (
            <EChartsView
              option={chartOption.value}
              loading={loading.value && data.value.length === 0}
            />
          )}
        </div>
      </div>
    );
  },
});
