/// <reference types="vite/client" />

// declare module 'vue-sketch-ruler' {
//     // @ts-ignore
//     import * as ruler from 'vue-sketch-ruler'
//
//     export default ruler;
// }

declare module 'virtual:svg-icons-register'

interface ViteTypeOptions {
  // 添加这行代码，你就可以将 ImportMetaEnv 的类型设为严格模式，
  // 这样就不允许有未知的键值了。
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  /**
   * https://picui.cn/ 图床token
   */
  readonly VITE_PIC_TOKEN: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
