import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import MarkdownPreview from 'vite-plugin-markdown-preview'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      wrapperClasses: 'wd-markdown-doc',
    }),
    MarkdownPreview(),
  ],
  resolve: {
    alias: [
      {
        find: '@well-design/ui/styles.css',
        replacement: fileURLToPath(new URL('../src/styles/index.css', import.meta.url)),
      },
      {
        find: '@well-design/ui',
        replacement: fileURLToPath(new URL('../src', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  server: {
    port: 5182,
  },
})
