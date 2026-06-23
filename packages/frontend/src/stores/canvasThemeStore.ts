/**
 * 画布主题 Store
 * 管理主题切换、多自定义主题的增删改、主题持久化
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CanvasTheme } from '@/common/types/canvasTheme'
import { themeToCSSVars } from '@/common/types/canvasTheme'
import {
  PREDEFINED_THEMES,
  getPredefinedTheme,
  PREDEFINED_THEME_METAS,
} from '@/common/types/predefinedThemes'
import { cloneDeep } from 'lodash-es'
import { getPresetEchartsJsonName } from '@/common/types/predefinedThemes'

const DEFAULT_THEME_ID = 'v5'
const STORAGE_KEY = 'canvas-theme-config'

interface StoredThemeConfig {
  activeThemeId: string
  userThemes: UserThemeItem[]
}

export interface UserThemeItem {
  id: string
  name: string
  theme: CanvasTheme
}

export interface ThemeMeta {
  id: string
  name: string
  isPreset: boolean
  previewColors: string[]
  previewBg: string
  isDark: boolean
}

function loadStoredConfig(): StoredThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        activeThemeId: parsed.activeThemeId ?? DEFAULT_THEME_ID,
        userThemes: parsed.userThemes ?? [],
      }
    }
  }
  catch { /* ignore */ }
  return { activeThemeId: DEFAULT_THEME_ID, userThemes: [] }
}

function saveStoredConfig(config: StoredThemeConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) }
  catch { /* ignore */ }
}

export const useCanvasThemeStore = defineStore('canvasTheme', () => {
  const stored = loadStoredConfig()

  const activeThemeId = ref<string>(stored.activeThemeId ?? DEFAULT_THEME_ID)
  const userThemes = ref<UserThemeItem[]>(stored.userThemes)

  const currentTheme = computed<CanvasTheme>(() => {
    const override = userThemes.value.find(t => t.id === activeThemeId.value)
    if (override)
      return override.theme

    if (activeThemeId.value.startsWith('user_')) {
      const found = userThemes.value.find(t => t.id === activeThemeId.value)
      if (found)
        return found.theme
    }
    return getPredefinedTheme(activeThemeId.value) ?? getPredefinedTheme('v5')!
  })

  const themeCSSVars = computed(() => themeToCSSVars(currentTheme.value))
  const isDark = computed(() => currentTheme.value.isDark)
  const chartColors = computed(() => currentTheme.value.chartColors ?? [])
  const isPresetActive = computed(() => !activeThemeId.value.startsWith('user_'))

  /** 当前预设主题对应的 ECharts JSON 文件名（用于加载完整配置） */
  const currentPresetEchartsName = computed(() => getPresetEchartsJsonName(activeThemeId.value))

  const allThemeMetas = computed<ThemeMeta[]>(() => {
    const presetIds = new Set(PREDEFINED_THEME_METAS.map(m => m.id))
    const presetMetas: ThemeMeta[] = PREDEFINED_THEME_METAS.map((m) => {
      const override = userThemes.value.find(t => t.id === m.id)
      if (override) {
        return {
          id: m.id,
          name: override.name,
          isPreset: true,
          previewColors: (override.theme.chartColors ?? []).slice(0, 5),
          previewBg: override.theme.bg?.page ?? m.previewBg,
          isDark: override.theme.isDark,
        }
      }
      return {
        id: m.id,
        name: m.name,
        isPreset: true,
        previewColors: m.previewColors,
        previewBg: m.previewBg,
        isDark: m.isDark,
      }
    })
    const userMetas: ThemeMeta[] = userThemes.value
      .filter(t => !presetIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        isPreset: false,
        previewColors: (t.theme.chartColors ?? []).slice(0, 5),
        previewBg: t.theme.bg?.page ?? '#f5f7fa',
        isDark: t.theme.isDark,
      }))
    return [...presetMetas, ...userMetas]
  })

  function getThemeById(id: string): CanvasTheme | undefined {
    const override = userThemes.value.find(t => t.id === id)
    if (override)
      return cloneDeep(override.theme)

    if (id.startsWith('user_'))
      return undefined

    const preset = getPredefinedTheme(id)
    return preset ? cloneDeep(preset) : undefined
  }

  function selectTheme(id: string) {
    activeThemeId.value = id
    persistConfig()
  }

  function saveUserTheme(id: string | null, name: string, theme: CanvasTheme): string {
    const themeId = id ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    theme.id = themeId
    theme.name = name
    const idx = userThemes.value.findIndex(t => t.id === themeId)
    if (idx >= 0) {
      userThemes.value[idx] = { id: themeId, name, theme }
    }
    else {
      userThemes.value.push({ id: themeId, name, theme })
    }
    activeThemeId.value = themeId
    persistConfig()
    return themeId
  }

  function deleteUserTheme(id: string) {
    const idx = userThemes.value.findIndex(t => t.id === id)
    if (idx < 0) return
    userThemes.value.splice(idx, 1)
    if (activeThemeId.value === id) {
      activeThemeId.value = DEFAULT_THEME_ID
    }
    persistConfig()
  }

  function getDefaultTheme(): CanvasTheme {
    return cloneDeep(getPredefinedTheme('v5')!)
  }

  function applyThemeToElement(el: HTMLElement | null) {
    if (!el) return
    const vars = themeCSSVars.value
    Object.entries(vars).forEach(([key, value]) => {
      el.style.setProperty(key, value)
    })
  }

  function persistConfig() {
    saveStoredConfig({
      activeThemeId: activeThemeId.value,
      userThemes: userThemes.value,
    })
  }

  return {
    activeThemeId,
    userThemes,
    currentTheme,
    themeCSSVars,
    isDark,
    chartColors,
    isPresetActive,
    currentPresetEchartsName,
    allThemeMetas,
    getThemeById,
    selectTheme,
    saveUserTheme,
    deleteUserTheme,
    getDefaultTheme,
    applyThemeToElement,
  }
})
