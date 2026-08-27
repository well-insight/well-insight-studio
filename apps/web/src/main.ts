import { createWellInsight } from '@well-insight/ui'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@well-insight/ui/styles.css'
import './styles/index.css'

createApp(App).use(createPinia()).use(router).use(createWellInsight()).mount('#app')
