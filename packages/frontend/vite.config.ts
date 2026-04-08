import type { ConfigEnv, UserConfig } from "vite";
import path, { resolve } from "node:path";
import process from "node:process";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import UnoCSS from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import { loadEnv } from "vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons-ng";

const CWD = process.cwd();

const prefix = `monaco-editor/esm/vs`;

export default ({ mode }: ConfigEnv): UserConfig => {
  // 环境变量
  const { VITE_BASE_URL } = loadEnv(mode, CWD);
  return {
    base: VITE_BASE_URL, // 设置打包路径
    css: {
      modules: {
        localsConvention: "camelCase", // 默认只支持驼峰，修改为同时支持横线和驼峰
      },
      preprocessorOptions: {
        scss: {
          charset: false,
        },
        less: {
          charset: false,
        },
      },
    },
    plugins: [
      vue(),
      vueJsx(),
      UnoCSS({
        // mode: 'vue-scoped',
      }),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
          /\.md$/, // .md
        ],
        dts: true,
        imports: ["vue", "vue-router"],
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/assets/svgs")],
        // 指定symbolId格式
        symbolId: "icon-[dir]-[name]",
        svgoOptions: {
          plugins: [
            {
              name: "removeAttrs",
              params: {
                attrs: ["class", "data-name", "fill", "stroke"],
              },
            },
          ],
        },

        /**
         * 自定义插入位置
         * @default: body-last
         */
        inject: "body-last",

        /**
         * custom dom id
         * @default: __svg__icons__dom__
         */
        customDomId: "__svg__icons__dom__",
      }),
    ],
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "./src"),
        },
      ],
    },
    build: {
      cssCodeSplit: true, // 如果设置为false，整个项目中的所有 CSS 将被提取到一个 CSS 文件中
      sourcemap: false, // 构建后是否生成 source map 文件。如果为 true，将会创建一个独立的 source map 文件
      target: "es2020", // Vite 7 / esbuild 不再接受 "modules"，显式使用现代浏览器目标以兼容 Monaco workers
      chunkSizeWarningLimit: 550, // 单位kb  打包后文件大小警告的限制 (文件大于此此值会出现警告)
      assetsInlineLimit: 4096, // 单位字节（1024等于1kb） 小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。设置为 0 可以完全禁用此项。
      minify: "esbuild", // 当前项目体量较大，使用 esbuild 可避免 terser 压缩阶段过慢
      esbuild: {
        drop: ["console", "debugger"],
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
        output: {
          manualChunks: {
            jsonWorker: [`${prefix}/language/json/json.worker`],
            cssWorker: [`${prefix}/language/css/css.worker`],
            htmlWorker: [`${prefix}/language/html/html.worker`],
            tsWorker: [`${prefix}/language/typescript/ts.worker`],
            editorWorker: [`${prefix}/editor/editor.worker`],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["@vueuse/core", "element-plus", "vant", "lodash-es", "vuedraggable"],
    },
    server: {
      host: "0.0.0.0",
      port: 10086, // 设置服务启动端口号
      open: false, // 设置服务启动时是否自动打开浏览器
      cors: true, // 允许跨域

      // 设置代理，根据项目实际情况配置
      proxy: {
        // 代理所有 API 请求到 Express 服务器
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/v1/, "/api/v1"),
        },
        // 代理健康检查
        "/health": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
};
