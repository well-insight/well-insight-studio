/**
 * 预定义画布主题
 * 基于 echarts-theme-builder 的 15 种配色方案
 */
import type { CanvasTheme, PredefinedThemeMeta } from './canvasTheme'
import { createDefaultBrandColorMap } from './canvasTheme'

// ── 15 个 ECharts 预设主题的数据 ──
interface PresetDef {
  id: string
  name: string
  bg: string
  isDark: boolean
  /** 品牌色（取色板前 5 个映射） */
  palette: { primary: string; success: string; warning: string; danger: string; info: string }
  /** 完整图表色板 */
  colors: string[]
}

const PRESETS: PresetDef[] = [
  { id: 'v5',         name: 'V5 默认',     bg: '#ffffff', isDark: false, palette: { primary:'#5470c6', success:'#91cc75', warning:'#fac858', danger:'#ee6666', info:'#73c0de' }, colors: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc'] },
  { id: 'vintage',    name: '复古',         bg: '#fef8ef', isDark: false, palette: { primary:'#d87c7c', success:'#919e8b', warning:'#d7ab82', danger:'#6e7074', info:'#61a0a8' }, colors: ['#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58'] },
  { id: 'dark',       name: '暗色',         bg: '#333333', isDark: true,  palette: { primary:'#dd6b66', success:'#759aa0', warning:'#e69d87', danger:'#ea7e53', info:'#8dc1a9' }, colors: ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab'] },
  { id: 'westeros',   name: '维斯特洛',     bg: '#ffffff', isDark: false, palette: { primary:'#516b91', success:'#59c4e6', warning:'#edafda', danger:'#93b7e3', info:'#a5e7f0' }, colors: ['#516b91','#59c4e6','#edafda','#93b7e3','#a5e7f0','#cbb0e3'] },
  { id: 'essos',      name: '厄斯索斯',     bg: '#fcf4e6', isDark: false, palette: { primary:'#893448', success:'#d95850', warning:'#eb8146', danger:'#ffb248', info:'#f2d643' }, colors: ['#893448','#d95850','#eb8146','#ffb248','#f2d643','#ebdba4'] },
  { id: 'wonderland', name: '仙境',         bg: '#ffffff', isDark: false, palette: { primary:'#4ea397', success:'#22c3aa', warning:'#7bd9a5', danger:'#d0648a', info:'#f58db2' }, colors: ['#4ea397','#22c3aa','#7bd9a5','#d0648a','#f58db2','#f2b3c9'] },
  { id: 'walden',     name: '瓦尔登湖',     bg: '#fcfcfc', isDark: false, palette: { primary:'#3fb1e3', success:'#6be6c1', warning:'#626c91', danger:'#a0a7e6', info:'#c4ebad' }, colors: ['#3fb1e3','#6be6c1','#626c91','#a0a7e6','#c4ebad','#96dee8'] },
  { id: 'chalk',      name: '粉笔',         bg: '#293441', isDark: true,  palette: { primary:'#fc97af', success:'#87f7cf', warning:'#f7f494', danger:'#72ccff', info:'#f7c5a0' }, colors: ['#fc97af','#87f7cf','#f7f494','#72ccff','#f7c5a0','#d4a4eb','#d2f5a6','#76f2f2'] },
  { id: 'infographic',name: '信息图',       bg: '#ffffff', isDark: false, palette: { primary:'#C1232B', success:'#27727B', warning:'#FCCE10', danger:'#E87C25', info:'#B5C334' }, colors: ['#C1232B','#27727B','#FCCE10','#E87C25','#B5C334','#FE8463','#9BCA63','#FAD860','#F3A43B'] },
  { id: 'macarons',   name: '马卡龙',       bg: '#ffffff', isDark: false, palette: { primary:'#2ec7c9', success:'#b6a2de', warning:'#5ab1ef', danger:'#ffb980', info:'#d87a80' }, colors: ['#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80','#8d98b3','#e5cf0d','#97b552','#95706d'] },
  { id: 'roma',       name: '罗马',         bg: '#ffffff', isDark: false, palette: { primary:'#E01F54', success:'#001852', warning:'#f5e8c8', danger:'#b8d2c7', info:'#c6b38e' }, colors: ['#E01F54','#001852','#f5e8c8','#b8d2c7','#c6b38e','#a4d8c2','#f3d999','#d3758f','#dcc392'] },
  { id: 'shine',      name: '闪耀',         bg: '#ffffff', isDark: false, palette: { primary:'#c12e34', success:'#e6b600', warning:'#0098d9', danger:'#2b821d', info:'#005eaa' }, colors: ['#c12e34','#e6b600','#0098d9','#2b821d','#005eaa','#339ca8','#cda819','#32a487'] },
  { id: 'purple-passion', name: '紫色激情', bg: '#5b5c6e', isDark: true,  palette: { primary:'#8a7ca8', success:'#e098c7', warning:'#8fd3e8', danger:'#71669e', info:'#cc70af' }, colors: ['#8a7ca8','#e098c7','#8fd3e8','#71669e','#cc70af','#7cb4cc'] },
  { id: 'halloween',  name: '万圣节',       bg: '#1a1a2e', isDark: true,  palette: { primary:'#ff6f61', success:'#ffb347', warning:'#4ecdc4', danger:'#95e1d3', info:'#f38181' }, colors: ['#ff6f61','#ffb347','#4ecdc4','#95e1d3','#f38181','#a8e6cf','#dcedc1','#ffd3b6','#ffaaa5'] },
]

export const PREDEFINED_THEME_METAS: PredefinedThemeMeta[] = PRESETS.map(p => ({
  id: p.id,
  name: p.name,
  previewBg: p.bg,
  previewColors: p.colors.slice(0, 5),
  isDark: p.isDark,
}))

function createTheme(def: PresetDef): CanvasTheme {
  const isDarkMode = def.isDark
  return {
    id: def.id,
    name: def.name,
    palette: { ...def.palette },
    text: {
      primary: isDarkMode ? '#e5e6e8' : '#303133',
      regular: isDarkMode ? '#c0c4cc' : '#606266',
      secondary: isDarkMode ? '#909399' : '#909399',
      placeholder: isDarkMode ? '#636466' : '#c0c4cc',
      disabled: isDarkMode ? '#4a4b4d' : '#c0c4cc',
    },
    bg: {
      page: isDarkMode ? '#1d1e1f' : '#f5f7fa',
      component: isDarkMode ? '#2a2b2d' : '#ffffff',
      overlay: isDarkMode ? '#37383a' : '#ffffff',
      hover: isDarkMode ? '#3a3b3d' : '#f0f2f5',
      selected: isDarkMode ? '#2c3e5a' : '#ecf5ff',
    },
    border: {
      base: isDarkMode ? '#4a4b4d' : '#dcdfe6',
      light: isDarkMode ? '#3a3b3d' : '#ebeef5',
      dark: isDarkMode ? '#5a5b5d' : '#c0c4cc',
    },
    fill: {
      default: isDarkMode ? '#3a3b3d' : '#f0f2f5',
      light: isDarkMode ? '#333436' : '#f5f7fa',
      dark: isDarkMode ? '#2a2b2d' : '#e8eaed',
      page: isDarkMode ? '#141516' : '#ebedf0',
    },
    shadow: {
      light: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
      medium: isDarkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
      dark: isDarkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.16)',
    },
    chartColors: [...def.colors],
    brandColorMap: createDefaultBrandColorMap(),
    isDark: isDarkMode,
  }
}

const themeMap = Object.fromEntries(PRESETS.map(p => [p.id, createTheme(p)]))

export const PREDEFINED_THEMES: Record<string, CanvasTheme> = themeMap

export function getPredefinedTheme(id: string): CanvasTheme | undefined {
  return PREDEFINED_THEMES[id]
}

export function getPredefinedThemeMetas(): PredefinedThemeMeta[] {
  return PREDEFINED_THEME_METAS
}

/** 获取预设主题对应的 ECharts JSON 文件名 */
export function getPresetEchartsJsonName(id: string): string | null {
  const p = PRESETS.find(p => p.id === id)
  return p ? p.id : null
}
