import { fileURLToPath, URL } from 'node:url'
import { createHighlighter } from 'shiki'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import MarkdownPreview from 'vite-plugin-markdown-preview'

const highlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['vue', 'typescript', 'javascript', 'ts', 'js', 'tsx', 'jsx', 'css', 'html', 'json', 'bash', 'shell', 'markdown', 'md'],
})

function highlightCode(code: string, lang: string) {
  const normalized = lang.trim().split(/\s+/)[0] || 'text'
  const language = highlighter.getLoadedLanguages().includes(normalized as never)
    ? normalized
    : 'text'

  return highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false,
  })
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      wrapperClasses: 'wd-markdown-doc',
      markdownOptions: {
        highlight: highlightCode,
      },
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
