/** ECharts 主题编辑器数据结构（源自 echarts-theme-builder） */

export interface ThemeAxis {
  type: string
  name: string
  axisLineShow: boolean
  axisLineColor: string
  axisTickShow: boolean
  axisTickColor: string
  axisLabelShow: boolean
  axisLabelColor: string
  splitLineShow: boolean
  splitLineColor: string[]
  splitAreaShow: boolean
  splitAreaColor: string[]
}

export interface EChartsThemeData {
  seriesCnt: number
  backgroundColor: string
  titleColor: string
  subtitleColor: string
  textColorShow: boolean
  textColor: string
  markTextColor: string
  color: string[]
  borderColor: string
  borderWidth: number
  visualMapColor: string[]
  legendTextColor: string
  kColor: string
  kColor0: string
  kBorderColor: string
  kBorderColor0: string
  kBorderWidth: number
  lineWidth: number
  symbolSize: number
  symbol: string
  symbolBorderWidth: number
  lineSmooth: boolean
  graphLineWidth: number
  graphLineColor: string
  mapLabelColor: string
  mapLabelColorE: string
  mapBorderColor: string
  mapBorderColorE: string
  mapBorderWidth: number
  mapBorderWidthE: number
  mapAreaColor: string
  mapAreaColorE: string
  axes: ThemeAxis[]
  axisSeperateSetting: boolean
  axis: ThemeAxis[] | null
  toolboxColor: string
  toolboxEmphasisColor: string
  tooltipAxisColor: string
  tooltipAxisWidth: number
  timelineLineColor: string
  timelineLineWidth: number
  timelineItemColor: string
  timelineItemColorE: string
  timelineCheckColor: string
  timelineCheckBorderColor: string
  timelineItemBorderWidth: number
  timelineControlColor: string
  timelineControlBorderColor: string
  timelineControlBorderWidth: number
  timelineLabelColor: string
  gridLeft: number | string
  gridRight: number | string
  gridTop: number | string
  gridBottom: number | string
  legendLeft: number | string
  legendRight: number | string
  legendTop: number | string
  legendBottom: number | string
}

export interface PreDefinedEchartsTheme {
  name: string
  background: string
  theme: string[]
}
