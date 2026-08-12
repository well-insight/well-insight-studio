/**
 * 画布主题 Store
 * 画布色板跟随系统壳层主题（侧栏「主题设置」），不再单独维护编辑器内主题。
 */
import type { CanvasTheme } from '@/common/types/canvasTheme'
import { themeToCSSVars } from '@/common/types/canvasTheme'
import { buildSystemCanvasTheme } from '@/common/utils/systemCanvasTheme'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

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

export const useCanvasThemeStore = defineStore('canvasTheme', () => {
  const systemTheme = useThemeStore()
  const { isDark, config, currentPreset } = storeToRefs(systemTheme)

  /** DOM 变量写入后递增，确保读到最新 CSS 变量 */
  const styleRevision = ref(0)

  watch(
    () => [
      isDark.value,
      config.value.primary,
      config.value.presetId,
      config.value.appearance,
      config.value.mode,
    ] as const,
    async () => {
      await Promise.resolve()
      styleRevision.value++
    },
    { immediate: true },
  )

  const currentTheme = computed<CanvasTheme>(() => {
    void styleRevision.value
    return buildSystemCanvasTheme({
      isDark: isDark.value,
      primary: config.value.primary,
      presetId: config.value.presetId,
    })
  })

  const themeCSSVars = computed(() => themeToCSSVars(currentTheme.value))
  const chartColors = computed(() => currentTheme.value.chartColors ?? [])
  const isPresetActive = computed(() => true)
  const currentPresetEchartsName = computed(() => undefined as string | undefined)
  const activeThemeId = computed(() => 'system')
  const userThemes = ref<UserThemeItem[]>([])

  const allThemeMetas = computed<ThemeMeta[]>(() => {
    const theme = currentTheme.value
    return [{
      id: 'system',
      name: currentPreset.value?.label ? `系统 · ${currentPreset.value.label}` : '系统主题',
      isPreset: true,
      previewColors: (theme.chartColors ?? []).slice(0, 5),
      previewBg: theme.bg?.page ?? '#fff',
      isDark: theme.isDark,
    }]
  })

  function getThemeById(_id: string): CanvasTheme | undefined {
    return currentTheme.value
  }

  function selectTheme(_id: string) {
    // 画布主题已绑定系统主题，忽略独立切换
  }

  function saveUserTheme(_id: string | null, _name: string, _theme: CanvasTheme): string {
    return 'system'
  }

  function deleteUserTheme(_id: string) {
    // no-op
  }

  function getDefaultTheme(): CanvasTheme {
    return currentTheme.value
  }

  function applyThemeToElement(el: HTMLElement | null) {
    if (!el)
      return
    const vars = themeCSSVars.value
    Object.entries(vars).forEach(([key, value]) => {
      el.style.setProperty(key, value)
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
