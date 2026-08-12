import type { ConfigProviderProps } from 'element-plus'
import type { ThemePreset } from '@/styles/theme/presets'
import type { AppearanceStyleId, ThemeConfig, ThemeMode, ThemeSize } from '@/styles/theme/tokens'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ThemeEnum } from '@/enums/styleEnum'
import { APPEARANCE_STYLES, findAppearance, normalizeAppearance } from '@/styles/theme/appearances'
import { adjustColor, findPreset, THEME_PRESETS } from '@/styles/theme/presets'
import {
  applyAppearanceVars,
  applyBorderRadiusVars,
  applyCubeColorVars,
  applyPrimaryColor,
  DEFAULT_THEME_CONFIG,
  resolveIsDark,
  WELLCUBE_PRIMARY,
} from '@/styles/theme/tokens'

const STORAGE_KEY = 'wellcube-theme-config'
const LEGACY_STORAGE_KEY = 'wellcube-theme'
const STORAGE_VERSION_KEY = 'wellcube-theme-version'
/** v14：Cube 默认配色改为清风蓝 */
const CURRENT_STORAGE_VERSION = 14

const DEFAULT_PRIMARY = findPreset(DEFAULT_THEME_CONFIG.presetId)?.primary ?? WELLCUBE_PRIMARY

function loadConfig(): ThemeConfig {
  try {
    const storedVersion = Number(localStorage.getItem(STORAGE_VERSION_KEY)) || 0
    if (storedVersion < CURRENT_STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION))
      return { ...DEFAULT_THEME_CONFIG, primary: DEFAULT_PRIMARY }
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeConfig>
      const presetId = typeof parsed.presetId === 'string' && findPreset(parsed.presetId)
        ? parsed.presetId
        : DEFAULT_THEME_CONFIG.presetId
      const preset = findPreset(presetId)
      return {
        mode: normalizeMode(parsed.mode),
        primary: typeof parsed.primary === 'string' && parsed.primary
          ? parsed.primary
          : (preset?.primary ?? DEFAULT_PRIMARY),
        size: normalizeSize(parsed.size),
        appearance: normalizeAppearance(parsed.appearance),
        presetId,
        borderRadius: normalizeBorderRadius(parsed.borderRadius),
      }
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === ThemeEnum.DARK || legacy === 'dark')
      return { ...DEFAULT_THEME_CONFIG, primary: DEFAULT_PRIMARY, mode: 'dark' }
    if (legacy === ThemeEnum.LIGHT || legacy === 'light')
      return { ...DEFAULT_THEME_CONFIG, primary: DEFAULT_PRIMARY, mode: 'light' }
  }
  catch {
    /* ignore */
  }
  return { ...DEFAULT_THEME_CONFIG, primary: DEFAULT_PRIMARY }
}

function normalizeMode(mode: unknown): ThemeMode {
  if (mode === 'light' || mode === 'dark' || mode === 'system')
    return mode
  return DEFAULT_THEME_CONFIG.mode
}

function normalizeSize(size: unknown): ThemeSize {
  if (size === 'large' || size === 'default' || size === 'small')
    return size
  return DEFAULT_THEME_CONFIG.size
}

function normalizeBorderRadius(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.max(0, Math.round(value))
  return DEFAULT_THEME_CONFIG.borderRadius
}

function persist(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    localStorage.setItem(LEGACY_STORAGE_KEY, resolveIsDark(config.mode) ? ThemeEnum.DARK : ThemeEnum.LIGHT)
  }
  catch {
    /* ignore */
  }
}

