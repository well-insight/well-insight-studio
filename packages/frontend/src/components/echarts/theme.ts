/** 读取 Element Plus 主题色，供 ECharts 配置复用 */
export function getEChartsThemeColors() {
  if (typeof document === 'undefined') {
    return {
      text: '#303133',
      textSecondary: '#909399',
      textRegular: '#606266',
      border: '#ebeef5',
      bg: '#ffffff',
      primary: '#409EFF',
      mask: 'rgba(255, 255, 255, 0.8)',
    }
  }
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback
  return {
    text: read('--el-text-color-primary', '#303133'),
    textSecondary: read('--el-text-color-secondary', '#909399'),
    textRegular: read('--el-text-color-regular', '#606266'),
    border: read('--el-border-color-lighter', '#ebeef5'),
    bg: read('--el-bg-color', '#ffffff'),
    primary: read('--el-color-primary', '#409EFF'),
    mask: read('--el-mask-color', 'rgba(255, 255, 255, 0.8)'),
  }
}

/** ECharts showLoading 选项，跟随明暗主题 */
export function getEChartsLoadingOpts() {
  const theme = getEChartsThemeColors()
  return {
    text: '',
    color: theme.primary,
    textColor: theme.text,
    // 默认白遮罩在暗色下刺眼；走 --el-mask-color
    maskColor: theme.mask,
  }
}
