import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { getCurrentInstance } from 'vue'

interface GlobalProperties {
  $$refs: any
  $route: RouteLocationNormalizedLoaded
  $router: Router
}

export function useGlobalProperties() {
  const globalProperties = getCurrentInstance()!.appContext.config.globalProperties as GlobalProperties

  const registerRef = (el, _vid: string) => el && (globalProperties.$$refs[_vid] = el)

  return {
    globalProperties,
    registerRef,
  }
}
