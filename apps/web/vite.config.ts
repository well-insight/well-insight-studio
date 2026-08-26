import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(rootDir, '../..')
/** Sibling checkout: my-projects/well-insight-ui */
const uiRoot = path.resolve(workspaceRoot, '../well-insight-ui')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Dev + build: resolve to local UI source for HMR / latest components.
    // Package itself is still linked via package.json (`link:…`) for types / tooling.
    alias: [
      {
        find: '@well-insight/ui/styles.css',
        replacement: path.join(uiRoot, 'src/styles/index.css'),
      },
      {
        find: /^@well-insight\/ui$/,
        replacement: path.join(uiRoot, 'src/index.ts'),
      },
    ],
    dedupe: ['vue'],
  },
  server: {
    port: 5181,
    fs: {
      allow: [workspaceRoot, uiRoot],
    },
  },
  optimizeDeps: {
    exclude: ['@well-insight/ui'],
  },
})
