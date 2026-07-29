import type { DialogConfigContext } from 'element-plus'
import type { App } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import '@/styles/element/index.scss'

export function setupElementPlus(app: App) {
  app.use(ElementPlus, { locale: zhCn, dialog: { transition: 'dialog-scale', draggable: true, appendTo: 'body' } as DialogConfigContext })
}
