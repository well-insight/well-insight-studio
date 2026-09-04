import { createWexDesign } from '@wex-design/ui'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@wex-design/ui/styles.css'
import './styles/index.css'

createApp(App).use(router).use(createWexDesign()).mount('#app')
