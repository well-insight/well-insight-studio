import type { App } from 'vue'
import { Lazyload } from 'vant'
import '@vant/touch-emulator'
import 'vant/lib/index.css'

export function setupVant(app: App) {
  app.use(Lazyload)
}
