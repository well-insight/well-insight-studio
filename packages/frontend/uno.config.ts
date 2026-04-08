import { defineConfig } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  rules: [
    ['border-around-1', { border: '1px solid var(--el-border-color)' }],
    ['border-top-1', { 'border-top': '1px solid var(--el-border-color)' }],
    ['border-end-1', { 'border-right': '1px solid var(--el-border-color)' }],
    ['border-start-1', { 'border-left': '1px solid var(--el-border-color)' }],
    ['border-bottom-1', { 'border-bottom': '1px solid var(--el-border-color)' }]
  ]
})
