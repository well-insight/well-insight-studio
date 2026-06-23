import type { EChartsThemeData } from '@/common/types/echartsTheme'

/**
 * 将编辑器主题数据转换为 ECharts registerTheme 可用的配置对象
 * 逻辑源自 echarts-theme-builder
 */
export function generateEChartsTheme(themeData: EChartsThemeData) {
  const seriesStyle = {
    itemStyle: {
      borderWidth: themeData.symbolBorderWidth,
    },
    lineStyle: {
      width: themeData.lineWidth,
    },
    symbolSize: themeData.symbolSize,
    symbol: themeData.symbol,
    smooth: themeData.lineSmooth,
  }

  const itemStyle = {
    borderWidth: themeData.borderWidth,
    borderColor: themeData.borderColor,
  }

  const border = { itemStyle } as Record<string, unknown>

  const mapConfig = {
    itemStyle: {
      areaColor: themeData.mapAreaColor,
      borderColor: themeData.mapBorderColor,
      borderWidth: themeData.mapBorderWidth,
    },
    label: {
      color: themeData.mapLabelColor,
    },
    emphasis: {
      itemStyle: {
        areaColor: themeData.mapAreaColorE,
        borderColor: themeData.mapBorderColorE,
        borderWidth: themeData.mapBorderWidthE,
      },
      label: {
        color: themeData.mapLabelColorE,
      },
    },
  }

  const getAxisConfig = (axisType: number) => {
    let axisIndex = 0
    if (themeData.axisSeperateSetting && axisType > 0 && axisType < themeData.axes.length) {
      axisIndex = axisType
    }
    const axisData = themeData.axes[axisIndex]!
    return {
      axisLine: {
        show: axisData.axisLineShow,
        lineStyle: { color: axisData.axisLineColor },
      },
      axisTick: {
        show: axisData.axisTickShow,
        lineStyle: { color: axisData.axisTickColor },
      },
      axisLabel: {
        show: axisData.axisLabelShow,
        color: axisData.axisLabelColor,
      },
      splitLine: {
        show: axisData.splitLineShow,
        lineStyle: { color: axisData.splitLineColor },
      },
      splitArea: {
        show: axisData.splitAreaShow,
        areaStyle: { color: axisData.splitAreaColor },
      },
    }
  }

  const graphStyle = {
    ...seriesStyle,
    color: themeData.color,
    lineStyle: {
      width: themeData.graphLineWidth,
      color: themeData.graphLineColor,
    },
    label: {
      color: themeData.markTextColor,
    },
    itemStyle: {
      ...itemStyle,
      borderWidth: themeData.borderWidth,
      borderColor: themeData.borderColor,
    },
  }

  return {
    color: themeData.color,
    backgroundColor: themeData.backgroundColor,
    textStyle: themeData.textColorShow ? { color: themeData.textColor } : {},
    title: {
      textStyle: { color: themeData.titleColor },
      subtextStyle: { color: themeData.subtitleColor },
    },
    line: seriesStyle,
    radar: seriesStyle,
    bar: {
      itemStyle: {
        barBorderWidth: themeData.borderWidth,
        barBorderColor: themeData.borderColor,
      },
    },
    pie: border,
    scatter: border,
    boxplot: border,
    parallel: border,
    sankey: border,
    funnel: border,
    gauge: border,
    candlestick: {
      itemStyle: {
        color: themeData.kColor,
        color0: themeData.kColor0,
        borderColor: themeData.kBorderColor,
        borderColor0: themeData.kBorderColor0,
        borderWidth: themeData.kBorderWidth,
      },
    },
    graph: graphStyle,
    map: mapConfig,
    geo: mapConfig,
    categoryAxis: getAxisConfig(1),
    valueAxis: getAxisConfig(2),
    logAxis: getAxisConfig(3),
    timeAxis: getAxisConfig(4),
    toolbox: {
      iconStyle: { borderColor: themeData.toolboxColor },
      emphasis: { iconStyle: { borderColor: themeData.toolboxEmphasisColor } },
    },
    legend: {
      textStyle: { color: themeData.legendTextColor },
      left: themeData.legendLeft === '' ? 'center' : themeData.legendLeft,
      right: themeData.legendRight === '' ? 'auto' : themeData.legendRight,
      top: themeData.legendTop === '' ? 'auto' : themeData.legendTop,
      bottom: themeData.legendBottom === '' ? 10 : themeData.legendBottom,
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: themeData.tooltipAxisColor,
          width: themeData.tooltipAxisWidth,
        },
        crossStyle: {
          color: themeData.tooltipAxisColor,
          width: themeData.tooltipAxisWidth,
        },
      },
    },
    timeline: {
      lineStyle: {
        color: themeData.timelineLineColor,
        width: themeData.timelineLineWidth,
      },
      itemStyle: {
        color: themeData.timelineItemColor,
        borderWidth: themeData.timelineItemBorderWidth,
      },
      controlStyle: {
        color: themeData.timelineControlColor,
        borderColor: themeData.timelineControlBorderColor,
        borderWidth: themeData.timelineControlBorderWidth,
      },
      checkpointStyle: {
        color: themeData.timelineCheckColor,
        borderColor: themeData.timelineCheckBorderColor,
      },
      label: { color: themeData.timelineLabelColor },
      emphasis: {
        itemStyle: { color: themeData.timelineItemColorE },
        controlStyle: {
          color: themeData.timelineControlColor,
          borderColor: themeData.timelineControlBorderColor,
          borderWidth: themeData.timelineControlBorderWidth,
        },
        label: { color: themeData.timelineLabelColor },
      },
    },
    visualMap: {
      color: themeData.visualMapColor,
    },
    markPoint: {
      label: { color: themeData.markTextColor },
      emphasis: { label: { color: themeData.markTextColor } },
    },
    grid: {
      left: themeData.gridLeft === '' ? '10%' : themeData.gridLeft,
      right: themeData.gridRight === '' ? '10%' : themeData.gridRight,
      top: themeData.gridTop === '' ? 60 : themeData.gridTop,
      bottom: themeData.gridBottom === '' ? 60 : themeData.gridBottom,
    },
  }
}
