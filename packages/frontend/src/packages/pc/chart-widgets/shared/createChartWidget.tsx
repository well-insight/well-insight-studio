import type { EChartsOption } from 'echarts'
import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import type { BaseChartOptionParams } from '@/components/echarts'
import { ElAutoResizer } from 'element-plus'
import { createEditorInputProp, createEditorSelectProp, createEditorSwitchProp } from '@/visual-editor/visual-editor.props'
import DatasetChartView from './DatasetChartView'

export interface ChartWidgetDefOptions {
  key: string
  label: string
  description: string
  defaultTitle: string
  defaultVariant?: string
  variantOptions?: { label: string, value: string }[]
  buildOption: (params: BaseChartOptionParams) => EChartsOption
}

export function createChartWidget(def: ChartWidgetDefOptions): VisualEditorComponent {
  const PreviewView = (props: { compact?: boolean, chartVariant?: string }) => (
    <div class="h-80px w-full px-8px py-6px">
      <DatasetChartView
        compact
        chartVariant={props.chartVariant ?? def.defaultVariant ?? 'basic'}
        buildOption={def.buildOption}
      />
    </div>
  )

  return {
    key: def.key,
    moduleName: 'chartWidgets',
    label: def.label,
    icon: 'component-chart',
    description: def.description,
    preview: () => <PreviewView compact chartVariant={def.defaultVariant} />,
    render: ({ styles, props, block }) => {
      return () => (
        <div style={{ width: '100%', height: '100%', ...styles }}>
          <ElAutoResizer>
            {{
              default: () => (
                <DatasetChartView
                  bindings={block.datasetBindings}
                  useSampleData={props.useSampleData}
                  chartVariant={props.chartVariant ?? def.defaultVariant ?? 'basic'}
                  buildOption={def.buildOption}
                />
              ),
            }}
          </ElAutoResizer>
        </div>
      )
    },
    props: {
      title: createEditorInputProp({ label: '图表标题', defaultValue: def.defaultTitle }),
      categoryField: createEditorInputProp({
        label: '分类字段',
        defaultValue: '',
        tips: '由数据配置中的维度字段自动同步',
      }),
      valueField: createEditorInputProp({
        label: '数值字段',
        defaultValue: '',
        tips: '由数据配置中的指标字段自动同步',
      }),
      chartVariant: def.variantOptions?.length
        ? createEditorSelectProp({
            label: '图表样式',
            defaultValue: def.defaultVariant ?? 'basic',
            options: def.variantOptions,
          })
        : createEditorInputProp({
            label: '图表样式',
            defaultValue: def.defaultVariant ?? 'basic',
          }),
      useSampleData: createEditorSwitchProp({
        label: '未绑定时显示示例',
        defaultValue: true,
        tips: '未配置数据集时展示演示数据',
      }),
    },
    showStyleConfig: true,
    draggable: true,
    events: [{ label: '数据刷新后', value: 'refreshed' }],
  } as VisualEditorComponent
}
