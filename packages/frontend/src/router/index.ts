import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress' // progress bar
import { createRouter, createWebHashHistory } from 'vue-router'
import 'nprogress/css/nprogress.css' // 进度条样式
import { getAuthStore } from '@/stores/auth'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const routes2: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      public: true
    }
  }, {
    path: '/',
    redirect: '/project/application',
    children: [
      {
        path: 'project',
        name: 'Project',
        redirect: '/project/application',
        component: () => import('@/layout/index.vue'),
        meta: {
          title: '项目'
        },
        children: [
          {
            path: 'application',
            name: 'Application',
            component: () => import('@/views/application/AppList.vue'),
            meta: {
              title: '应用集'
            }
          },
          {
            path: 'application/edit/:id(.*)*',
            name: 'ApplicationEdit',
            component: () => import('@/views/application/AppEdit.vue'),
            meta: {
              title: '应用编辑'
            }
          },
          {
            path: 'dataset',
            name: 'Dataset',
            component: () => import('@/views/dataset/Dataset.vue'),
            meta: {
              title: '数据集'
            }
          },
          {
            path: 'dataset/edit/:id(.*)*',
            name: 'DatasetEdit',
            component: () => import('@/views/dataset/DatasetEdit.vue'),
            meta: {
              title: '数据集编辑'
            }
          },
          {
            path: 'api',
            name: 'Api',
            component: () => import('@/views/connector/Connector.vue'),
            meta: {
              title: '数据连接'
            }
          },
          {
            path: 'automation',
            name: 'Automation',
            component: () => import('@/views/dataset/Dataset.vue'),
            meta: {
              title: '自动化'
            }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes2,
  strict: true
})

router.beforeEach((to) => {
  NProgress.start()
  const auth = getAuthStore()
  const isPublic = to.matched.some((record) => record.meta.public === true)

  if (!auth.token && !isPublic) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (auth.token && to.name === 'Login') {
    return { path: '/' }
  }
  return true
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})

export default router
