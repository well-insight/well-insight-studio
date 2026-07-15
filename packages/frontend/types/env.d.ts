/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 网站标题 */
  readonly VITE_APP_TITLE: string
  /** 网站部署的目录 */
  readonly VITE_BASE_URL: string
  /** API 接口路径 */
  readonly VITE_BASE_API: string
  /** 后端 API 完整地址 */
  readonly VITE_APP_API_URL: string
  /** socket 请求路径前缀 */
  readonly VITE_BASE_SOCKET_PATH: string
  /** socket 命名空间 */
  readonly VITE_BASE_SOCKET_NSP: string
  /** mock API 路径 */
  readonly VITE_MOCK_API: string
  /**
   * 登录页变体：classic（分栏动画） | business（业务插画） | hero（纯英雄图）
   * 新增变体请在 views/auth/loginVariants.ts 注册
   */
  readonly VITE_LOGIN_VARIANT: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
