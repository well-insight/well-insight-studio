import { createRouter, createWebHistory } from 'vue-router'
import ComponentPlayground from './views/ComponentPlayground.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'components',
      component: ComponentPlayground,
    },
    {
      path: '/:component',
      name: 'component-doc',
      component: ComponentPlayground,
    },
  ],
})

export default router
