import { computed, inject, provide, type App, type InjectionKey, type MaybeRefOrGetter, toValue } from 'vue'
import type { WdAppendTo } from './overlay'
import type { WdInputVariant, WdSizeInput } from './types'

/** Global defaults inspired by Element Plus ConfigProvider / PrimeVue app config. */
export interface WdGlobalConfig {
  /** Default Teleport target for overlays. Defaults to `'body'`. */
  appendTo?: WdAppendTo
  /** Default control size for form components that support `size`. */
  size?: WdSizeInput
  /** Default input surface style. */
  inputVariant?: WdInputVariant
  /** Starting z-index budget for overlays (modal / menu / tooltip layers). */
  zIndex?: number
  /** Shared UI copy; components fall back to built-in Chinese defaults. */
  locale?: WdLocaleConfig
}

export interface WdLocaleConfig {
  accept?: string
  reject?: string
  emptyMessage?: string
  searchPlaceholder?: string
  datePickerPlaceholder?: string
  selectPlaceholder?: string
  clear?: string
  close?: string
}

export const WD_CONFIG_KEY: InjectionKey<MaybeRefOrGetter<WdGlobalConfig>> = Symbol('wdConfig')

const defaultConfig: Required<Pick<WdGlobalConfig, 'appendTo' | 'zIndex'>> & WdGlobalConfig = {
  appendTo: 'body',
  zIndex: 1000,
  inputVariant: 'outlined',
  locale: {
    accept: '确认',
    reject: '取消',
    emptyMessage: '暂无数据',
    searchPlaceholder: '搜索',
    datePickerPlaceholder: '选择日期',
    selectPlaceholder: '请选择',
    clear: '清除',
    close: '关闭',
  },
}

export function getDefaultWdConfig(): WdGlobalConfig {
  return {
    appendTo: defaultConfig.appendTo,
    zIndex: defaultConfig.zIndex,
    inputVariant: defaultConfig.inputVariant,
    locale: { ...defaultConfig.locale },
  }
}

export function provideWdConfig(config: MaybeRefOrGetter<WdGlobalConfig>) {
  provide(WD_CONFIG_KEY, config)
}

export function useWdConfig() {
  const injected = inject(WD_CONFIG_KEY, null)
  return computed<WdGlobalConfig>(() => {
    const value = injected ? toValue(injected) : {}
    return {
      ...getDefaultWdConfig(),
      ...value,
      locale: {
        ...getDefaultWdConfig().locale,
        ...value.locale,
      },
    }
  })
}

/** Resolve overlay mount target: local props > ConfigProvider > body. */
export function resolveConfiguredAppendTo(
  local: WdAppendTo | undefined,
  configAppendTo: WdAppendTo | undefined,
): WdAppendTo {
  if (local !== undefined) return local
  if (configAppendTo !== undefined) return configAppendTo
  return 'body'
}

/**
 * Vue plugin entry (PrimeVue / Element Plus style).
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createWellDesign } from '@well-design/ui'
 *
 * createApp(App).use(createWellDesign({ appendTo: 'body', zIndex: 2000 })).mount('#app')
 * ```
 */
export function createWellDesign(options: WdGlobalConfig = {}) {
  return {
    install(app: App) {
      app.provide(WD_CONFIG_KEY, options)
      app.config.globalProperties.$wd = options
    },
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $wd?: WdGlobalConfig
  }
}
