import { computed } from 'vue'
import mobileWidgets from './packages/mobile'

import pcWidgets from './packages/pc'
// import baseWidgets from '@/packages/base-widgets'
// import containerComponent from '@/packages/container-component'
import { useWorkspaceStoreWithout } from './store/workspaceStore/workspaceStore'

import { createVisualEditorConfig } from './visual-editor/visual-editor.utils'

const workspaceStore = useWorkspaceStoreWithout()

const isPcApp = computed(() => workspaceStore.currentApp?.clientType === 1)

export const visualConfig = createVisualEditorConfig()

registryVisual()

function registryVisual() {
  const { baseWidgets, containerComponent, formWidgets } = pcWidgets
  // const { baseWidgets, containerComponent, formWidgets } = isPcApp ? pcWidgets : mobileWidgets
  // 注册基础控件
  Object.entries(baseWidgets).forEach(([name, widget]) => visualConfig.registry('baseWidgets', name, widget))
  // 注册容器组件
  Object.entries(containerComponent).forEach(([name, widget]) =>
    visualConfig.registry('containerComponents', name, widget)
  )
  Object.entries(formWidgets).forEach(([name, widget]) => visualConfig.registry('formWidgets', name, widget))

  console.log(
    `%c成功加载组件数量:${Object.keys(visualConfig.componentMap).length}`,
    'color:#409EFF;background-color:#ecf5ff;padding:0 10px;line-height:2;margin-bottom:4px;'
  )

  console.log('visualConfig:', visualConfig)
}
