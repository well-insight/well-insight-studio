import { computed } from 'vue'
import mobileWidgets from './packages/mobile'

import pcWidgets from './packages/pc'
// import baseWidgets from '@/packages/base-widgets'
// import containerComponent from '@/packages/container-component'
import { useWorkspaceStoreWithout } from './stores/workspaceStore'

import { createVisualEditorConfig } from './visual-editor/visual-editor.utils'
import type { VisualEditorComponent } from './visual-editor/visual-editor.utils'
import { injectDatasetBindingProps } from './utils/datasetBinding'

const workspaceStore = useWorkspaceStoreWithout()

const isPcApp = computed(() => workspaceStore.currentApp?.clientType === 1)

export const visualConfig = createVisualEditorConfig()

registryVisual()

function registryVisual() {
  const { baseWidgets, containerComponent, formWidgets, chartWidgets } = pcWidgets
  // const { baseWidgets, containerComponent, formWidgets } = isPcApp ? pcWidgets : mobileWidgets
  // 注册基础控件
  const register = (
    moduleName: Parameters<typeof visualConfig.registry>[0],
    name: string,
    widget: VisualEditorComponent,
  ) => {
    visualConfig.registry(moduleName, name, injectDatasetBindingProps(widget))
  }

  Object.entries(baseWidgets).forEach(([name, widget]) => register('baseWidgets', name, widget))
  Object.entries(containerComponent).forEach(([name, widget]) =>
    register('containerComponents', name, widget),
  )
  Object.entries(formWidgets).forEach(([name, widget]) => register('formWidgets', name, widget))
  Object.entries(chartWidgets).forEach(([name, widget]) => register('chartWidgets', name, widget))

  console.log(
    `%c成功加载组件数量:${Object.keys(visualConfig.componentMap).length}`,
    'color:#409EFF;background-color:#ecf5ff;padding:0 10px;line-height:2;margin-bottom:4px;'
  )

  console.log('visualConfig:', visualConfig)
}
