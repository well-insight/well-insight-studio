import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@well-insight/ui/styles.css'
import App from './App.vue'
import router from './router'
import { createWellInsight } from '@well-insight/ui'

createApp(App).use(createPinia()).use(router).use(createWellInsight()).mount('#app')
