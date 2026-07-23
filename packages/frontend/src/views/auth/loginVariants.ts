import type { Component } from 'vue'

/**
 * 登录页变体标识。
 * 通过环境变量 VITE_LOGIN_VARIANT 切换；新增变体时在此注册即可。
 */
export type LoginVariant = 'classic' | 'business' | 'hero' | 'cube'

type LoginVariantLoader = () => Promise<{ default: Component }>

const loginVariantLoaders: Record<LoginVariant, LoginVariantLoader> = {
  /** 现有分栏 + 动画角色登录页 */
  classic: () => import('./Login.vue'),
  /** 业务向全屏插画登录页（WellCube 能力介绍） */
  business: () => import('./LoginBusiness.vue'),
  /** 纯英雄图背景登录页（历史备用） */
  hero: () => import('./Login2.vue'),
  /** 签名立方体设计风格登录页（酸性、区别度强） */
  cube: () => import('./LoginCube.vue'),
}

const DEFAULT_LOGIN_VARIANT: LoginVariant = 'cube'

function normalizeVariant(raw: string | undefined): LoginVariant {
  const key = (raw ?? '').trim().toLowerCase() as LoginVariant
  if (key && key in loginVariantLoaders)
    return key
  if (raw)
    console.warn(`[loginVariants] Unknown VITE_LOGIN_VARIANT="${raw}", fallback to "${DEFAULT_LOGIN_VARIANT}"`)
  return DEFAULT_LOGIN_VARIANT
}

/** 当前环境配置的登录页变体 */
export function getLoginVariant(): LoginVariant {
  return normalizeVariant(import.meta.env.VITE_LOGIN_VARIANT)
}

/** 供 vue-router 懒加载的登录页组件 */
export function loadLoginPage() {
  return loginVariantLoaders[getLoginVariant()]()
}

/** 已注册变体列表（便于后续配置页或文档引用） */
export function listLoginVariants(): LoginVariant[] {
  return Object.keys(loginVariantLoaders) as LoginVariant[]
}
