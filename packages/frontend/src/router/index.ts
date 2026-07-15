import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress' // progress bar
import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuthStore } from '@/stores/auth'
import { loadLoginPage } from '@/views/auth/loginVariants'
import 'nprogress/css/nprogress.css' // 进度条样式

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const routes2: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: loadLoginPage,
    meta: {
      title: '登录',
      public: true,
    },
  },
  // 独立页面公开预览
  {
    path: '/page-preview/:id',
    name: 'PagePreview',
    component: () => import('@/views/page-factory/PagePreview.vue'),
    meta: { title: '页面预览' },
  },
  // 带 Layout 的主应用
  {
    path: '/',
    redirect: '/project/pages',
    component: () => import('@/layout/index.vue'),
    meta: { title: '项目' },
    children: [
      // 页面设计 - 可视化
      {
        path: 'project/pages',
        name: 'VisualDesign',
        component: () => import('@/views/page-factory/VisualDesignList.vue'),
        meta: { title: '可视化设计' },
      },
      // 页面设计 - 表单
      {
        path: 'project/pages/form',
        name: 'PageListForm',
        component: () => import('@/views/page-factory/FormDesignList.vue'),
        meta: { title: '表单设计' },
      },
      // 页面设计 - 报表
      {
        path: 'project/pages/report',
        name: 'PageListReport',
        component: () => import('@/views/page-factory/ReportDesignList.vue'),
        meta: { title: '报表设计' },
      },
      // 页面编辑 - 新建
      {
        path: 'project/pages/edit/new/:type',
        name: 'PageEditorNew',
        components: {
          default: () => import('@/views/page-factory/PageEditor.vue'),
          headerActions: () => import('@/views/page-factory/components/PageEditorActions.vue'),
        },
        meta: { title: '新建页面' },
      },
      // 页面编辑 - 编辑已有
      {
        path: 'project/pages/edit/:id',
        name: 'PageEditor',
        components: {
          default: () => import('@/views/page-factory/PageEditor.vue'),
          headerCenter: () => import('@/views/page-factory/components/PageTitle.vue'),
          headerActions: () => import('@/views/page-factory/components/PageEditorActions.vue'),
        },
        meta: { title: '页面编辑' },
      },
      // 应用集
      {
        path: 'project/app-assembly',
        name: 'AppAssemblyList',
        component: () => import('@/views/app-assembly/AppList.vue'),
        meta: { title: '应用集' },
      },
      {
        path: 'project/app-assembly/:id',
        name: 'AppAssembly',
        component: () => import('@/views/app-assembly/AppAssemblyEditor.vue'),
        meta: { title: '组装编辑' },
      },
      // 数据集
      {
        path: 'project/dataset',
        name: 'Dataset',
        component: () => import('@/views/dataset/Dataset.vue'),
        meta: { title: '数据集' },
      },
      {
        path: 'project/dataset/edit/:id(.*)*',
        name: 'DatasetEdit',
        component: () => import('@/views/dataset/DatasetEdit.vue'),
        meta: { title: '数据集编辑' },
      },
      // 数据连接
      {
        path: 'project/api',
        name: 'Api',
        component: () => import('@/views/connector/Connector.vue'),
        meta: { title: '数据连接' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes2,
  strict: true,
})

router.beforeEach((to) => {
  NProgress.start()
  const auth = getAuthStore()
  const isPublic = to.matched.some(record => record.meta.public === true)

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
