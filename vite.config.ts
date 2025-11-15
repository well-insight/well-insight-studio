import path, { resolve } from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons' // svg

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  console.log('運行環境', command)

  return {
    plugins: [
      vue(),
      UnoCSS(),
      AutoImport({
        resolvers: [
          ElementPlusResolver({
            // 关键：使用 Sass 预处理器样式
            importStyle: 'sass',
          }),
        ],
      }),
      Components({
        resolvers: [
          ElementPlusResolver({
            // 关键：使用 Sass 预处理器样式
            importStyle: 'sass',
          }),
        ],
      }),
      ElementPlus({
        useSource: true,
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [resolve(process.cwd(), 'src/assets/svgs/icons')],
        // 指定symbolId格式
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'removeAttrs',
              params: { attrs: ['fill', 'class', 'data-name', 'stroke'] },
            },
          ],
        },
      }),
      mockDevServerPlugin(),
      // viteMockServe 不生效 - 待解决
      // viteMockServe({
      //   mockPath: 'mock', // mock文件夹路径
      //   enable: command === 'serve', // 只有开发环境才开启mock
      // }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // 注意：使用 @use 规则
          additionalData: `@use "@/styles/element/theme-chalk.scss" as *;`,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 8999,
      proxy: {
        '^/api': {
          target: 'http://dummy-target-for-mock.com',
          changeOrigin: true,
        },
      },
    },
  }
})
