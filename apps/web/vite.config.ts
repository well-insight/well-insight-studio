import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    dedupe: ['vue'],
  },
  server: {
    port: 5181,
    strictPort: true,
  },
})
