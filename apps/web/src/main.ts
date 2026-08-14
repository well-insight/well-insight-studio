import { createApp } from 'vue'
import '@well-design/theme/styles.css'
import '@well-design/ui/styles.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
