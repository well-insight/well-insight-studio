/**
 * 从 public/echarts-themes/*.json 加载完整配置并合并到预设画布主题
 */
import { PREDEFINED_THEMES, PRESETS } from '@/common/types/predefinedThemes'
import { loadPresetEchartsTheme } from '@/common/utils/presetEchartsThemes'
import { applyEchartsThemeToCanvas } from '@/common/utils/themeBridge'

let hydratePromise: Promise<void> | null = null

export async function hydratePredefinedThemes(): Promise<void> {
  if (hydratePromise)
    return hydratePromise

  hydratePromise = Promise.all(PRESETS.map(async (preset) => {
    const theme = PREDEFINED_THEMES[preset.id]
    if (!theme)
      return

    const echarts = await loadPresetEchartsTheme(preset.id)
    if (echarts) {
      applyEchartsThemeToCanvas(theme, echarts, {
        isDark: preset.isDark,
        presetBg: preset.bg,
      })
    }
  })).then(() => undefined)

  return hydratePromise
}
