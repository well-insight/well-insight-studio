import type { ConfigProviderProps } from 'element-plus'
import type { ThemeConfig, ThemeMode, ThemeSize } from '@/styles/theme/tokens'
import type { ThemePreset } from '@/styles/theme/presets'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ThemeEnum } from '@/enums/styleEnum'
import {
  applyAppearanceVars,
  applyPrimaryColor,
  DEFAULT_THEME_CONFIG,
  resolveIsDark,

  WELLCUBE_PRIMARY,
} from '@/styles/theme/tokens'
import { adjustColor, findPreset, THEME_PRESETS } from '@/styles/theme/presets'

const STORAGE_KEY = 'wellcube-theme-config'
const LEGACY_STORAGE_KEY = 'wellcube-theme'
const STORAGE_VERSION_KEY = 'wellcube-theme-version'
const CURRENT_STORAGE_VERSION = 2

function loadConfig(): ThemeConfig {
  try {
    const storedVersion = Number(localStorage.getItem(STORAGE_VERSION_KEY)) || 0
    if (storedVersion < CURRENT_STORAGE_VERSION) {
      // 存储版本过期，清理旧缓存，使用新默认值
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION))
      return { ...DEFAULT_THEME_CONFIG }
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeConfig>
      return {
        mode: normalizeMode(parsed.mode),
        primary: typeof parsed.primary === 'string' && parsed.primary ? parsed.primary : WELLCUBE_PRIMARY,
        size: normalizeSize(parsed.size),
      }
    }

    // 兼容旧版仅存 light/dark 的键
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === ThemeEnum.DARK || legacy === 'dark')
      return { ...DEFAULT_THEME_CONFIG, mode: 'dark' }
    if (legacy === ThemeEnum.LIGHT || legacy === 'light')
      return { ...DEFAULT_THEME_CONFIG, mode: 'light' }
  }
  catch {
    /* ignore */
  }
  return { ...DEFAULT_THEME_CONFIG }
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

function persist(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    // 同步旧键，便于其他读旧字段的代码
    localStorage.setItem(LEGACY_STORAGE_KEY, resolveIsDark(config.mode) ? ThemeEnum.DARK : ThemeEnum.LIGHT)
  }
  catch {
    /* ignore */
  }
}

export const useThemeStore = defineStore('theme', () => {
  const config = ref<ThemeConfig>(loadConfig())
  const isDark = ref(resolveIsDark(config.value.mode))
  const currentPresetId = ref<string>('breeze')

  /** 兼容旧字段：当前实际生效的明暗 */
  const theme = computed(() => (isDark.value ? ThemeEnum.DARK : ThemeEnum.LIGHT))

  /** 所有可用预设列表 */
  const presets = computed<ThemePreset[]>(() => THEME_PRESETS)

  /** 当前激活的预设 */
  const currentPreset = computed<ThemePreset>(() => {
    return findPreset(currentPresetId.value) ?? THEME_PRESETS[0]
  })

  /** 供 el-config-provider 绑定 */
  const epConfig = computed<Partial<ConfigProviderProps>>(() => ({
    size: config.value.size,
    zIndex: 3000,
    button: {
      autoInsertSpace: true,
    },
  }))

  function syncDom() {
    isDark.value = resolveIsDark(config.value.mode)
    applyAppearanceVars(isDark.value)
    applyPrimaryColor(config.value.primary, isDark.value)
    persist(config.value)
  }

  function setMode(mode: ThemeMode) {
    config.value = { ...config.value, mode }
    syncDom()
  }

  function setPrimary(primary: string) {
    config.value = { ...config.value, primary: primary || WELLCUBE_PRIMARY }
    syncDom()
  }

  function setSize(size: ThemeSize) {
    config.value = { ...config.value, size }
    persist(config.value)
  }

  function resetTheme() {
    config.value = { ...DEFAULT_THEME_CONFIG }
    syncDom()
  }

  /** @deprecated 使用 setMode；保留给旧入口快速切换 */
  function applyTheme(val: ThemeEnum) {
    setMode(val === ThemeEnum.DARK ? 'dark' : 'light')
  }

  function toggleTheme() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  /** 应用预设主题 */
  function applyPreset(name: string) {
    const preset = findPreset(name)
    if (!preset) return
    currentPresetId.value = preset.name
    setPrimary(preset.primary)
    applyAuxColors(preset)
  }

  /** 将 success / warning / danger 及变体写入 CSS 变量 */
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
    () => [config.value.primary, isDark.value] as const,
    () => applyPrimaryColor(config.value.primary, isDark.value),
  )

  return {
    config,
    theme,
    isDark,
    epConfig,
    currentPresetId,
    presets,
    currentPreset,
    setMode,
    setPrimary,
    setSize,
    resetTheme,
    applyTheme,
    toggleTheme,
    applyPreset,
  }
})
