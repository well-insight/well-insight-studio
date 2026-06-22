import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ThemeEnum } from '@/enums/styleEnum'

const STORAGE_KEY = 'wellcube-theme'

function loadTheme(): ThemeEnum {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === ThemeEnum.DARK || saved === ThemeEnum.LIGHT) {
      return saved
    }
  } catch {
    /* ignore */
  }
  // 跟随系统偏好
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return ThemeEnum.DARK
  }
  return ThemeEnum.LIGHT
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeEnum>(loadTheme())

  const isDark = ref(theme.value === ThemeEnum.DARK)

  function applyTheme(val: ThemeEnum) {
    theme.value = val
    isDark.value = val === ThemeEnum.DARK
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem(STORAGE_KEY, val)
    } catch {
      /* ignore */
    }
  }

  function toggleTheme() {
    applyTheme(isDark.value ? ThemeEnum.LIGHT : ThemeEnum.DARK)
  }

  // 初始化时应用
  applyTheme(theme.value)

  // 监听系统主题变化
  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (mediaQuery) {
    mediaQuery.addEventListener('change', (e) => {
      // 只在用户没有手动保存过偏好时才跟随系统
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT)
      }
    })
  }

  return { theme, isDark, toggleTheme, applyTheme }
})
