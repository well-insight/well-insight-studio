import antfu from '@antfu/eslint-config'

export default antfu({
  // 设置项目的类型，默认为 app
  type: 'lib',

  // 开始代码样式格式化
  // stylistic: true,

  // 或者你可以更加细粒度的设置
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },

  // TypeScript 和 Vue 是自动检测的，你也可以显式启用它们
  typescript: {
    overrides: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // vue: true,

  // 规则覆盖
  vue: {
    overrides: {
      'vue/operator-linebreak': ['error', 'before'],
    },
  },

  // 如果没有限制文件类型，则会为每一个文件进行规则重写
  overrides: {},

  // 关闭对 JSON 和 YAML 的支持
  jsonc: false,
  yaml: false,

  // 忽略某些文件或目录
  ignores: [
    '**/fixtures',
    // ...globs
  ],

  // 使用外部格式化程序来格式化 ESLint 尚无法处理的文件
  // 需要借助外部插件 eslint-plugin-format
  // 因此需要安装插件，否则会报错
  // 运行 npx eslint 会提示你缺少的插件
  formatters: {
    css: true,
    html: true,
    markdown: true,
  },

  // eslint-config 只对 Vue 和 TypeScript 有天然的支持
  // 如果你需要对第三方框架进行支持，需要自行开启
  // 开启后 运行 npx eslint 会提示你缺少的插件
  // 如 React Svelte Astro Solid UnoCSS
  // react: true,
})
