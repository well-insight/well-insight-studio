/** 预设主题定义 - 25 套配色方案 */

/** 主题色系分类 */
export type ThemeCategory = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'neutral'

export interface ThemePreset {
  name: string
  label: string
  primary: string
  success: string
  warning: string
  danger: string
  /** 5 色渐变条，用于卡片预览 */
  colors: string[]
  category: ThemeCategory
}

export const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  blue: '蓝色系',
  green: '绿色系',
  orange: '暖色系',
  purple: '紫色系',
  red: '红色系',
  neutral: '中性色',
}

export const THEME_PRESETS: ThemePreset[] = [
  /* ===== WellDesign 默认 (1) ===== */
  {
    name: 'welldesign',
    label: '蔚蓝 · WellDesign',
    primary: '#2563EB',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    colors: ['#2563EB', '#6096F0', '#A0C4F7', '#D0E2FC', '#F0F5FF'],
    category: 'blue',
  },

  /* ===== 蓝色系 (5) ===== */
  {
    name: 'breeze',
    label: '清风 · 蓝',
    primary: '#409EFF',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    colors: ['#409EFF', '#66B1FF', '#A6C9FF', '#D9ECFF', '#F0F7FF'],
    category: 'blue',
  },
  {
    name: 'sky',
    label: '天穹 · 淡蓝',
    primary: '#4A90D9',
    success: '#5A9A7A',
    warning: '#D4A84A',
    danger: '#C45A5A',
    colors: ['#4A90D9', '#7AB0E8', '#A8CCF0', '#D4E6F8', '#EEF4FA'],
    category: 'blue',
  },
  {
    name: 'indigo',
    label: '靛蓝 · 深邃',
    primary: '#3A5A9A',
    success: '#4A8A7A',
    warning: '#C4A04A',
    danger: '#B84A5A',
    colors: ['#3A5A9A', '#6A8AC4', '#9AB0D8', '#C8D8EC', '#E8EEF6'],
    category: 'blue',
  },
  {
    name: 'ocean',
    label: '海洋 · 深蓝',
    primary: '#1A5276',
    success: '#2E86A0',
    warning: '#D4A84A',
    danger: '#C0392B',
    colors: ['#1A5276', '#2E86A0', '#5DADE2', '#85C1E9', '#D6EAF8'],
    category: 'blue',
  },
  {
    name: 'iceberg',
    label: '冰山 · 冷蓝',
    primary: '#5DADE2',
    success: '#48C9B0',
    warning: '#F4D03F',
    danger: '#EC7063',
    colors: ['#5DADE2', '#85C1E9', '#A9CCE3', '#D4E6F1', '#EBF5FB'],
    category: 'blue',
  },

  /* ===== 绿色系 (5) ===== */
  {
    name: 'forest',
    label: '森林 · 绿',
    primary: '#2D8C5A',
    success: '#3AA76D',
    warning: '#D4A843',
    danger: '#C45A4A',
    colors: ['#2D8C5A', '#4CAF7A', '#7ECBA0', '#B8E0CC', '#E6F4EE'],
    category: 'green',
  },
  {
    name: 'mint',
    label: '薄荷 · 青',
    primary: '#3A9A8A',
    success: '#4AB89A',
    warning: '#D4B84A',
    danger: '#C46A5A',
    colors: ['#3A9A8A', '#5AB8A8', '#7AD0C0', '#B0E4DC', '#DFF3EE'],
    category: 'green',
  },
  {
    name: 'emerald',
    label: '翡翠 · 碧',
    primary: '#1A8A5A',
    success: '#3AAA7A',
    warning: '#C4A84A',
    danger: '#B85A4A',
    colors: ['#1A8A5A', '#4ABA8A', '#7AD0AA', '#B0E4CC', '#E0F4EA'],
    category: 'green',
  },
  {
    name: 'spring',
    label: '春芽 · 嫩绿',
    primary: '#7CB342',
    success: '#8BC34A',
    warning: '#FFB300',
    danger: '#E53935',
    colors: ['#7CB342', '#9CCC65', '#AED581', '#C5E1A5', '#F1F8E9'],
    category: 'green',
  },
  {
    name: 'teal',
    label: '墨绿 · 复古',
    primary: '#00695C',
    success: '#00897B',
    warning: '#F9A825',
    danger: '#C62828',
    colors: ['#00695C', '#00897B', '#26A69A', '#4DB6AC', '#B2DFDB'],
    category: 'green',
  },

  /* ===== 暖色系 (5) ===== */
  {
    name: 'sunset',
    label: '落日 · 橙',
    primary: '#E8734A',
    success: '#E8A14A',
    warning: '#E8C14A',
    danger: '#D95A5A',
    colors: ['#E8734A', '#F09A6A', '#F7C2A0', '#FCE0CC', '#FFF3EC'],
    category: 'orange',
  },
  {
    name: 'sunflower',
    label: '向日葵 · 黄',
    primary: '#E8B84A',
    success: '#7AB87A',
    warning: '#E8A84A',
    danger: '#D46A4A',
    colors: ['#E8B84A', '#F0CC7A', '#F8DCA8', '#FCECD4', '#FFF6EC'],
    category: 'orange',
  },
  {
    name: 'apricot',
    label: '杏色 · 暖橘',
    primary: '#E88A5A',
    success: '#C4A84A',
    warning: '#E8B84A',
    danger: '#D46A4A',
    colors: ['#E88A5A', '#F0AA7A', '#F8C8A8', '#FCE4D4', '#FFF4EC'],
    category: 'orange',
  },
  {
    name: 'amber',
    label: '琥珀 · 金',
    primary: '#F9A825',
    success: '#8BC34A',
    warning: '#FFB300',
    danger: '#E53935',
    colors: ['#F9A825', '#FBC02D', '#FFD54F', '#FFE082', '#FFF8E1'],
    category: 'orange',
  },
  {
    name: 'peach',
    label: '蜜桃 · 粉橘',
    primary: '#FF8A65',
    success: '#A5D6A7',
    warning: '#FFD54F',
    danger: '#EF5350',
    colors: ['#FF8A65', '#FFAB91', '#FFCCBC', '#FBE9E7', '#FFF3E0'],
    category: 'orange',
  },

  /* ===== 紫色系 (3) ===== */
  {
    name: 'purple',
    label: '星云 · 紫',
    primary: '#7B5EA7',
    success: '#A07BC4',
    warning: '#D4A0C4',
    danger: '#C47BA0',
    colors: ['#7B5EA7', '#9F82C4', '#C4AEDC', '#E2D4F0', '#F4EEFA'],
    category: 'purple',
  },
  {
    name: 'lavender',
    label: '薰衣草 · 淡紫',
    primary: '#8A7AC4',
    success: '#7A9A7A',
    warning: '#D4B84A',
    danger: '#C46A7A',
    colors: ['#8A7AC4', '#B09AD8', '#C8BCE8', '#E2DCF2', '#F4F0FA'],
    category: 'purple',
  },
  {
    name: 'magenta',
    label: '品红 · 紫粉',
    primary: '#9C27B0',
    success: '#AB47BC',
    warning: '#FFA726',
    danger: '#EF5350',
    colors: ['#9C27B0', '#AB47BC', '#CE93D8', '#E1BEE7', '#F3E5F5'],
    category: 'purple',
  },

  /* ===== 红色系 (3) ===== */
  {
    name: 'cherry',
    label: '樱花 · 粉',
    primary: '#E05A7A',
    success: '#E07A9A',
    warning: '#E8B07A',
    danger: '#D94A6A',
    colors: ['#E05A7A', '#E8829A', '#F0AABA', '#F8D4DE', '#FDEFF2'],
    category: 'red',
  },
  {
    name: 'coral',
    label: '珊瑚 · 红',
    primary: '#E0655A',
    success: '#7AB87A',
    warning: '#E8B04A',
    danger: '#D94A4A',
    colors: ['#E0655A', '#E88A7A', '#F0B0A0', '#F8D4CC', '#FDEEEC'],
    category: 'red',
  },
  {
    name: 'rose',
    label: '玫瑰 · 酒红',
    primary: '#A84A6A',
    success: '#7A8A5A',
    warning: '#C4A04A',
    danger: '#B84A4A',
    colors: ['#A84A6A', '#C47A9A', '#D8A8BA', '#E8D0D8', '#F4EAEC'],
    category: 'red',
  },

  /* ===== 中性色 (4) ===== */
  {
    name: 'graphite',
    label: '石墨 · 灰蓝',
    primary: '#4A5A6A',
    success: '#5A8A7A',
    warning: '#B8A84A',
    danger: '#B85A5A',
    colors: ['#4A5A6A', '#6A7A8A', '#8A9AAA', '#B0C0CC', '#E0E8EC'],
    category: 'neutral',
  },
  {
    name: 'slate',
    label: '板岩 · 冷灰',
    primary: '#607D8B',
    success: '#78909C',
    warning: '#FFB300',
    danger: '#E53935',
    colors: ['#607D8B', '#78909C', '#90A4AE', '#B0BEC5', '#ECEFF1'],
    category: 'neutral',
  },
  {
    name: 'taupe',
    label: '灰褐 · 暖灰',
    primary: '#8D6E63',
    success: '#A1887F',
    warning: '#D4A84A',
    danger: '#C45A4A',
    colors: ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9'],
    category: 'neutral',
  },
  {
    name: 'charcoal',
    label: '木炭 · 深灰',
    primary: '#37474F',
    success: '#546E7A',
    warning: '#FFA726',
    danger: '#EF5350',
    colors: ['#37474F', '#546E7A', '#78909C', '#B0BEC5', '#ECEFF1'],
    category: 'neutral',
  },
]

/** 根据 hex 和百分比调整颜色（正数变亮，负数变暗） */
export function adjustColor(hex: string, percent: number): string {
  let r = Number.parseInt(hex.slice(1, 3), 16)
  let g = Number.parseInt(hex.slice(3, 5), 16)
  let b = Number.parseInt(hex.slice(5, 7), 16)
  const delta = (percent / 100) * 255
  r = Math.min(255, Math.max(0, Math.round(r + delta)))
  g = Math.min(255, Math.max(0, Math.round(g + delta)))
  b = Math.min(255, Math.max(0, Math.round(b + delta)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** 根据 name 查找预设 */
export function findPreset(name: string): ThemePreset | undefined {
  return THEME_PRESETS.find(p => p.name === name)
}
