import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/studio',
      name: 'studio',
      component: () => import('../modules/studio/StudioView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/present',
      name: 'present',
      component: () => import('../modules/studio/PresentView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthView.vue'),
      meta: { guestOnly: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  await authStore.init()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guestOnly && authStore.isLoggedIn) {
    next({ path: '/' })
    return
  }

  next()
})

export default router
