import { createApp } from 'vue'
import '@well-insight/ui/styles.css'
import App from './App.vue'
import router from './router'
import { createWellInsight } from '@well-insight/ui'

createApp(App).use(router).use(createWellInsight()).mount('#app')
