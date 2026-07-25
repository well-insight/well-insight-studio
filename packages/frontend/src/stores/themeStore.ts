import type { ConfigProviderProps } from 'element-plus'
import type { ThemeConfig, ThemeMode, ThemeSize } from '@/styles/theme/tokens'
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

  /** 兼容旧字段：当前实际生效的明暗 */
  const theme = computed(() => (isDark.value ? ThemeEnum.DARK : ThemeEnum.LIGHT))

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
    setMode,
    setPrimary,
    setSize,
    resetTheme,
    applyTheme,
    toggleTheme,
  }
})
