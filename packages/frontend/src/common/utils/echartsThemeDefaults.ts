import type { EChartsThemeData, ThemeAxis } from '@/common/types/echartsTheme'

function createDefaultAxes(): ThemeAxis[] {
  const types = ['all', 'category', 'value', 'log', 'time']
  const names = ['通用', '类目', '数值', '对数', '时间']
  return types.map((type, i) => ({
    type,
    name: `${names[i]}轴`,
    axisLineShow: type !== 'value' && type !== 'log',
    axisLineColor: '#54555a',
    axisTickShow: type !== 'value' && type !== 'log',
    axisTickColor: '#54555a',
    axisLabelShow: true,
    axisLabelColor: '#54555a',
    splitLineShow: type !== 'category' && type !== 'time',
    splitLineColor: ['#dbdee4'],
    splitAreaShow: false,
    splitAreaColor: ['rgba(234,237,245,0.5)', 'rgba(255,255,255,0)'],
  }))
}

export function createDefaultEchartsTheme(): EChartsThemeData {
  const axes = createDefaultAxes()
  return {
    seriesCnt: 3,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    titleColor: '#464646',
    subtitleColor: '#6E7079',
    textColorShow: false,
    textColor: '#333',
    markTextColor: '#eee',
    color: [
      '#5070dd',
      '#b6d634',
      '#505372',
      '#ff994d',
      '#0ca8df',
      '#ffd10a',
      '#fb628b',
      '#785db0',
      '#3fbe95',
    ],
    borderColor: '#ccc',
    borderWidth: 0,
    visualMapColor: ['#bf444c', '#d88273', '#f6efa6'],
    legendTextColor: '#333',
    kColor: '#eb5454',
    kColor0: '#47b262',
    kBorderColor: '#eb5454',
    kBorderColor0: '#47b262',
    kBorderWidth: 1,
    lineWidth: 2,
    symbolSize: 4,
    symbol: 'emptyCircle',
    symbolBorderWidth: 1,
    lineSmooth: false,
    graphLineWidth: 1,
    graphLineColor: '#aaa',
    mapLabelColor: '#000',
    mapLabelColorE: 'rgb(100,0,0)',
    mapBorderColor: '#444',
    mapBorderColorE: '#444',
    mapBorderWidth: 0.5,
    mapBorderWidthE: 1,
    mapAreaColor: '#eee',
    mapAreaColorE: 'rgba(255,215,0,0.8)',
    axes,
    axisSeperateSetting: true,
    axis: [axes[0]!],
    toolboxColor: '#999',
    toolboxEmphasisColor: '#666',
    tooltipAxisColor: '#ccc',
    tooltipAxisWidth: 1,
    timelineLineColor: '#DAE1F5',
    timelineLineWidth: 2,
    timelineItemColor: '#A4B1D7',
    timelineItemColorE: '#FFF',
    timelineCheckColor: '#316bf3',
    timelineCheckBorderColor: '#fff',
    timelineItemBorderWidth: 1,
    timelineControlColor: '#A4B1D7',
    timelineControlBorderColor: '#A4B1D7',
    timelineControlBorderWidth: 1,
    timelineLabelColor: '#A4B1D7',
    gridLeft: '15%',
    gridRight: '10%',
    gridTop: 65,
    gridBottom: 80,
    legendLeft: 'center',
    legendRight: 'auto',
    legendTop: 'auto',
    legendBottom: 15,
  }
}

export function updateAxisSetting(theme: EChartsThemeData) {
  if (!theme.axes?.length) {
    theme.axes = createDefaultEchartsTheme().axes
  }
  if (theme.axisSeperateSetting) {
    theme.axis = theme.axes
  }
  else {
    theme.axis = [theme.axes[0]!]
  }
}
