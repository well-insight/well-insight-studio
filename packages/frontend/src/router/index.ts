import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress' // progress bar
import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuthStore } from '@/stores/auth'
import 'nprogress/css/nprogress.css' // 进度条样式

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const routes2: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      public: true,
    },
  },
  {
    path: '/',
    redirect: '/project/visual-design',
    children: [
      // ========== 独立页面公开预览（无需登录） ==========
      {
        path: '/page-preview/:id',
        name: 'PagePreview',
        component: () => import('@/views/page-factory/PagePreview.vue'),
        meta: {
          title: '页面预览',
        },
      },
      // ========== 应用预览（运行时） ==========
      {
        path: '/project/application/view/:id(.*)*',
        name: 'ApplicationView',
        component: () => import('@/views/application/AppView.vue'),
        meta: {
          title: '应用预览',
        },
      },
      {
        path: 'project',
        name: 'Project',
        redirect: '/project/visual-design',
        component: () => import('@/layout/index.vue'),
        meta: {
          title: '项目',
        },
        children: [
          // ========== 页面设计（可视化/表单/报表三合一列表） ==========
          {
            path: 'visual-design',
            name: 'VisualDesign',
            component: () => import('@/views/page-factory/PageList.vue'),
            meta: {
              title: '页面设计',
            },
          },

          // ========== 可视化编辑器（现有应用编辑器，URL直接访问） ==========
          {
            path: 'application/edit/:id(.*)*',
            name: 'ApplicationEdit',
            components: {
              default: () => import('@/views/application/AppEdit.vue'),
              headerActions: () => import('@/visual-editor/ui/workbench/edit-tools/EditToolsAppActions.vue'),
            },
            meta: {
              title: '可视化编辑',
            },
          },

          // ========== 页面生产车间（表单/报表列表） ==========
          {
            path: 'form-design',
            name: 'FormDesign',
            component: () => import('@/views/page-factory/PageList.vue'),
            meta: {
              title: '表单设计',
            },
          },
          {
            path: 'report-design',
            name: 'ReportDesign',
            component: () => import('@/views/page-factory/PageList.vue'),
            meta: {
              title: '报表设计',
            },
          },

          // ========== 独立编辑器 ==========
          {
            path: 'page-editor/new/:type',
            name: 'PageEditorNew',
            components: {
              default: () => import('@/views/page-factory/PageEditor.vue'),
              headerActions: () => import('@/views/page-factory/components/PageEditorActions.vue'),
            },
            meta: {
              title: '新建页面',
            },
          },
          {
            path: 'page-editor/:id',
            name: 'PageEditor',
            components: {
              default: () => import('@/views/page-factory/PageEditor.vue'),
              headerActions: () => import('@/views/page-factory/components/PageEditorActions.vue'),
            },
            meta: {
              title: '页面编辑',
            },
          },

          // ========== 应用组装车间 ==========
          {
            path: 'app-assembly',
            name: 'AppAssemblyList',
            component: () => import('@/views/app-assembly/AppList.vue'),
            meta: {
              title: '应用组装',
            },
          },
          {
            path: 'app-assembly/:id',
            name: 'AppAssembly',
            component: () => import('@/views/app-assembly/AppAssemblyEditor.vue'),
            meta: {
              title: '组装编辑',
            },
          },

          // ========== 数据集（保留） ==========
          {
            path: 'dataset',
            name: 'Dataset',
            component: () => import('@/views/dataset/Dataset.vue'),
            meta: {
              title: '数据中枢',
            },
          },
          {
            path: 'dataset/edit/:id(.*)*',
            name: 'DatasetEdit',
            component: () => import('@/views/dataset/DatasetEdit.vue'),
            meta: {
              title: '数据集编辑',
            },
          },

          // ========== 数据连接（保留） ==========
          {
            path: 'api',
            name: 'Api',
            component: () => import('@/views/connector/Connector.vue'),
            meta: {
              title: '数据连接',
            },
          },
        ],
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
