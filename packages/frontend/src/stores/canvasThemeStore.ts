/**
 * 画布主题 Store
 * 仿照 echarts-theme-builder 的 useThemeStore 模式设计
 * 管理主题切换、自定义主题、主题持久化
 */
import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import type { CanvasTheme } from '@/common/types/canvasTheme'
import { themeToCSSVars } from '@/common/types/canvasTheme'
import { PREDEFINED_THEMES, getPredefinedTheme } from '@/common/types/predefinedThemes'
import { cloneDeep, merge } from 'lodash-es'

/** 默认主题 ID */
const DEFAULT_THEME_ID = 'default'

/** localStorage 存储 key */
const STORAGE_KEY = 'canvas-theme-config'

/** 保存到 localStorage 的主题配置结构 */
interface StoredThemeConfig {
  /** 当前选中的主题 ID（自定义主题时为 'custom'） */
  activeThemeId: string
  /** 自定义主题数据（当 activeThemeId === 'custom' 时使用） */
  customTheme?: CanvasTheme | null
}

/**
 * 创建默认自定义主题（以默认主题为基础）
 */
function createDefaultCustomTheme(): CanvasTheme {
  const base = getPredefinedTheme(DEFAULT_THEME_ID)
  return cloneDeep(base ?? PREDEFINED_THEMES.default)
}

/**
 * 从 localStorage 读取主题配置
 */
function loadStoredConfig(): StoredThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  }
  catch {
    // ignore
  }
  return { activeThemeId: DEFAULT_THEME_ID, customTheme: null }
}

/**
 * 保存主题配置到 localStorage
 */
function saveStoredConfig(config: StoredThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }
  catch {
    // ignore
  }
}

export const useCanvasThemeStore = defineStore('canvasTheme', () => {
  // 从 localStorage 恢复配置
  const stored = loadStoredConfig()

  /** 当前选中的主题 ID */
  const activeThemeId = ref<string>(stored.activeThemeId ?? DEFAULT_THEME_ID)

  /** 自定义主题数据 */
  const customTheme = ref<CanvasTheme>(
    stored.customTheme ?? createDefaultCustomTheme(),
  )

  /** 当前生效的主题（计算属性） */
  const currentTheme = computed<CanvasTheme>(() => {
    if (activeThemeId.value === 'custom') {
      return customTheme.value
    }
    return getPredefinedTheme(activeThemeId.value) ?? PREDEFINED_THEMES.default
  })

  /** 主题对应的 CSS 变量 */
  const themeCSSVars = computed(() => themeToCSSVars(currentTheme.value))

  /** 是否为自定义主题模式 */
  const isCustomMode = computed(() => activeThemeId.value === 'custom')

  /** 是否为暗色主题 */
  const isDark = computed(() => currentTheme.value.isDark)

  /** 图表调色板 */
  const chartColors = computed(() => currentTheme.value.chartColors)

  /**
   * 切换到预定义主题
   */
  function selectPredefinedTheme(themeId: string) {
    if (PREDEFINED_THEMES[themeId]) {
      activeThemeId.value = themeId
      persistConfig()
    }
  }

  /**
   * 切换到自定义主题模式
   */
  function switchToCustom() {
    activeThemeId.value = 'custom'
    persistConfig()
  }

  /**
   * 更新自定义主题的某个颜色值
   */
  function updateCustomThemeColor(path: string, value: string) {
    const keys = path.split('.')
    let target: any = customTheme.value
    for (let i = 0; i < keys.length - 1; i++) {
      target = target?.[keys[i]]
    }
    if (target && keys[keys.length - 1] in target) {
      target[keys[keys.length - 1]] = value
    }
    persistConfig()
  }

  /**
   * 更新自定义主题的图表调色板
   */
  function updateChartColors(colors: string[]) {
    customTheme.value.chartColors = colors
    persistConfig()
  }

  /**
   * 基于当前主题创建自定义主题并进入编辑模式
   */
  function forkCurrentTheme() {
    customTheme.value = cloneDeep(currentTheme.value)
    customTheme.value.id = 'custom'
    customTheme.value.name = `${currentTheme.value.name} (自定义)`
    activeThemeId.value = 'custom'
    persistConfig()
  }

  /**
   * 重置自定义主题到默认
   */
  function resetCustomTheme() {
    customTheme.value = createDefaultCustomTheme()
    if (activeThemeId.value === 'custom') {
      persistConfig()
    }
  }

  /**
   * 应用主题到目标元素
   */
  function applyThemeToElement(el: HTMLElement | null) {
    if (!el) return
    const vars = themeCSSVars.value
    Object.entries(vars).forEach(([key, value]) => {
      el.style.setProperty(key, value)
    })
  }

  /**
   * 持久化到 localStorage
   */
  function persistConfig() {
    saveStoredConfig({
      activeThemeId: activeThemeId.value,
      customTheme: activeThemeId.value === 'custom' ? customTheme.value : null,
    })
  }

  return {
    activeThemeId,
    customTheme,
    currentTheme,
    themeCSSVars,
    isCustomMode,
    isDark,
    chartColors,
    selectPredefinedTheme,
    switchToCustom,
    updateCustomThemeColor,
    updateChartColors,
    forkCurrentTheme,
    resetCustomTheme,
    applyThemeToElement,
  }
})
