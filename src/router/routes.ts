export default [
  { path: '/', redirect: '/home' },
  { path: '/login', component: () => import('../layout/login/Login.vue'), name: 'Login' },
  {
    path: '/home',
    redirect: '/design',
    component: () => import('@/layout/Layout.vue'),
    children: [
      {
        path: '/design',
        name: '界面设计',
        component: () => import('@/views/design/index.vue'),
      },
      {
        path: '/market',
        name: '模板市场',
        component: () => import('@/views/market/index.vue'),
      },
      {
        path: '/assembly',
        name: '组件',
        component: () => import('@/views/assembly/index.vue'),
      },
      {
        path: '/boardsheet',
        name: '数据集',
        component: () => import('@/views/boardsheet/index.vue'),
      },
      {
        path: '/system-info',
        name: '系统信息',
        component: () => import('@/views/system-info/index.vue'),
      },
      // {
      //     path: '/manage/userManage',
      //     name: '用户管理',
      //     component: import('@/views/Pages/manage/UserManage/index.vue'),
      // },
      // {
      //     path: '/manage/userGroupManage',
      //     name: '组织管理',
      //     component: import('@/views/Pages/manage/userGroupManage/index.vue'),
      // },
      // {
      //     path: '/errPage/is404',
      //     name: '404',
      //     component: import('@/views/Pages/errPage/Is404/index.vue'),
      // },
      // {
      //     path: '/errPage/is500',
      //     name: '500',
      //     component: import('@/views/Pages/errPage/Is500/index.vue'),
      // },
    ],
  },
  {
    path: '/design/design-space',
    name: '工作空间',
    component: () => import('@/views/design/design-space/index.vue'),
    meta: {
      title: '工作空间',
    },
  },
  {
    path: '/preview',
    name: '预览',
    component: () => import('@/views/design/Preview.vue'),
  },
  {
    path: '/demos',
    name: '演示测试',
    component: () => import('@/demos/ElementDrag.vue'),
  },
  {
    path: '/properMenu',
    name: '演示测试',
    component: () => import('@/demos/ProperMenu.vue'),
  },
  {
    path: '/html2png',
    name: '演示测试',
    component: () => import('@/demos/Html2png.vue'),
  },
]
