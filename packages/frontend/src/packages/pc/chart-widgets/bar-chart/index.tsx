import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElAutoResizer } from 'element-plus'
import { createEditorInputProp, createEditorSwitchProp } from '@/visual-editor/visual-editor.props'
import BarChartView from './BarChartView'

export default {
  key: 'bar-chart',
  moduleName: 'chartWidgets',
  label: '柱状图',
  icon: 'component-chart',
  description: '在右侧「数据配置」中选择数据源，拖入维度与指标字段展示柱状图。',
  preview: () => (
    <div class="h-80px w-full px-8px py-6px">
      <BarChartView compact width={220} height={68} showRefresh={false} />
    </div>
  ),
  render: ({ styles, props, block }) => {
    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElAutoResizer>
          {{
            default: (size: { width: number, height: number }) => (
              <BarChartView
                bindings={block.datasetBindings}
                useSampleData={props.useSampleData}
                width={Math.max(size.width, 200)}
                height={Math.max(size.height, 120)}
              />
            ),
          }}
        </ElAutoResizer>
      </div>
    )
  },
  props: {
    title: createEditorInputProp({ label: '图表标题', defaultValue: '柱状图' }),
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
