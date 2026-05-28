import { useDatasetChartData } from "@/hooks/useDatasetChartData";
import type { ChartBarDatum } from "@/utils/datasetChart";
import { Refresh } from "@element-plus/icons-vue";
import { ElButton, ElEmpty, ElIcon } from "element-plus";
import { computed, defineComponent, type PropType } from "vue";

const CHART_PADDING = { top: 28, right: 16, bottom: 36, left: 44 };

function maxValue(data: ChartBarDatum[]) {
  if (data.length === 0) {
    return 0;
  }
  return Math.max(...data.map((d) => d.value), 0);
}

export default defineComponent({
  name: "BarChartView",
  props: {
    title: { type: String, default: "柱状图" },
    datasetId: { type: String, default: "" },
    categoryField: { type: String, default: "" },
    valueField: { type: String, default: "" },
    barColor: { type: String, default: "#409EFF" },
    useSampleData: { type: Boolean, default: true },
    showRefresh: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    width: { type: Number as PropType<number>, default: 320 },
    height: { type: Number as PropType<number>, default: 200 },
  },
  setup(props) {
    const { data, loading, error, total, canLoadFromDataset, refresh } = useDatasetChartData({
      datasetId: () => props.datasetId,
      categoryField: () => props.categoryField,
      valueField: () => props.valueField,
      useSampleData: () => props.useSampleData,
    });

    const peak = computed(() => {
      const max = maxValue(data.value);
      return max > 0 ? max : 1;
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

    return () => {
      const chartW = Math.max(props.width - CHART_PADDING.left - CHART_PADDING.right, 40);
      const chartH = Math.max(
        props.height - CHART_PADDING.top - CHART_PADDING.bottom - (props.compact ? 0 : 24),
        40,
      );
      const barCount = data.value.length || 1;
      const gap = 8;
      const barWidth = Math.max((chartW - gap * (barCount - 1)) / barCount, 4);

      return (
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
                <ElButton
                  text
                  size="small"
                  loading={loading.value}
                  onClick={() => void refresh()}
                >
                  <ElIcon>
                    <Refresh />
                  </ElIcon>
                </ElButton>
              )}
            </div>
          )}

          <div class="relative min-h-0 flex-1 px-8px pb-8px">
            {loading.value && data.value.length === 0 ? (
              <div class="flex h-full items-center justify-center text-12px text-[var(--el-text-color-secondary)]">
                加载中…
              </div>
            ) : error.value && data.value.length === 0 ? (
              <ElEmpty description={error.value} image-size={56} />
            ) : data.value.length === 0 ? (
              <ElEmpty description="暂无图表数据" image-size={56} />
            ) : (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${props.width} ${props.height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Y 轴参考线 */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y =
                    CHART_PADDING.top +
                    chartH * (1 - ratio);
                  const label = Math.round(peak.value * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={props.width - CHART_PADDING.right}
                        y2={y}
                        stroke="var(--el-border-color-lighter)"
                        stroke-dasharray="4 4"
                      />
                      <text
                        x={CHART_PADDING.left - 6}
                        y={y + 4}
                        text-anchor="end"
                        font-size="10"
                        fill="var(--el-text-color-secondary)"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {data.value.map((item, index) => {
                  const barH = (item.value / peak.value) * chartH;
                  const x = CHART_PADDING.left + index * (barWidth + gap);
                  const y = CHART_PADDING.top + chartH - barH;
                  const label =
                    item.category.length > 6
                      ? `${item.category.slice(0, 5)}…`
                      : item.category;
                  return (
                    <g key={`${item.category}-${index}`}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx={3}
                        fill={props.barColor}
                        opacity={0.92}
                      >
                        <title>{`${item.category}: ${item.value}`}</title>
                      </rect>
                      <text
                        x={x + barWidth / 2}
                        y={CHART_PADDING.top + chartH + 14}
                        text-anchor="middle"
                        font-size="10"
                        fill="var(--el-text-color-regular)"
                      >
                        {label}
                      </text>
                      {!props.compact && barH > 16 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 4}
                          text-anchor="middle"
                          font-size="10"
                          fill="var(--el-text-color-primary)"
                        >
                          {item.value}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      );
    };
  },
});