export const useThemeStore = defineStore('theme', () => {
  const config = ref<ThemeConfig>(loadConfig())
  const isDark = ref(resolveIsDark(config.value.mode))
  const currentPresetId = ref<string>(config.value.presetId)

  const theme = computed(() => (isDark.value ? ThemeEnum.DARK : ThemeEnum.LIGHT))
  const presets = computed<ThemePreset[]>(() => THEME_PRESETS)
  const appearances = computed(() => APPEARANCE_STYLES)

  const currentPreset = computed<ThemePreset>(() => {
    return findPreset(currentPresetId.value) ?? findPreset(DEFAULT_THEME_CONFIG.presetId) ?? THEME_PRESETS[0]
  })

  const currentAppearance = computed(() => findAppearance(config.value.appearance))

  const epConfig = computed<Partial<ConfigProviderProps>>(() => ({
    size: config.value.size,
    zIndex: 3000,
    button: {
      autoInsertSpace: true,
    },
  }))

  function applyAuxColors(preset: ThemePreset) {
    const root = document.documentElement
    root.style.setProperty('--el-color-success', preset.success)
    root.style.setProperty('--el-color-success-light-5', adjustColor(preset.success, 50))
    root.style.setProperty('--el-color-success-light-7', adjustColor(preset.success, 70))
    root.style.setProperty('--el-color-success-dark-2', adjustColor(preset.success, -20))
    root.style.setProperty('--el-color-warning', preset.warning)
    root.style.setProperty('--el-color-warning-light-5', adjustColor(preset.warning, 50))
    root.style.setProperty('--el-color-warning-light-7', adjustColor(preset.warning, 70))
    root.style.setProperty('--el-color-warning-dark-2', adjustColor(preset.warning, -20))
    root.style.setProperty('--el-color-danger', preset.danger)
    root.style.setProperty('--el-color-danger-light-5', adjustColor(preset.danger, 50))
    root.style.setProperty('--el-color-danger-light-7', adjustColor(preset.danger, 70))
    root.style.setProperty('--el-color-danger-dark-2', adjustColor(preset.danger, -20))
  }

  function syncDom() {
    isDark.value = resolveIsDark(config.value.mode)
    applyAppearanceVars(isDark.value, config.value.appearance)
    applyPrimaryColor(config.value.primary, isDark.value, config.value.appearance)
    applyBorderRadiusVars(config.value.borderRadius)
    const preset = findPreset(config.value.presetId)
    if (preset)
      applyAuxColors(preset)
    applyCubeColorVars(isDark.value, config.value.appearance)
    persist(config.value)
  }

  function setMode(mode: ThemeMode) {
    config.value = { ...config.value, mode }
    syncDom()
  }

  function setPrimary(primary: string) {
    config.value = { ...config.value, primary: primary || DEFAULT_PRIMARY }
    syncDom()
  }

  function setSize(size: ThemeSize) {
    config.value = { ...config.value, size }
    persist(config.value)
  }

  function setBorderRadius(radiusPx: number) {
    config.value = { ...config.value, borderRadius: normalizeBorderRadius(radiusPx) }
    applyBorderRadiusVars(config.value.borderRadius)
    persist(config.value)
  }

  function setAppearance(appearance: AppearanceStyleId, applyRecommended = false) {
    const id = normalizeAppearance(appearance)
    const style = findAppearance(id)
    if (applyRecommended && style.recommended) {
      const rec = style.recommended
      const preset = findPreset(rec.presetId)
      currentPresetId.value = rec.presetId
      config.value = {
        ...config.value,
        appearance: id,
        mode: rec.mode,
        size: rec.size,
        borderRadius: rec.borderRadius,
        presetId: rec.presetId,
        primary: preset?.primary ?? config.value.primary,
      }
    }
    else {
      config.value = { ...config.value, appearance: id }
    }
    syncDom()
  }

  function resetTheme() {
    const preset = findPreset(DEFAULT_THEME_CONFIG.presetId)
    currentPresetId.value = DEFAULT_THEME_CONFIG.presetId
    config.value = {
      ...DEFAULT_THEME_CONFIG,
      primary: preset?.primary ?? DEFAULT_PRIMARY,
    }
    syncDom()
  }

  function applyTheme(val: ThemeEnum) {
    setMode(val === ThemeEnum.DARK ? 'dark' : 'light')
  }

  function toggleTheme() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  function applyPreset(name: string) {
    const preset = findPreset(name)
    if (!preset)
      return
    currentPresetId.value = preset.name
    config.value = {
      ...config.value,
      presetId: preset.name,
      primary: preset.primary,
    }
    syncDom()
  }

  // 首次同步：含圆角与默认配色辅色
  currentPresetId.value = config.value.presetId
  syncDom()

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (mediaQuery) {
    const onChange = () => {
      if (config.value.mode === 'system')
        syncDom()
    }
    mediaQuery.addEventListener('change', onChange)
  }

  watch(
    () => [config.value.primary, isDark.value, config.value.appearance] as const,
    () => {
      applyPrimaryColor(config.value.primary, isDark.value, config.value.appearance)
      applyCubeColorVars(isDark.value, config.value.appearance)
    },
  )

  return {
    config,
    theme,
    isDark,
    epConfig,
    currentPresetId,
    presets,
    appearances,
    currentPreset,
    currentAppearance,
    setMode,
    setPrimary,
    setSize,
    setBorderRadius,
    setAppearance,
    resetTheme,
    applyTheme,
    toggleTheme,
    applyPreset,
  }
})
