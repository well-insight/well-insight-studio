import type { PreDefinedEchartsTheme } from '@/common/types/echartsTheme'

/** ECharts 官方预设主题色板（展示在编辑器「默认方案」区域） */
export const ECHARTS_PREDEFINED_THEMES: PreDefinedEchartsTheme[] = [
  {
    name: 'welldesign',
    background: 'rgba(0, 0, 0, 0)',
    theme: ['#2563eb', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  },
  {
    name: 'v5',
    background: 'rgba(0, 0, 0, 0)',
    theme: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  },
  {
    name: 'vintage',
    background: '#fef8ef',
    theme: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'],
  },
  {
    name: 'dark',
    background: '#333',
    theme: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc', '#7289ab', '#91ca8c', '#f49f42'],
  },
  {
    name: 'westeros',
    background: 'transparent',
    theme: ['#516b91', '#59c4e6', '#edafda', '#93b7e3', '#a5e7f0', '#cbb0e3'],
  },
  {
    name: 'essos',
    background: 'rgba(242,234,191,0.15)',
    theme: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
  },
  {
    name: 'wonderland',
    background: 'transparent',
    theme: ['#4ea397', '#22c3aa', '#7bd9a5', '#d0648a', '#f58db2', '#f2b3c9'],
  },
  {
    name: 'walden',
    background: 'rgba(252,252,252,0)',
    theme: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8'],
  },
  {
    name: 'chalk',
    background: '#293441',
    theme: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'],
  },
  {
    name: 'infographic',
    background: 'transparent',
    theme: ['#C1232B', '#27727B', '#FCCE10', '#E87C25', '#B5C334', '#FE8463', '#9BCA63', '#FAD860', '#F3A43B', '#60C0DD'],
  },
  {
    name: 'macarons',
    background: 'transparent',
    theme: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa'],
  },
  {
    name: 'roma',
    background: 'transparent',
    theme: ['#E01F54', '#001852', '#f5e8c8', '#b8d2c7', '#c6b38e', '#a4d8c2', '#f3d999', '#d3758f', '#dcc392', '#2e4783'],
  },
  {
    name: 'shine',
    background: 'transparent',
    theme: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
  },
  {
    name: 'purple-passion',
    background: 'rgba(91,92,110,1)',
    theme: ['#8a7ca8', '#e098c7', '#8fd3e8', '#71669e', '#cc70af', '#7cb4cc'],
  },
]

export async function loadEchartsPredefinedTheme(name: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`/echarts-themes/${name}.json`)
    if (!response.ok)
      return null
    return await response.json()
  }
  catch {
    return null
  }
}
