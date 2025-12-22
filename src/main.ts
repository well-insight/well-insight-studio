import * as ElIcons from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
// import './api/mock/index'
import svgIcon from '@/assets/svgs/index.vue'
import Echarts from '@/components/Echarts/index.vue' // echarts组件
import WeiCol from '@/components/Layout/Col/index.vue'
import WeiRow from '@/components/Layout/Row/index.vue'
import customComponents from '@/custom-components/index'
import App from './App.vue'
import router from './router/index' // 引入router
// import 'element-plus/dist/index.css'
import './styles/element/index.scss'
import 'virtual:svg-icons-register'
// import waycloudUI from '@waycloud/ui'
import 'animate.css' // 引入
import 'virtual:uno.css'

const app = createApp(App)
const pinia = createPinia()

// 全局组件
for (const name in ElIcons) {
  app.component(name, (ElIcons as any)[name])
}
app.component('svg-icon', svgIcon)
app.component('wei-row', WeiRow)
app.component('wei-col', WeiCol)
app.component('Echarts', Echarts)

// 自定义组件注册
for (let i = 0; i < customComponents.length; i++) {
  const item = customComponents[i]
  if (item) {
    app.component(item.name, item.component)
  }
}

app.use(router).use(pinia)

// 自定义指令
// 使 v-focus 在所有组件中都可用
app.directive('focus', {
  created(el, _binding, _vnode, _prevVnode) {
    el.focus()
  },
})

app.mount('#app')
